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

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      materialType: undefined,
      location: '',
      latitude: 39.8283,
      longitude: -98.5795
    }
  })

  // Watch for material type changes
  const selectedMaterialType = watch('materialType')

  // Update unit when material type changes
  useEffect(() => {
    if (selectedMaterialType === 'soil') {
      setValue('unit', 'Cubic Yards')
    } else if (selectedMaterialType === 'structural_fill') {
      setValue('unit', 'Tons')
    }
  }, [selectedMaterialType, setValue])

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
        setLocation({ lat, lng, placeName: '' })
        setValue('location', '')
        setValue('latitude', lat)
        setValue('longitude', lng)
      }
    } catch (error) {
      console.error('Error loading user location:', error)
    }
  }

  useEffect(() => {
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
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm text-black"
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
                  {...register('materialType', { required: 'Material type is required' })}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm text-black"
                >
                  <option value="">Select material type</option>
                  <option value="soil">Soil</option>
                  <option value="gravel">Gravel</option>
                  <option value="structural_fill">Structural Fill</option>
                </select>
                {errors.materialType && <p className="mt-1 text-sm text-red-600">{errors.materialType.message}</p>}
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
                      min: { value: 0, message: 'Quantity must be positive' }
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
                    {...register('unit', { required: 'Unit is required' })}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm text-black"
                    placeholder="e.g., tons, cubic yards"
                    readOnly
                  />
                  {errors.unit && <p className="mt-1 text-sm text-red-600">{errors.unit.message}</p>}
                </div>
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