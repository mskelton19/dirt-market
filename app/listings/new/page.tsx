'use client'

import { useState, Suspense, lazy, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { MaterialType } from '@/types/materials'
import { useAuth } from '@/contexts/AuthContext'

// Lazy load the MapComponent
const LazyMapComponent = lazy(() => import('@/components/MapComponent'))

interface FormData {
  title: string
  description: string
  materialType: MaterialType
  quantity: number
  unit: string
  price: number
  location: string
  latitude: number
  longitude: number
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
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mapboxError, setMapboxError] = useState<string | null>(null)
  const [location, setLocation] = useState({ lat: 39.8283, lng: -98.5795, placeName: '' }) // Default to center of US

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      materialType: 'import',
      location: '',
      latitude: 39.8283,
      longitude: -98.5795
    }
  })

  useEffect(() => {
    const loadUserLocation = async () => {
      if (!user?.id) {
        console.log('No user ID available, skipping profile fetch')
        return
      }

      try {
        console.log('Attempting to fetch profile for user ID:', user.id)
        
        // First try to get the existing profile
        let { data: profile, error: fetchError } = await supabase
          .from('user_profiles')
          .select('id, zip_code')
          .eq('id', user.id)
          .maybeSingle()

        // If no profile exists, create one
        if (!profile && !fetchError) {
          console.log('No profile found, creating new profile for user:', user.id)
          
          const { data: newProfile, error: insertError } = await supabase
            .from('user_profiles')
            .insert([{ id: user.id }])
            .select('id, zip_code')
            .single()

          if (insertError) {
            console.log('Error creating profile:', insertError)
            setMapboxError('Unable to create your profile. Please try again.')
            return
          }

          profile = newProfile
        } else if (fetchError) {
          console.log('Error fetching profile:', fetchError)
          setMapboxError('Unable to fetch your profile information. Please try again.')
          return
        }

        console.log('Profile data:', {
          hasId: Boolean(profile?.id),
          hasZipCode: Boolean(profile?.zip_code),
          zipCode: profile?.zip_code || 'Not provided'
        })

        if (!profile?.zip_code) {
          setMapboxError('No zip code found in your profile. Please update your profile with a zip code.')
          return
        }

        console.log('Attempting to geocode zip code:', profile.zip_code)

        const mapboxResponse = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${profile.zip_code}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&country=US&types=postcode`
        )

        if (!mapboxResponse.ok) {
          const errorText = await mapboxResponse.text()
          console.log('Mapbox API error:', {
            status: mapboxResponse.status,
            statusText: mapboxResponse.statusText,
            error: errorText
          })
          setMapboxError('Failed to geocode your zip code. Please try again.')
          return
        }

        const mapboxData = await mapboxResponse.json()

        if (!mapboxData.features || mapboxData.features.length === 0) {
          console.log('No location found for zip code:', profile.zip_code)
          setMapboxError('Could not find location for your zip code. Please ensure it is valid.')
          return
        }

        const [lng, lat] = mapboxData.features[0].center
        const placeName = mapboxData.features[0].place_name
        
        console.log('Successfully found location:', {
          placeName,
          coordinates: [lat, lng]
        })
        
        setLocation({ lat, lng, placeName })
        setValue('location', placeName)
        setValue('latitude', lat)
        setValue('longitude', lng)

      } catch (error) {
        // Log error safely
        const errorInfo = error instanceof Error ? {
          name: error.name,
          message: error.message
        } : 'Unknown error type'
        
        console.log('Caught error in loadUserLocation:', errorInfo)
        setMapboxError('An unexpected error occurred while loading your location.')
      }
    }

    loadUserLocation()
  }, [user, supabase, setValue])

  const handleLocationChange = (newLocation: { lat: number, lng: number, placeName: string }) => {
    setLocation(newLocation)
    setValue('location', newLocation.placeName)
    setValue('latitude', newLocation.lat)
    setValue('longitude', newLocation.lng)
  }

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true)
      const { error } = await supabase
        .from('listings')
        .insert([{
          ...data,
          user_id: user?.id
        }])

      if (error) throw error
      router.push('/listings')
    } catch (error) {
      console.error('Error creating listing:', error)
      alert('Failed to create listing. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Create New Listing</h1>
            <p className="mt-2 text-sm text-gray-600">Fill in the details below to create your listing.</p>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Site Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="title"
                    {...register('title', { required: 'Site name is required' })}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="Enter site name"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  {...register('description', { required: 'Description is required' })}
                  rows={4}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="Describe your listing in detail"
                />
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Material Type</label>
                <select
                  {...register('materialType', { required: 'Material type is required' })}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="import">Import - Looking for material</option>
                  <option value="export">Export - Have excess material</option>
                </select>
                {errors.materialType && <p className="mt-1 text-sm text-red-600">{errors.materialType.message}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <input
                    type="number"
                    {...register('quantity', { required: 'Quantity is required', min: 0 })}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="0"
                  />
                  {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Unit</label>
                  <input
                    type="text"
                    {...register('unit', { required: 'Unit is required' })}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="e.g., tons, cubic yards"
                  />
                  {errors.unit && <p className="mt-1 text-sm text-red-600">{errors.unit.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Price</label>
                <div className="mt-1 relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    {...register('price', { required: 'Price is required', min: 0 })}
                    className="block w-full pl-7 rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="0.00"
                  />
                </div>
                {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <div className="mt-1 space-y-2">
                  <div id="geocoder-container" className="rounded-lg overflow-hidden"></div>
                  <div className="h-64 rounded-lg border border-gray-300 overflow-hidden">
                    <div id="map" className="h-full w-full"></div>
                  </div>
                  <input type="hidden" {...register('location')} />
                  <input type="hidden" {...register('latitude')} />
                  <input type="hidden" {...register('longitude')} />
                  {mapboxError && <p className="mt-1 text-sm text-red-600">{mapboxError}</p>}
                  <Suspense fallback={
                    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  }>
                    <LazyMapComponent
                      initialLocation={location}
                      onLocationChange={handleLocationChange}
                      onError={setMapboxError}
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