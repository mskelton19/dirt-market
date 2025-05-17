'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

type Listing = {
  id: string
  title: string
  description: string
  price: number
  category: string
  condition: string
  quantity: number
  unit: string
  location: string
  created_at: string
  user_id: string
  site_name: string
  material_type: string
  listing_type: string
  latitude: number
  longitude: number
}

// Add distance calculation function
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return Math.round(distance);
}

// Add material type color mapping
const getMaterialTypeStyles = (materialType: string) => {
  switch (materialType) {
    case 'soil':
      return {
        bg: 'bg-amber-100',
        text: 'text-amber-800',
        border: 'border-amber-200'
      }
    case 'gravel':
      return {
        bg: 'bg-slate-100',
        text: 'text-slate-800',
        border: 'border-slate-200'
      }
    case 'structural_fill':
      return {
        bg: 'bg-emerald-100',
        text: 'text-emerald-800',
        border: 'border-emerald-200'
      }
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        border: 'border-gray-200'
      }
  }
}

// Add function to format material type for display
const formatMaterialType = (materialType: string) => {
  return materialType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import')
  const { user } = useAuth()

  useEffect(() => {
    fetchListings()
    if (user) {
      fetchUserLocation()
    }
  }, [user])

  async function fetchUserLocation() {
    try {
      if (!user) {
        console.log('No authenticated user found')
        return
      }

      // Get zip code from user metadata
      const zipCode = user.user_metadata?.zip_code
      
      if (!zipCode) {
        console.log('No zip code found in user metadata')
        return
      }

      // Convert zip code to coordinates using Mapbox
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${zipCode}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
      )
      const data = await response.json()

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center
        setUserLocation({ lat, lng })
      }
    } catch (error) {
      console.error('Error fetching user location:', error)
    }
  }

  async function fetchListings() {
    try {
      console.log('Fetching listings...')
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      console.log('Fetched listings:', data)
      setListings(data || [])
    } catch (error: any) {
      console.error('Error fetching listings:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      setError(error.message || 'Failed to load listings')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Listings</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchListings}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (listings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Listings Available</h2>
            <p className="text-gray-600 mb-8">Be the first to post a listing!</p>
            <Link
              href="/listings/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Create New Listing
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Available Materials
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Browse through available construction materials
            </p>
          </div>
          <Link
            href="/listings/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Post New Listing
          </Link>
        </div>

        {/* Navigation Bar */}
        <div className="sticky top-16 z-10 bg-gray-50 py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b border-gray-200 mb-8">
          <div className="max-w-7xl mx-auto">
            <nav className="flex space-x-4 sm:space-x-8">
              <button
                onClick={() => setActiveTab('import')}
                className={`text-sm font-medium px-3 py-2 border-b-2 transition-colors duration-200 ${
                  activeTab === 'import'
                    ? 'text-indigo-600 border-indigo-600'
                    : 'text-gray-500 border-transparent hover:text-indigo-600 hover:border-indigo-600'
                }`}
              >
                Import Listings
              </button>
              <button
                onClick={() => setActiveTab('export')}
                className={`text-sm font-medium px-3 py-2 border-b-2 transition-colors duration-200 ${
                  activeTab === 'export'
                    ? 'text-indigo-600 border-indigo-600'
                    : 'text-gray-500 border-transparent hover:text-indigo-600 hover:border-indigo-600'
                }`}
              >
                Export Listings
              </button>
            </nav>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="space-y-8">
          {/* Import Section */}
          <div id="import-listings" className={`${activeTab === 'import' ? 'block' : 'hidden sm:block'}`}>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Import Listings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings
                .filter(listing => listing.listing_type === 'Import')
                .map((listing) => {
                  const materialStyles = getMaterialTypeStyles(listing.material_type)
                  const distance = userLocation && listing.latitude && listing.longitude
                    ? calculateDistance(
                        userLocation.lat,
                        userLocation.lng,
                        listing.latitude,
                        listing.longitude
                      )
                    : null

                  return (
                    <div
                      key={listing.id}
                      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-100"
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-xl font-semibold text-gray-900">
                            {listing.site_name}
                          </h2>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${materialStyles.bg} ${materialStyles.text} border ${materialStyles.border}`}>
                            {formatMaterialType(listing.material_type)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-sm text-gray-500">
                            {listing.quantity} {listing.unit}
                          </span>
                          {distance !== null && (
                            <span className="text-sm text-gray-500 flex items-center">
                              <svg
                                className="h-4 w-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              {distance} miles away
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {listing.description}
                        </p>
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <span className="flex items-center">
                            <svg
                              className="h-4 w-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            {listing.location}
                          </span>
                        </div>
                        <div className="mt-4 pt-4 border-t">
                          <Link
                            href={`/listings/${listing.id}`}
                            className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
                          >
                            View Details
                            <svg
                              className="ml-1 h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Export Section */}
          <div id="export-listings" className={`${activeTab === 'export' ? 'block' : 'hidden sm:block'}`}>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Export Listings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings
                .filter(listing => listing.listing_type === 'Export')
                .map((listing) => {
                  const materialStyles = getMaterialTypeStyles(listing.material_type)
                  const distance = userLocation && listing.latitude && listing.longitude
                    ? calculateDistance(
                        userLocation.lat,
                        userLocation.lng,
                        listing.latitude,
                        listing.longitude
                      )
                    : null

                  return (
                    <div
                      key={listing.id}
                      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-100"
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-xl font-semibold text-gray-900">
                            {listing.site_name}
                          </h2>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${materialStyles.bg} ${materialStyles.text} border ${materialStyles.border}`}>
                            {formatMaterialType(listing.material_type)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-sm text-gray-500">
                            {listing.quantity} {listing.unit}
                          </span>
                          {distance !== null && (
                            <span className="text-sm text-gray-500">
                              {distance} miles away
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {listing.description}
                        </p>
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <span className="flex items-center">
                            <svg
                              className="h-4 w-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            {listing.location}
                          </span>
                        </div>
                        <div className="mt-4 pt-4 border-t">
                          <Link
                            href={`/listings/${listing.id}`}
                            className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
                          >
                            View Details
                            <svg
                              className="ml-1 h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}