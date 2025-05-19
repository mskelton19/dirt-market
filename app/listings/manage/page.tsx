'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

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
  contact_email?: string
  contact_phone?: string
  contact_first_name?: string
  contact_company?: string
  status: 'active' | 'pending' | 'sold'
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

export default function ManageListingsPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    fetchUserListings()
  }, [user])

  async function fetchUserListings() {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setListings(data || [])
    } catch (error: any) {
      console.error('Error fetching listings:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteListing(id: string) {
    if (!confirm('Are you sure you want to delete this listing?')) return

    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', id)

      if (error) throw error
      setListings(listings.filter(listing => listing.id !== id))
    } catch (error: any) {
      console.error('Error deleting listing:', error)
      alert('Failed to delete listing. Please try again.')
    }
  }

  async function handleUpdateStatus(id: string, newStatus: 'active' | 'pending' | 'sold') {
    try {
      const { error } = await supabase
        .from('listings')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error
      setListings(listings.map(listing => 
        listing.id === id ? { ...listing, status: newStatus } : listing
      ))
    } catch (error: any) {
      console.error('Error updating listing status:', error)
      alert('Failed to update listing status. Please try again.')
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
            onClick={fetchUserListings}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Try Again
          </button>
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
              Manage Your Listings
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              View, edit, and manage your construction material listings
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
            Create New Listing
          </Link>
        </div>

        {/* Listings Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Your Listings
            </h3>
          </div>
          {listings.length === 0 ? (
            <div className="px-4 py-5 sm:p-6 text-center">
              <p className="text-gray-500 mb-4">You haven't created any listings yet.</p>
              <Link
                href="/listings/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create Your First Listing
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Listing
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Material Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {listings.map((listing) => (
                    <tr key={listing.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {listing.site_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {listing.quantity} {listing.unit}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          listing.material_type ? 
                            `${getMaterialTypeStyles(listing.material_type).bg} ${getMaterialTypeStyles(listing.material_type).text}`
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {listing.material_type ? 
                            formatMaterialType(listing.material_type)
                            : 'Unknown Material'
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          listing.listing_type === 'Import' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {listing.listing_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={listing.status}
                          onChange={(e) => handleUpdateStatus(listing.id, e.target.value as 'active' | 'pending' | 'sold')}
                          className="text-sm text-gray-900 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="active">Active</option>
                          <option value="pending">Pending</option>
                          <option value="sold">Sold</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(listing.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Link
                          href={`/listings/${listing.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteListing(listing.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 