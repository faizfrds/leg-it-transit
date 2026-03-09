import React, { useState, useEffect } from 'react';
import './index.css';
import Sidebar from './components/Sidebar';
import Map from './components/Map';
import type { RouteOption, Location } from './types';
import { useMapsLibrary, APIProvider } from '@vis.gl/react-google-maps';

function AppInner() {
  const [sourceLocation, setSourceLocation] = useState<Location | null>(null);
  const [sourceInput, setSourceInput] = useState('');
  
  const [destLocation, setDestLocation] = useState<Location | null>(null);
  const [destInput, setDestInput] = useState('');
  
  const [walkPreference, setWalkPreference] = useState(50);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const routesLibrary = useMapsLibrary('routes');
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService>();

  useEffect(() => {
    if (!routesLibrary) return;
    setDirectionsService(new routesLibrary.DirectionsService());
  }, [routesLibrary]);

  // Compute the selected route data to pass to the map
  const selectedRoute = routes.find(r => r.id === selectedRouteId)?.routeData || null;

  const calculateRoutes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceLocation || !destLocation || !directionsService) return;

    setIsLoading(true);
    setRoutes([]);
    setSelectedRouteId(null);

    directionsService
      .route({
        origin: { lat: sourceLocation.lat, lng: sourceLocation.lng },
        destination: { lat: destLocation.lat, lng: destLocation.lng },
        travelMode: google.maps.TravelMode.TRANSIT,
        provideRouteAlternatives: true,
        transitOptions: {
          routingPreference: google.maps.TransitRoutePreference.FEWER_TRANSFERS,
        },
      })
      .then((response: google.maps.DirectionsResult) => {
        setIsLoading(false);

        if (!response || !response.routes || response.routes.length === 0) {
          setRoutes([]);
          alert('Could not find a transit route between these locations.');
          return;
        }

        const generatedRoutes: RouteOption[] = response.routes.map(
          (route: google.maps.DirectionsRoute, index: number) => {
            let transitTime = 0;
            let walkTime = 0;
            let totalDurationSeconds = 0;
            const steps: RouteOption['steps'] = [];

            if (route.legs && route.legs.length > 0) {
              const leg = route.legs[0];
              totalDurationSeconds = leg.duration?.value || 0;

              if (leg.steps) {
                leg.steps.forEach((step: google.maps.DirectionsStep) => {
                  if (step.travel_mode === google.maps.TravelMode.WALKING) {
                    walkTime += step.duration?.value || 0;
                    steps.push({
                      mode: 'WALKING',
                      duration: step.duration?.text || '',
                      instruction: step.instructions || 'Walk',
                    });
                  } else if (step.travel_mode === google.maps.TravelMode.TRANSIT) {
                    transitTime += step.duration?.value || 0;
                    const transit = step.transit;
                    steps.push({
                      mode: 'TRANSIT',
                      duration: step.duration?.text || '',
                      instruction: step.instructions || 'Take transit',
                      lineName: transit?.line?.short_name || transit?.line?.name || '',
                      lineColor: transit?.line?.color || '#dc2626',
                      vehicleType: transit?.line?.vehicle?.type || '',
                      departureStop: transit?.departure_stop?.name || '',
                      arrivalStop: transit?.arrival_stop?.name || '',
                      numStops: transit?.num_stops || 0,
                    });
                  }
                });
              }
            }

            transitTime = Math.round(transitTime / 60);
            walkTime = Math.round(walkTime / 60);

            let type: 'fastest' | 'active' = 'fastest';
            if (walkTime > 15 || walkTime > transitTime) {
              type = 'active';
            }

            return {
              id: `r${index}`,
              totalTime: route.legs[0]?.duration?.text || 'Unknown',
              durationSeconds: totalDurationSeconds,
              transitTime,
              walkTime,
              type,
              label: type === 'active' ? 'Walk-Optimized' : 'Fastest Route',
              description:
                route.summary ||
                `Via ${
                  route.legs[0]?.steps?.find(
                    (s: google.maps.DirectionsStep) =>
                      s.travel_mode === google.maps.TravelMode.TRANSIT
                  )?.transit?.line?.name || 'Transit'
                }`,
              fare: (route.fare as any)?.text || 'Standard Fare',
              routeData: route,
              steps,
            };
          }
        );

        // Sort based on walk preference
        generatedRoutes.sort((a, b) => {
          if (walkPreference < 33) {
            return a.walkTime - b.walkTime || a.durationSeconds - b.durationSeconds;
          } else if (walkPreference > 66) {
            return b.walkTime - a.walkTime || a.durationSeconds - b.durationSeconds;
          } else {
            return a.durationSeconds - b.durationSeconds;
          }
        });

        setRoutes(generatedRoutes);
        if (generatedRoutes.length > 0) {
          setSelectedRouteId(generatedRoutes[0].id);
        }
      })
      .catch((err: Error) => {
        setIsLoading(false);
        console.error('Directions request failed:', err);
        alert('Could not calculate a route between these locations. Make sure both locations have transit options.');
        setRoutes([]);
      });
  };

  return (
    <div className="App" style={{ display: 'flex', width: '100%', height: '100%' }}>
      <Sidebar
        sourceLocation={sourceLocation}
        setSourceLocation={setSourceLocation}
        sourceInput={sourceInput}
        setSourceInput={setSourceInput}
        destLocation={destLocation}
        setDestLocation={setDestLocation}
        destInput={destInput}
        setDestInput={setDestInput}
        walkPreference={walkPreference}
        setWalkPreference={setWalkPreference}
        onSubmit={calculateRoutes}
        routes={routes}
        selectedRouteId={selectedRouteId}
        onSelectRoute={setSelectedRouteId}
        isLoading={isLoading}
      />
      <Map
        source={sourceLocation ? sourceLocation.address : 'Select Starting Point'}
        destination={destLocation ? destLocation.address : 'Select Destination'}
        selectedRoute={selectedRoute}
      />
    </div>
  );
}

function App() {
  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API || ''}>
      <AppInner />
    </APIProvider>
  );
}

export default App;
