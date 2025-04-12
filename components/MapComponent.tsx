'use client'

import { useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'

// Initialize Mapbox
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

interface MapComponentProps {
  onLocationChange: (location: { lat: number, lng: number, placeName: string }) => void
  initialLocation: { lat: number, lng: number, placeName: string }
  onError: (error: string) => void
}

export default function MapComponent({ onLocationChange, initialLocation, onError }: MapComponentProps) {
  const [map, setMap] = useState<mapboxgl.Map | null>(null)
  const [marker, setMarker] = useState<mapboxgl.Marker | null>(null)
  const [geocoder, setGeocoder] = useState<MapboxGeocoder | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const updateLocationFromCoordinates = async (map: mapboxgl.Map, lng: number, lat: number) => {
    try {
      // Get address from coordinates
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const placeName = data.features[0].place_name;
        onLocationChange({ lat, lng, placeName });

        // Update geocoder input
        const geocoderInput = document.querySelector('.mapboxgl-ctrl-geocoder input') as HTMLInputElement;
        if (geocoderInput) {
          geocoderInput.value = placeName;
        }
      }

      // Fly to location
      map.flyTo({
        center: [lng, lat],
        zoom: 12
      });
    } catch (error) {
      console.error('Error updating location:', error);
      onError('Failed to update location. Please try again.');
    }
  };

  // Map initialization effect
  useEffect(() => {
    if (!mapboxgl.accessToken) {
      onError('Mapbox token is missing. Please check your environment variables.');
      setIsLoading(false);
      return;
    }

    try {
      const newMap = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [initialLocation.lng, initialLocation.lat],
        zoom: 3
      });

      // Add navigation controls
      newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Create geocoder
      const newGeocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        placeholder: 'Search for a location',
        marker: false
      });

      // Add geocoder to the DOM
      const geocoderContainer = document.getElementById('geocoder-container');
      if (geocoderContainer) {
        // Clear any existing content
        geocoderContainer.innerHTML = '';
        geocoderContainer.appendChild(newGeocoder.onAdd(newMap));
      }

      // Create initial marker
      const initialMarker = new mapboxgl.Marker({
        draggable: true
      })
        .setLngLat([initialLocation.lng, initialLocation.lat])
        .addTo(newMap);
      setMarker(initialMarker);

      // Handle marker drag end
      initialMarker.on('dragend', () => {
        const lngLat = initialMarker.getLngLat();
        updateLocationFromCoordinates(newMap, lngLat.lng, lngLat.lat);
      });

      // Handle map click
      newMap.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        initialMarker.setLngLat([lng, lat]);
        updateLocationFromCoordinates(newMap, lng, lat);
      });

      // Handle geocoder result
      newGeocoder.on('result', (event) => {
        const [lng, lat] = event.result.center;
        initialMarker.setLngLat([lng, lat]);
        updateLocationFromCoordinates(newMap, lng, lat);
      });

      setMap(newMap);
      setGeocoder(newGeocoder);
      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing map:', error);
      onError('Failed to initialize map. Please try again.');
      setIsLoading(false);
    }

    return () => {
      if (map) {
        map.remove();
      }
      if (geocoder) {
        const geocoderContainer = document.getElementById('geocoder-container');
        if (geocoderContainer) {
          geocoderContainer.innerHTML = '';
        }
      }
    };
  }, [initialLocation, onLocationChange, onError]);

  if (isLoading) {
    return (
      <div className="h-64 bg-gray-200 rounded-md flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return null; // The map is rendered in the DOM via the container
} 