'use client'

import { useState, Suspense, lazy, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { MaterialType } from '@/app/types/materials'
import { useAuth } from '@/contexts/AuthContext'

// Add Mapbox imports
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

// Lazy load the MapComponent
const LazyMapComponent = lazy(() => import('@/components/MapComponent'))

interface FormData {
  site_name: string
  description: string
  material_type: string
  quantity: number
  unit: string
  location: string
  latitude: number
  longitude: number
  listing_type: 'Import' | 'Export'
  status: 'active'
  user_email: string
  user_phone: string
  contact_first_name: string
  contact_email: string
  contact_phone: string
  contact_company: string
}

interface UserProfile {
  id: string
  zip_code: string
  created_at: string
  updated_at: string
}

export default function NewListingPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { user, loading } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mapboxError, setMapboxError] = useState<string | null>(null)
  const [location, setLocation] = useState({ lat: 39.8283, lng: -98.5795, placeName: '' }) // Default to center of US
  const [initialZoom, setInitialZoom] = useState(3) // Keep state for initial zoom
  const geocoderContainerRef = useRef<HTMLDivElement>(null); // Add ref for geocoder container
  const geocoderRef = useRef<MapboxGeocoder | null>(null); // Ref to store geocoder instance

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      material_type: undefined,
      location: '',
      latitude: 39.8283,
      longitude: -98.5795,
      status: 'active'
    }
  })

  // Watch for material type changes
  const selectedMaterialType = watch('material_type')

  // Update unit when material type changes
  useEffect(() => {
    switch (selectedMaterialType) {
      case 'soil':
      case 'structural_fill':
        setValue('unit', 'Cubic Yards')
        break
      case 'gravel':
        setValue('unit', 'Tons')
        break
      default:
        setValue('unit', '')
    }
  }, [selectedMaterialType, setValue])

  // Add geocoder initialization effect
  useEffect(() => {
    // Initialize Mapbox
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    if (!mapboxgl.accessToken) {
      console.error('Mapbox token is missing. Please check your environment variables.');
      setMapboxError('Mapbox token is missing.');
      return;
    }

    // Ensure mapboxgl is supported
    if (!mapboxgl.supported()) {
      console.error('Mapbox GL JS is not supported by this browser.');
      setMapboxError('Mapbox GL JS is not supported by this browser.');
      return;
    }

    // Create a dummy map instance for the geocoder
    const dummyMap = new mapboxgl.Map({
        container: document.createElement('div'),
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [location.lng, location.lat],
        zoom: initialZoom,
        interactive: false
    }) as any;

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl as any,
      placeholder: 'Enter Address',
      marker: false,
      countries: 'us',
      types: 'address,postcode,place,locality,neighborhood',
      bbox: [-125.0, 24.396308, -66.934570, 49.384358],
      proximity: location.lng && location.lat ? 
        { longitude: location.lng, latitude: location.lat } : 
        undefined,
      language: 'en',
      limit: 5,
      minLength: 3,
      collapsed: false,
    });

    geocoderRef.current = geocoder;

    if (geocoderContainerRef.current) {
      geocoderContainerRef.current.innerHTML = '';
      const geocoderElement = geocoder.onAdd(dummyMap);
      geocoderContainerRef.current.appendChild(geocoderElement);
    }

    // Handle geocoder result
    geocoder.on('result', (e: any) => {
      const [lng, lat] = e.result.center;
      const placeName = e.result.place_name;
      setLocation({ lat, lng, placeName });
      setValue('location', placeName);
      setValue('latitude', lat);
      setValue('longitude', lng);
      setInitialZoom(12);
      
      const geocoderInput = geocoderContainerRef.current?.querySelector('.mapboxgl-ctrl-geocoder input') as HTMLInputElement;
      if (geocoderInput) {
        geocoderInput.value = placeName;
        geocoderInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    geocoder.on('clear', () => {
      setLocation({ lat: 39.8283, lng: -98.5795, placeName: '' });
      setValue('location', '');
      setValue('latitude', 39.8283);
      setValue('longitude', -98.5795);
      setInitialZoom(3);
      
      const geocoderInput = geocoderContainerRef.current?.querySelector('.mapboxgl-ctrl-geocoder input') as HTMLInputElement;
      if (geocoderInput) {
        geocoderInput.value = '';
        geocoderInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    return () => {
      if (geocoderRef.current) {
        geocoderRef.current.onRemove();
        geocoderRef.current = null;
      }
      if(dummyMap) {
        dummyMap.remove();
      }
    };
  }, [location.lng, location.lat, initialZoom, setValue]);

  // Handle location change from MapComponent (pin drag/click)
  const handleLocationChange = async (newLocation: { lat: number, lng: number, placeName: string }) => {
    setLocation(newLocation); // Update location state - placeName will be updated after reverse geocoding
    setValue('latitude', newLocation.lat);
    setValue('longitude', newLocation.lng);
    
    // Perform reverse geocoding to get the address for the new pin location
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${newLocation.lng},${newLocation.lat}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
      );
      const data = await response.json();
      const placeName = (data.features && data.features.length > 0) ? data.features[0].place_name : '';
      
      setValue('location', placeName); // Update form value with fetched place name
      // Also update the location state with the placeName for display if needed elsewhere
      setLocation(prevLocation => ({ ...prevLocation, placeName }));

      // Update geocoder input value with the fetched address
      const geocoderInput = geocoderContainerRef.current?.querySelector('.mapboxgl-ctrl-geocoder input') as HTMLInputElement;
      if (geocoderInput) {
          geocoderInput.value = placeName;
      }

    } catch (error) {
      console.error('Error during reverse geocoding on location change:', error);
      setValue('location', ''); // Clear location in form if reverse geocoding fails
       const geocoderInput = geocoderContainerRef.current?.querySelector('.mapboxgl-ctrl-geocoder input') as HTMLInputElement;
       if (geocoderInput) {
           geocoderInput.value = ''; // Clear geocoder input as well
       }
    }
  };

  const loadUserLocation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error('No authenticated user found')
        return
      }

      const zipCode = user.user_metadata?.zip_code
      
      if (!zipCode) {
        console.error('No zip code found in user metadata')
        return
      }

      // Convert zip code to coordinates using Mapbox
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${zipCode}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
      )
      const data = await response.json()

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center
        setLocation({ lat, lng, placeName: data.features[0].place_name || zipCode })
        setValue('location', data.features[0].place_name || zipCode)
        setValue('latitude', lat)
        setValue('longitude', lng)
        setInitialZoom(12) // Set zoom to 12 if zip code found
      }
    } catch (error) {
      console.error('Error loading user location:', error)
    }
  }

  useEffect(() => {
    // Check if user is loaded before loading location
    if (!loading && !user) {
        router.push('/auth/login');
        return;
    }
    if (user) {
        loadUserLocation();
    }
  }, [user, loading, router, supabase, setValue]) // Added loading and router to dependencies

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true)
      
      // Get user data
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.error('Error getting user:', userError)
        throw new Error(`Failed to get user: ${userError.message}`)
      }
      
      if (!user) {
        throw new Error('No authenticated user found')
      }

      // Extract user information from auth.user
      const userMetadata = user.user_metadata || {}
      const contactInfo = {
        contact_first_name: userMetadata.first_name || '',
        contact_email: user.email || '',
        contact_phone: userMetadata.phone || '',
        contact_company: userMetadata.company_name || ''
      }

      // Log the data being sent to Supabase
      console.log('Creating listing with data:', {
        ...data,
        ...contactInfo,
        user_id: user.id,
        status: 'active'
      })

      const { error: insertError } = await supabase
        .from('listings')
        .insert([{
          ...data,
          ...contactInfo,
          user_id: user.id,
          status: 'active'
        }])

      if (insertError) {
        console.error('Supabase insert error:', insertError)
        throw new Error(`Failed to create listing: ${insertError.message}`)
      }

      router.push('/listings/manage')
    } catch (error: any) {
      console.error('Error creating listing:', error)
      alert(error.message || 'Failed to create listing. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <style jsx global>{`
        .mapboxgl-ctrl-geocoder {
          width: 100% !important;
          max-width: none !important;
          box-shadow: none !important;
          background: none !important;
        }
        .mapboxgl-ctrl-geocoder input {
          width: 100% !important;
          height: 38px !important;
          padding: 0.5rem !important;
          padding-left: 40px !important;
          border: 1px solid #d1d5db !important;
          border-radius: 0.375rem !important;
          background-color: white !important;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
        }
        .mapboxgl-ctrl-geocoder--icon-search {
          left: 8px !important;
        }
        .mapboxgl-ctrl-geocoder--results {
          z-index: 10000 !important;
          width: 100% !important;
          max-width: none !important;
        }
      `}</style>
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Create New Listing</h1>
            <p className="mt-2 text-sm text-gray-600">Fill in the details below to create your listing.</p>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="site_name" className="block text-sm font-medium text-gray-700">
                  Site Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="site_name"
                    {...register('site_name', { required: 'Site name is required' })}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm text-black"
                    placeholder="Enter site name"
                  />
                  {errors.site_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.site_name.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  id="description"
                  rows={4}
                  {...register('description', { required: 'Description is required' })}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm text-black"
                  placeholder="Describe your listing"
                />
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Material Type</label>
                <select
                  {...register('material_type', { required: 'Material type is required' })}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm text-black"
                >
                  <option value="">Select material type</option>
                  <option value="soil">Soil</option>
                  <option value="gravel">Gravel</option>
                  <option value="structural_fill">Structural Fill</option>
                </select>
                {errors.material_type && <p className="mt-1 text-sm text-red-600">{errors.material_type.message}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <input
                    type="number"
                    id="quantity"
                    step="0.01"
                    {...register('quantity', { 
                      required: 'Quantity is required',
                    })}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm text-black"
                    placeholder="Enter quantity"
                  />
                  {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Unit</label>
                  <input
                    type="text"
                    {...register('unit')}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm text-black bg-gray-50"
                    placeholder="Unit will be set automatically"
                    disabled={true}
                    readOnly
                  />
                  {errors.unit && <p className="mt-1 text-sm text-red-600">{errors.unit.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Listing Type</label>
                <select
                  {...register('listing_type', { required: 'Listing type is required' })}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm text-black"
                >
                  <option value="">Select listing type</option>
                  <option value="Import">Import</option>
                  <option value="Export">Export</option>
                </select>
                {errors.listing_type && <p className="mt-1 text-sm text-red-600">{errors.listing_type.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <div ref={geocoderContainerRef} className="mt-1 w-full rounded-lg" style={{ zIndex: 10, overflow: 'visible !important' }}></div>
                {/* The geocoder input will be rendered inside the div above */}
                <input type="hidden" {...register('location')} />
                <input type="hidden" {...register('latitude')} />
                <input type="hidden" {...register('longitude')} />
                {mapboxError && <p className="mt-1 text-sm text-red-600">{mapboxError}</p>}
                 {/* We can optionally display the selected address text here if needed */}
                 {/* {location.placeName && !mapboxError && (
                  <p className="mt-1 text-sm text-gray-600">
                    Selected Address: {location.placeName}
                  </p>
                )} */}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Map View</label>
                <div className="mt-1 space-y-2">
                  <div className="h-80 lg:h-96 rounded-lg border border-gray-300">
                    <div id="map" className="h-full w-full"></div>
                  </div>
                  {/* Hidden inputs are now placed near the geocoder container */}
                  {/* Mapbox error display remains */}
                  <Suspense fallback={
                    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  }>
                    <LazyMapComponent
                      initialLocation={location}
                      onLocationChange={handleLocationChange}
                      onError={setMapboxError}
                      initialZoom={initialZoom} // Pass the initialZoom state
                    />
                  </Suspense>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-b-2 border-white rounded-full"></div>
                    Creating...
                  </div>
                ) : (
                  'Create Listing'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}