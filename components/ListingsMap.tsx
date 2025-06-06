import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { generateListingEmailBody } from '@/utils/emailUtils';

// Replace with your Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface Listing {
  id: string;
  title: string; // site_name
  location: {
    lat: number;
    lng: number;
  };
  address?: string; // location string
  materialType: string;
  quantity: number;
  unit: string;
  contact_company?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_first_name?: string;
  listing_type: string;
}

interface ListingsMapProps {
  listings: Listing[];
  userLocation: {
    lat: number;
    lng: number;
  };
  user: { user_metadata?: { first_name?: string } } | null;
}

// Define material type colors
const materialColors: Record<string, string> = {
  soil: '#F59E0B', // Amber
  gravel: '#64748B', // Slate
  structural_fill: '#10B981', // Emerald
  default: '#6B7280', // Gray
};

const ListingsMap: React.FC<ListingsMapProps> = ({ listings, userLocation, user }) => {
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

        // Get background color for material type
        const materialBackgroundColor = materialColors[listing.materialType] || materialColors.default;

        console.log('Listing data for map popup:', listing);

        const popupContent = `
          <div style="color: black; font-family: sans-serif; max-width: 200px;">
            ${listing.contact_company ? `<h3 style="font-weight: bold; margin-bottom: 0.5rem;">${listing.contact_company}</h3>` : ''}
            <p style="margin-bottom: 0.25rem;">${listing.address ? listing.address : 'No address provided'}</p>
            <p style="margin-bottom: 0.25rem;">
              <span style="background-color: ${materialBackgroundColor}; color: white; padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem;">
                ${listing.materialType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </span>
            </p>
            <p style="margin-bottom: 0.5rem;">${listing.quantity} ${listing.unit}</p>
            <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
              ${listing.contact_email ? `
                <a href="mailto:${listing.contact_email}?subject=${encodeURIComponent(`Interested in Your Available ${listing.materialType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`)}&body=${generateListingEmailBody({
                  title: listing.title,
                  materialType: listing.materialType,
                  quantity: listing.quantity,
                  unit: listing.unit,
                  address: listing.address,
                  contact_company: listing.contact_company,
                  contact_first_name: listing.contact_first_name,
                  listing_type: listing.listing_type
                }, user)}" 
                style="display: inline-flex; align-items: center; justify-content: center; padding: 0.625rem 1rem; border: 1px solid transparent; font-size: 0.875rem; font-weight: 500; border-radius: 0.375rem; color: white; background-color: #4F46E5; text-decoration: none; transition: background-color 0.2s;">
                  <svg style="width: 1rem; height: 1rem; margin-right: 0.375rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </a>
              ` : ''}
              ${listing.contact_phone ? `
                <a href="facetime-audio:${listing.contact_phone.replace(/\D/g, '')}" 
                style="display: inline-flex; align-items: center; justify-content: center; padding: 0.625rem 1rem; border: 1px solid transparent; font-size: 0.875rem; font-weight: 500; border-radius: 0.375rem; color: white; background-color: #4F46E5; text-decoration: none; transition: background-color 0.2s;">
                  <svg style="width: 1rem; height: 1rem; margin-right: 0.375rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call
                </a>
              ` : ''}
            </div>
          </div>
        `;

        new mapboxgl.Marker({ color })
          .setLngLat([listing.location.lng, listing.location.lat])
          .setPopup(new mapboxgl.Popup().setHTML(popupContent))
          .addTo(map.current!);
      });
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [listings, userLocation, user]);

  return <div ref={mapContainer} style={{ width: '100%', height: '400px' }} />;
};

export default ListingsMap; 