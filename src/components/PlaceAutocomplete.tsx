import React, { useState, useEffect, useRef } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import type { Location } from '../types';

interface PlaceAutocompleteProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (location: Location | null) => void;
  placeholder?: string;
}

const PlaceAutocomplete: React.FC<PlaceAutocompleteProps> = ({
  id,
  value,
  onChange,
  onPlaceSelect,
  placeholder = 'Search for a place...'
}) => {
  const [placeAutocomplete, setPlaceAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const places = useMapsLibrary('places');

  useEffect(() => {
    if (!places || !inputRef.current) return;

    const autocomplete = new places.Autocomplete(inputRef.current, {
      fields: ['place_id', 'geometry', 'name', 'formatted_address'],
    });

    setPlaceAutocomplete(autocomplete);
  }, [places]);

  useEffect(() => {
    if (!placeAutocomplete) return;

    placeAutocomplete.addListener('place_changed', () => {
      const place = placeAutocomplete.getPlace();
      
      if (place.geometry?.location) {
        // Place selected from dropdown
        const address = place.name || place.formatted_address || '';
        onChange(address);
        onPlaceSelect({
          address: address,
          placeId: place.place_id,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        });
      } else {
        // User typed something but didn't select a specific place or API failed
        onPlaceSelect(null);
      }
    });

    // Cleanup
    return () => {
      google.maps.event.clearInstanceListeners(placeAutocomplete);
    };
  }, [placeAutocomplete, onChange, onPlaceSelect]);

  return (
    <input
      id={id}
      ref={inputRef}
      type="text"
      className="input-field"
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
        if (e.target.value === '') {
          onPlaceSelect(null); // Clear selected location if input is cleared
        }
      }}
      placeholder={placeholder}
    />
  );
};

export default PlaceAutocomplete;
