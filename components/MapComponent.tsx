'use client'

import { useEffect, useState, useRef } from 'react'
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
  const mapContainerRef = useRef<HTMLDivElement>(null)

  // Simplified updateLocationFromCoordinates - only calls onLocationChange with coordinates
  const updateLocationFromCoordinates = async (map: mapboxgl.Map, lng: number, lat: number) => {
    try {
      // Perform reverse geocoding to get the address
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
      );
      const data = await response.json();
      const placeName = (data.features && data.features.length > 0) ? data.features[0].place_name : '';
      
      onLocationChange({ lat, lng, placeName });
    } catch (error) {
      console.error('Error during reverse geocoding:', error);
      onLocationChange({ lat, lng, placeName: '' });
    }
  };

  // Map initialization effect - only runs once
  useEffect(() => {
    if (!mapboxgl.accessToken) {
      onError('Mapbox token is missing. Please check your environment variables.');
      return;
    }

    try {
      console.log('Using Mapbox Access Token:', mapboxgl.accessToken);
      const newMap = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [initialLocation.lng, initialLocation.lat],
        zoom: initialZoom
      });

      // Wait for map to load before adding controls and marker
      newMap.on('load', () => {
        // Add navigation controls
        newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Create initial marker
        const initialMarker = new mapboxgl.Marker({
          draggable: true
        })
          .setLngLat([initialLocation.lng, initialLocation.lat])
          .addTo(newMap);
        setMarker(initialMarker);

        // Handle marker drag end
        initialMarker.on('dragend', async () => {
          const lngLat = initialMarker.getLngLat();
          await updateLocationFromCoordinates(newMap, lngLat.lng, lngLat.lat);
        });

        // Handle map click
        newMap.on('click', async (e) => {
          const { lng, lat } = e.lngLat;
          initialMarker.setLngLat([lng, lat]);
          await updateLocationFromCoordinates(newMap, lng, lat);
        });
      });

      setMap(newMap);
      // Remove geocoder state update
      // setGeocoder(newGeocoder);

      return () => {
        if (newMap) {
          newMap.remove();
        }
        // Remove geocoder cleanup
        // if (geocoder) { ... }
      };
    } catch (error) {
      console.error('Error initializing map:', error);
      onError('Failed to initialize map. Please try again.');
    }
  }, []); // Empty dependency array - only initialize once

  // Update marker position when initialLocation changes
  useEffect(() => {
    if (!marker || !map) return;

    // Only update if the location has actually changed
    const currentLngLat = marker.getLngLat();
    if (currentLngLat.lng === initialLocation.lng && currentLngLat.lat === initialLocation.lat) {
      return;
    }

    // Update marker position with smooth animation
    marker.setLngLat([initialLocation.lng, initialLocation.lat]);

    // Smoothly fly to new location
    map.flyTo({
      center: [initialLocation.lng, initialLocation.lat],
      zoom: initialZoom,
      duration: 1000, // 1 second duration
      essential: true
    });
  }, [initialLocation.lng, initialLocation.lat, initialZoom, marker, map]);

  return (
    <div id="map" className="h-full w-full relative">
      {/* Map will render here */}
    </div>
  ); // The map is rendered in the DOM via the container
} 