import React, { useEffect, useRef } from 'react';
import { Map as GoogleMap, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

interface MapProps {
  source: string;
  destination: string;
  selectedRoute?: google.maps.DirectionsRoute | null;
}

/**
 * Custom route renderer that draws:
 * - Bold solid red polylines for TRANSIT steps
 * - Dotted red polylines for WALKING steps
 * - Large bold circle markers at every transit station stop
 */
const CustomRouteRenderer: React.FC<{
  selectedRoute?: google.maps.DirectionsRoute | null;
}> = ({ selectedRoute }) => {
  const map = useMap();
  const coreLibrary = useMapsLibrary('core');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const markersRef = useRef<google.maps.Marker[]>([]);

  // Cleanup helper
  const clearOverlays = () => {
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
  };

  useEffect(() => {
    if (!map || !coreLibrary) return;

    // Clear previous overlays
    clearOverlays();

    if (!selectedRoute || !selectedRoute.legs || selectedRoute.legs.length === 0) {
      return;
    }

    const leg = selectedRoute.legs[0];
    const bounds = new google.maps.LatLngBounds();

    // ── Origin marker ──
    if (leg.start_location) {
      const originMarker = new google.maps.Marker({
        position: leg.start_location,
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#16a34a',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
        zIndex: 100,
        title: leg.start_address || 'Origin',
      });
      markersRef.current.push(originMarker);
      bounds.extend(leg.start_location);
    }

    // ── Destination marker ──
    if (leg.end_location) {
      const destMarker = new google.maps.Marker({
        position: leg.end_location,
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#dc2626',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
        zIndex: 100,
        title: leg.end_address || 'Destination',
      });
      markersRef.current.push(destMarker);
      bounds.extend(leg.end_location);
    }

    // ── Draw each step ──
    if (leg.steps) {
      leg.steps.forEach((step: google.maps.DirectionsStep) => {
        // Decode the path for this step
        const path = step.path || (step as any).lat_lngs || [];
        if (path.length === 0) return;

        // Extend bounds
        path.forEach((point: google.maps.LatLng) => bounds.extend(point));

        if (step.travel_mode === google.maps.TravelMode.TRANSIT) {
          // ── TRANSIT: Bold solid red line ──
          const transitLine = new google.maps.Polyline({
            path,
            map,
            strokeColor: '#dc2626',
            strokeWeight: 6,
            strokeOpacity: 1.0,
            zIndex: 10,
          });
          polylinesRef.current.push(transitLine);

          // ── Station stop markers ──
          const transitDetails = step.transit;
          if (transitDetails) {
            // Departure stop
            if (transitDetails.departure_stop?.location) {
              const depMarker = new google.maps.Marker({
                position: transitDetails.departure_stop.location,
                map,
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: '#dc2626',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 3,
                },
                zIndex: 50,
                title: transitDetails.departure_stop.name || 'Station',
              });
              markersRef.current.push(depMarker);
            }
            // Arrival stop
            if (transitDetails.arrival_stop?.location) {
              const arrMarker = new google.maps.Marker({
                position: transitDetails.arrival_stop.location,
                map,
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: '#dc2626',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 3,
                },
                zIndex: 50,
                title: transitDetails.arrival_stop.name || 'Station',
              });
              markersRef.current.push(arrMarker);
            }

            // Intermediate stops
            if (transitDetails.num_stops && transitDetails.num_stops > 1) {
              // The API doesn't always give intermediate stop coords,
              // but we can mark evenly spaced points along the path
              // For now, just mark departure and arrival
            }
          }
        } else if (step.travel_mode === google.maps.TravelMode.WALKING) {
          // ── WALKING: Dotted red line ──
          const walkLine = new google.maps.Polyline({
            path,
            map,
            strokeColor: '#dc2626',
            strokeWeight: 0, // The line itself is invisible; dots come from icons
            strokeOpacity: 0,
            zIndex: 5,
            icons: [
              {
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 2.5,
                  fillColor: '#dc2626',
                  fillOpacity: 0.9,
                  strokeColor: '#dc2626',
                  strokeWeight: 1,
                },
                offset: '0',
                repeat: '12px',
              },
            ],
          });
          polylinesRef.current.push(walkLine);
        }
      });
    }

    // Fit the map bounds with some padding
    map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });

    // Cleanup on unmount or before next render
    return () => {
      clearOverlays();
    };
  }, [map, coreLibrary, selectedRoute]);

  return null;
};

const Map: React.FC<MapProps> = ({ selectedRoute }) => {
  const defaultCenter = { lat: 40.7128, lng: -74.0060 };

  return (
    <div className="map-container" style={{ flex: 1, width: '100%', height: '100%' }}>
      <GoogleMap
        defaultCenter={defaultCenter}
        defaultZoom={12}
        gestureHandling={'greedy'}
        disableDefaultUI={false}
        mapTypeControl={false}
        streetViewControl={false}
        style={{ width: '100%', height: '100%' }}
      >
        <CustomRouteRenderer selectedRoute={selectedRoute} />
      </GoogleMap>
    </div>
  );
};

export default Map;
