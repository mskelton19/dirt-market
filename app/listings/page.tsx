'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

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
}

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchListings()
  }, [])

  async function fetchListings() {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) throw error
      setListings(data || [])
    } catch (error) {
      console.error('Error fetching listings:', error)
      setError('Failed to load listings')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading listings...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Available Materials</h1>
          <a
            href="/listings/new"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Post New Listing
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {listing.title}
                </h2>
                <p className="text-gray-600 mb-4">{listing.description}</p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold text-indigo-600">
                    ${listing.price}
                  </span>
                  <span className="text-sm text-gray-500">
                    {listing.quantity} {listing.unit}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <span className="mr-4">📍 {listing.location}</span>
                  <span>��️ {listing.category}</span>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <a
                    href={`/listings/${listing.id}`}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    View Details →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {listings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No listings available yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}