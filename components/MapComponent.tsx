'use client'

import { useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'
// Remove MapboxGeocoder import
// import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import 'mapbox-gl/dist/mapbox-gl.css'
// Remove MapboxGeocoder CSS import
// import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'

// Remove Mapbox Geocoder type declaration
// declare module '@mapbox/mapbox-gl-geocoder' {
//   import { IControl } from 'mapbox-gl';
// ... (removed full type declaration) ...
// }

// Initialize Mapbox
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

interface MapComponentProps {
  onLocationChange: (location: { lat: number, lng: number, placeName: string }) => void
  initialLocation: { lat: number, lng: number, placeName: string }
  onError: (error: string) => void
  initialZoom?: number // Keep initialZoom prop as it controls map zoom
}

export default function MapComponent({ onLocationChange, initialLocation, onError, initialZoom = 3 }: MapComponentProps) {
  const [map, setMap] = useState<mapboxgl.Map | null>(null)
  const [marker, setMarker] = useState<mapboxgl.Marker | null>(null)
  // Remove geocoder state
  // const [geocoder, setGeocoder] = useState<MapboxGeocoder | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Simplified updateLocationFromCoordinates - only calls onLocationChange with coordinates
  const updateLocationFromCoordinates = (map: mapboxgl.Map, lng: number, lat: number) => {
    onLocationChange({ lat, lng, placeName: '' }); // Only update coordinates

    // Optional: keep map centered on pin during drag
    map.setCenter([lng, lat]);
    // Optional: adjust zoom during drag, or keep it fixed
    // map.setZoom(map.getZoom());
  };

  // Map initialization effect
  useEffect(() => {
    if (!mapboxgl.accessToken) {
      onError('Mapbox token is missing. Please check your environment variables.');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Using Mapbox Access Token:', mapboxgl.accessToken);
      const newMap = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [initialLocation.lng, initialLocation.lat],
        zoom: initialZoom // Use the initialZoom prop
      });

      // Add navigation controls
      newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Remove geocoder creation and adding to DOM
      // const newGeocoder = new MapboxGeocoder({...});
      // const geocoderContainer = document.getElementById('geocoder-container');
      // if (geocoderContainer) { ... }

      // Create initial marker
      const initialMarker = new mapboxgl.Marker({
        draggable: true
      })
        .setLngLat([initialLocation.lng, initialLocation.lat])
        .addTo(newMap);
      setMarker(initialMarker);

      // Handle marker drag end - update location coordinates only
      initialMarker.on('dragend', () => {
        const lngLat = initialMarker.getLngLat();
        onLocationChange({ lat: lngLat.lat, lng: lngLat.lng, placeName: '' }); // Update with coordinates only
      });

      // Handle map click - move marker and update location coordinates only
      newMap.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        // Use flyTo for smooth transition
        newMap.flyTo({
          center: [lng, lat],
          zoom: newMap.getZoom(), // Keep current zoom level
          essential: true // This animation is considered essential
        });
        // Remove immediate marker and location update
        // initialMarker.setLngLat([lng, lat]);
        // onLocationChange({ lat, lng, placeName: '' }); // Update with coordinates only
      });

      // Handle map moveend event to update marker and location after animation
      newMap.on('moveend', (e) => {
        // Check if the moveend event was user-initiated (e.g., by click or dragend)
        // Mapbox GL JS events often have originalEvent or a source property
        // A robust check might involve tracking a flag set in click/dragend
        // For simplicity, we'll update if the map center is very close to the initialLocation, or if a flag is set.
        // A better approach is to set a flag in click/dragend and check it here.

        // Simplified check: Assume moveend after a flyTo or user interaction is intended to update marker
        // A more precise check could involve comparing the map center to the marker position or checking event flags.
        const center = newMap.getCenter();
        const markerLngLat = initialMarker.getLngLat();
        const distance = Math.sqrt(Math.pow(center.lng - markerLngLat.lng, 2) + Math.pow(center.lat - markerLngLat.lat, 2));

        // Update marker and location if the map center is not already at the marker's position (prevents updates on initial load moveend)
        // and if the move was likely user-initiated (e.g., distance is significant, or a flag was set)
        // A more robust implementation would use a flag from the click/dragend events.
        if (distance > 0.0001) { // Use a small threshold to account for potential floating point inaccuracies
             initialMarker.setLngLat(center);
             onLocationChange({ lat: center.lat, lng: center.lng, placeName: '' }); // Update with coordinates
        }
      });

      // Remove geocoder result listener
      // newGeocoder.on('result', ...);

      setMap(newMap);
      // Remove geocoder state update
      // setGeocoder(newGeocoder);
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
      // Remove geocoder cleanup
      // if (geocoder) { ... }
    };
  }, [initialLocation, onLocationChange, onError, initialZoom]); // Add initialZoom to dependencies

  if (isLoading) {
    return (
      <div className="h-64 bg-gray-200 rounded-md flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return null; // The map is rendered in the DOM via the container
} 