'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import mapboxgl from 'mapbox-gl'
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import { Listbox } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'

// Initialize Mapbox
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

type MaterialType = 'topsoil' | 'structural_fill' | 'gravel'

interface ListingFormData {
  site_name: string
  listing_type: 'import' | 'export'
  material_type: MaterialType
  quantity: number
  unit: string
  description: string
  location: string
  latitude: number
  longitude: number
}

const listingTypes = [
  { id: 'import', name: 'Import - Looking for material' },
  { id: 'export', name: 'Export - Have excess material' },
]

const materialTypes = [
  { id: 'topsoil', name: 'Topsoil', unit: 'cubic_yards' },
  { id: 'structural_fill', name: 'Structural Fill', unit: 'tons' },
  { id: 'gravel', name: 'Gravel', unit: 'tons' },
]

export default function NewListingPage() {
  const router = useRouter()
  const [selectedMaterial, setSelectedMaterial] = useState(materialTypes[0])
  const [selectedListingType, setSelectedListingType] = useState(listingTypes[0])
  const [map, setMap] = useState<mapboxgl.Map | null>(null)
  const [marker, setMarker] = useState<mapboxgl.Marker | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [geocoder, setGeocoder] = useState<MapboxGeocoder | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ListingFormData>()

  const updateLocationFromCoordinates = async (map: mapboxgl.Map, lng: number, lat: number) => {
    try {
      // Get address from coordinates
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const placeName = data.features[0].place_name;
        setValue('location', placeName);
        setValue('latitude', lat);
        setValue('longitude', lng);

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
    }
  };

  // Map initialization effect
  useEffect(() => {
    if (!map) {
      const newMap = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-98.5795, 39.8283],
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
        .setLngLat([-98.5795, 39.8283])
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
  }, []);

  const onSubmit = async (data: ListingFormData) => {
    try {
      setIsSubmitting(true)
      const { data: listing, error } = await supabase.from('listings').insert([
        {
          ...data,
          listing_type: selectedListingType.id,
          material_type: selectedMaterial.id,
          unit: selectedMaterial.unit,
          status: 'active',
          user_id: (await supabase.auth.getUser()).data.user?.id,
        },
      ]).select()

      if (error) throw error
      router.push('/listings')
    } catch (error) {
      console.error('Error creating listing:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Listing</h1>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Site Name */}
            <div>
              <label htmlFor="site_name" className="block text-sm font-medium text-gray-700 mb-1">
                Site Name
              </label>
              <input
                type="text"
                id="site_name"
                {...register('site_name', { required: 'Site name is required' })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-4 py-2 font-sans text-gray-900 placeholder-gray-500"
                placeholder="Enter site name"
              />
              {errors.site_name && (
                <p className="mt-1 text-sm text-red-600">{errors.site_name.message}</p>
              )}
            </div>

            {/* Listing Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Listing Type
              </label>
              <Listbox value={selectedListingType} onChange={setSelectedListingType}>
                <div className="relative mt-1">
                  <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-sans text-gray-900">
                    <span className="block truncate">{selectedListingType.name}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </span>
                  </Listbox.Button>
                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none text-sm font-sans">
                    {listingTypes.map((type) => (
                      <Listbox.Option
                        key={type.id}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                            active ? 'bg-indigo-100 text-indigo-900' : 'text-gray-900'
                          }`
                        }
                        value={type}
                      >
                        {({ selected }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                              {type.name}
                            </span>
                            {selected ? (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600">
                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>
            </div>

            {/* Material Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Material Type
              </label>
              <Listbox value={selectedMaterial} onChange={setSelectedMaterial}>
                <div className="relative mt-1">
                  <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-sans text-gray-900">
                    <span className="block truncate">{selectedMaterial.name}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </span>
                  </Listbox.Button>
                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none text-sm font-sans">
                    {materialTypes.map((material) => (
                      <Listbox.Option
                        key={material.id}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                            active ? 'bg-indigo-100 text-indigo-900' : 'text-gray-900'
                          }`
                        }
                        value={material}
                      >
                        {({ selected }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                              {material.name}
                            </span>
                            {selected ? (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600">
                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>
            </div>

            {/* Quantity */}
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Quantity ({selectedMaterial.unit === 'cubic_yards' ? 'Cubic Yards' : 'Tons'})
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="number"
                  id="quantity"
                  step="0.1"
                  {...register('quantity', { 
                    required: 'Quantity is required',
                    min: { value: 0.1, message: 'Quantity must be greater than 0' }
                  })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-4 py-2 font-sans text-gray-900 placeholder-gray-500"
                  placeholder="0.0"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm font-sans">
                    {selectedMaterial.unit === 'cubic_yards' ? 'yd³' : 'tons'}
                  </span>
                </div>
              </div>
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                {...register('description', { required: 'Description is required' })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-4 py-2 font-sans text-gray-900 placeholder-gray-500"
                placeholder="Describe the material and any relevant details"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <div id="map" className="h-64 rounded-md mb-2"></div>
              <div id="geocoder-container" className="mb-2 w-full"></div>
              <style jsx global>{`
                .mapboxgl-ctrl-geocoder {
                  width: 100% !important;
                  max-width: none !important;
                }
                .mapboxgl-ctrl-geocoder input {
                  width: 100% !important;
                  font-size: 14px !important;
                  padding: 8px 12px 8px 36px !important;
                  border-radius: 6px !important;
                  border: 1px solid #d1d5db !important;
                }
                .mapboxgl-ctrl-geocoder .geocoder-icon {
                  position: absolute !important;
                  left: 12px !important;
                  top: 50% !important;
                  transform: translateY(-50%) !important;
                  z-index: 1 !important;
                }
                .mapboxgl-ctrl-geocoder .suggestions {
                  font-size: 14px !important;
                }
                .mapboxgl-ctrl-geocoder .suggestions .suggestion {
                  padding: 8px 12px !important;
                }
                @media (max-width: 640px) {
                  .mapboxgl-ctrl-geocoder input {
                    font-size: 14px !important;
                  }
                  .mapboxgl-ctrl-geocoder .suggestions {
                    font-size: 14px !important;
                  }
                }
              `}</style>
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating Listing...' : 'Create Listing'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}