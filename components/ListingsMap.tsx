import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Replace with your Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface Listing {
  id: string;
  title: string;
  location: {
    lat: number;
    lng: number;
  };
  address?: string;
  materialType: string;
}

interface ListingsMapProps {
  listings: Listing[];
  userLocation: {
    lat: number;
    lng: number;
  };
}

// Define material type colors
const materialColors: Record<string, string> = {
  soil: '#F59E0B', // Amber
  gravel: '#64748B', // Slate
  structural_fill: '#10B981', // Emerald
  default: '#6B7280', // Gray
};

const ListingsMap: React.FC<ListingsMapProps> = ({ listings, userLocation }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [userLocation.lng, userLocation.lat],
      zoom: 10,
    });

    map.current.on('load', () => {
      listings.forEach((listing) => {
        const color = materialColors[listing.materialType] || materialColors.default;
        new mapboxgl.Marker({ color })
          .setLngLat([listing.location.lng, listing.location.lat])
          .setPopup(new mapboxgl.Popup().setHTML(`<h3 style="color: black;">${listing.title}</h3>${listing.address ? `<p style="color: black;">${listing.address}</p>` : ''}`))
          .addTo(map.current!);
      });
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [listings, userLocation]);

  return <div ref={mapContainer} style={{ width: '100%', height: '400px' }} />;
};

export default ListingsMap; 