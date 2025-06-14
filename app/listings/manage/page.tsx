'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import ErrorMessage from '@/components/ErrorMessage'
import CompanyMaterialChart from '@/components/CompanyMaterialChart'
import OnboardingGuard from '@/components/OnboardingGuard'

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
  status: 'active' | 'pending' | 'completed'
  parent_listing_id?: string
  completed_at?: string
  completed_with_company?: string
  completed_listings?: {
    completed_at: string;
    company_id: string;
    companies: { name: string } | null;
  }[];
}

type Company = {
  id: string
  name: string
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [quantityMoved, setQuantityMoved] = useState<number>(0)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'active' | 'completed'>('active')
  const [modalError, setModalError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (user) {
      fetchUserListings()
      fetchCompanies()
    }
  }, [user, authLoading, router])

  async function fetchUserListings() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('listings')
        .select(
          `*,
          completed_listings (*,
          companies (name))
          `
        )
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

  async function fetchCompanies() {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name')

      if (error) throw error
      setCompanies(data || [])
    } catch (error: any) {
      console.error('Error fetching companies:', error)
      alert('Failed to load companies. Please try again.')
    }
  }

  async function handleDeleteListing(id: string) {
    if (!confirm('Are you sure you want to delete this listing?')) return

    try {
      // First, get the listing data
      const { data: listing, error: fetchError } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      // Ensure user is available before inserting
      if (!user || !user.id) {
        console.error('Authenticated user not found when attempting deletion.');
        alert('Authentication error. Please try logging in again.');
        return;
      }

      // Get session to check auth state before inserting
      console.log('Fetching session before insert...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error getting session before insert:', sessionError);
        alert('Could not verify authentication. Please try logging in again.');
        return;
      }

      console.log('User from useAuth:', user);
      console.log('Session from supabase.auth.getSession():', session);

      if (!session || !session.user || !session.user.id) {
          console.error('No active session found before insert.');
          alert('No active authentication session. Please try logging in again.');
          return;
      }

      // Insert into deleted_listings table
      const { error: insertError } = await supabase
        .from('deleted_listings')
        .insert({
          ...listing,
          deleted_at: new Date().toISOString(),
          deleted_by: user.id // Use user.id directly
        })

      if (insertError) throw insertError

      // Delete from listings table
      const { error: deleteError } = await supabase
        .from('listings')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      setListings(listings.filter(listing => listing.id !== id))
      setIsEditModalOpen(false)
      setSuccessMessage('Listing deleted successfully')
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
    } catch (error: any) {
      console.error('Error deleting listing:', error)
      alert('Failed to delete listing. Please try again.')
    }
  }

  async function handleMarkAsDone(id: string) {
    if (!selectedCompany) {
      setModalError('Please select a company')
      return
    }

    if (!quantityMoved || quantityMoved <= 0) {
      setModalError('Please enter a valid quantity greater than zero')
      return
    }

    try {
      setModalError(null)
      const listing = listings.find(l => l.id === id)
      if (!listing) {
        setModalError('Listing not found. Please try refreshing the page.')
        return
      }

      const percentageMoved = (quantityMoved / listing.quantity) * 100
      const completedAt = new Date().toISOString()
      const selectedCompanyName = companies.find(c => c.id === selectedCompany)?.name

      if (!selectedCompanyName) {
        setModalError('Selected company not found. Please try again.')
        return
      }

      // If 100% moved, just mark as completed
      if (percentageMoved >= 100) {
        const { error: updateError } = await supabase
          .from('listings')
          .update({ 
            status: 'completed',
            quantity: quantityMoved
          })
          .eq('id', id)

        if (updateError) {
          console.error('Error updating listing:', updateError)
          setModalError('Failed to update listing. Please try again.')
          return
        }

        // Record the completion
        const { error: completionError } = await supabase
          .from('completed_listings')
          .insert({
            listing_id: id,
            company_id: selectedCompany,
            quantity_moved: quantityMoved,
            unit: listing.unit,
            material_type: listing.material_type,
            created_by: user?.id,
            completed_at: completedAt
          })

        if (completionError) {
          console.error('Error recording completion:', completionError)
          setModalError('Failed to record completion. Please try again.')
          return
        }

        // Update local state and trigger refresh
        await fetchUserListings()
        setRefreshTrigger(prev => prev + 1)
        setListings(listings.map(listing => 
          listing.id === id ? { 
            ...listing, 
            status: 'completed', 
            quantity: quantityMoved
          } : listing
        ))
      } else {
        // Create new listing for remaining quantity
        const remainingQuantity = listing.quantity - quantityMoved
        
        const { data: newListing, error: newListingError } = await supabase
          .from('listings')
          .insert({
            ...listing,
            id: undefined,
            quantity: remainingQuantity,
            parent_listing_id: id
          })
          .select()
          .single()

        if (newListingError) {
          console.error('Error creating new listing:', newListingError)
          setModalError('Failed to create new listing for remaining quantity. Please try again.')
          return
        }

        // Mark original listing as completed and update its quantity
        const { error: updateError } = await supabase
          .from('listings')
          .update({ 
            status: 'completed',
            quantity: quantityMoved
          })
          .eq('id', id)

        if (updateError) {
          console.error('Error updating original listing:', updateError)
          setModalError('Failed to update original listing. Please try again.')
          return
        }

        // Record the completion
        const { error: completionError } = await supabase
          .from('completed_listings')
          .insert({
            listing_id: id,
            company_id: selectedCompany,
            quantity_moved: quantityMoved,
            unit: listing.unit,
            material_type: listing.material_type,
            created_by: user?.id,
            completed_at: completedAt
          })

        if (completionError) {
          console.error('Error recording completion:', completionError)
          setModalError('Failed to record completion. Please try again.')
          return
        }

        // Update local state and trigger refresh
        await fetchUserListings()
        setRefreshTrigger(prev => prev + 1)
        setListings([
          ...listings.map(listing => 
            listing.id === id ? { 
              ...listing, 
              status: 'completed', 
              quantity: quantityMoved
            } : listing
          ),
          newListing
        ])
      }

      setIsCompleteModalOpen(false)
      setSelectedCompany('')
      setQuantityMoved(0)
      setSuccessMessage('Listing updated successfully')
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
    } catch (error: any) {
      console.error('Error marking listing as done:', error)
      setModalError(error.message || 'An unexpected error occurred. Please try again.')
    }
  }

  async function handleUpdateListing(updatedListing: Listing) {
    try {
      const { error } = await supabase
        .from('listings')
        .update(updatedListing)
        .eq('id', updatedListing.id)

      if (error) throw error
      setListings(listings.map(listing => 
        listing.id === updatedListing.id ? updatedListing : listing
      ))
      setIsEditModalOpen(false)
    } catch (error: any) {
      console.error('Error updating listing:', error)
      alert('Failed to update listing. Please try again.')
    }
  }

  const filteredListings = listings.filter(listing => listing.status === statusFilter)

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
    <OnboardingGuard requiresCompany>
      <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Error Message */}
        {error && (
          <ErrorMessage 
            message={error} 
            onDismiss={() => setError(null)} 
          />
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

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
            Create Listing
          </Link>
        </div>

        {/* Status Filter */}
        <div className="mb-6">
          <div className="sm:hidden">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'active' | 'completed')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="active">Active Listings</option>
              <option value="completed">Completed Listings</option>
            </select>
          </div>
          <div className="hidden sm:block">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`${
                    statusFilter === 'active'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                >
                  Active Listings
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={`${
                    statusFilter === 'completed'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                >
                  Completed Listings
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Listings Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Your {statusFilter === 'active' ? 'Active' : 'Completed'} Listings
            </h3>
          </div>
          {filteredListings.length === 0 ? (
            <div className="px-4 py-5 sm:p-6 text-center">
              <p className="text-gray-500 mb-4">
                {statusFilter === 'active'
                  ? "You don't have any active listings."
                  : "You don't have any completed listings."}
              </p>
              {statusFilter === 'active' && (
                <Link
                  href="/listings/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create New Listing
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Site Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Material
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {statusFilter === 'completed' ? 'Completed Date' : 'Created Date'}
                    </th>
                    {statusFilter === 'completed' && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Completed With
                      </th>
                    )}
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredListings.map((listing) => {
                    const materialStyles = getMaterialTypeStyles(listing.material_type);
                    return (
                      <tr key={listing.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{listing.site_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${materialStyles.bg} ${materialStyles.text} border ${materialStyles.border}`}>
                            {formatMaterialType(listing.material_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {listing.quantity} {listing.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            listing.status === 'active' 
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-gray-100 text-gray-800 border border-gray-200'
                          }`}>
                            {listing.status === 'active' ? 'Active' : 'Completed'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {listing.status === 'completed' 
                            ? (listing.completed_listings?.[0]?.completed_at ? new Date(listing.completed_listings[0].completed_at).toLocaleDateString() : '-')
                            : new Date(listing.created_at).toLocaleDateString()}
                        </td>
                        {statusFilter === 'completed' && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {listing.completed_listings?.[0]?.companies?.name || '-'}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-start space-x-2">
                            {listing.status === 'active' ? (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedListing(listing)
                                    setIsEditModalOpen(true)
                                  }}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedListing(listing)
                                    setIsCompleteModalOpen(true)
                                    setQuantityMoved(listing.quantity)
                                    fetchCompanies()
                                  }}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                  Mark as Done
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedListing(listing)
                                  setIsEditModalOpen(true)
                                }}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                View Details
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Analytics Section */}
        {/* 
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Material Movement Analytics</h2>
          <MaterialMovementCharts refreshTrigger={refreshTrigger} />
        </div>
        */}
      </div>

      {/* Edit Modal */}
      <Transition.Root show={isEditModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setIsEditModalOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      onClick={() => setIsEditModalOpen(false)}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  {selectedListing && (
                    <div className="sm:flex sm:items-start">
                      <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                        <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                          Edit Listing
                        </Dialog.Title>
                        <div className="mt-4 space-y-4">
                          <div>
                            <label htmlFor="site_name" className="block text-sm font-medium text-gray-700">
                              Site Name
                            </label>
                            <input
                              type="text"
                              name="site_name"
                              id="site_name"
                              value={selectedListing.site_name}
                              onChange={(e) => setSelectedListing({ ...selectedListing, site_name: e.target.value })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
                            />
                          </div>
                          <div>
                            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                              Quantity
                            </label>
                            <input
                              type="number"
                              name="quantity"
                              id="quantity"
                              value={selectedListing.quantity}
                              onChange={(e) => setSelectedListing({ ...selectedListing, quantity: Number(e.target.value) })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
                            />
                          </div>
                          <div>
                            <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
                              Unit
                            </label>
                            <input
                              type="text"
                              name="unit"
                              id="unit"
                              value={selectedListing.unit}
                              onChange={(e) => setSelectedListing({ ...selectedListing, unit: e.target.value })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
                            />
                          </div>
                          <div>
                            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                              Location
                            </label>
                            <input
                              type="text"
                              name="location"
                              id="location"
                              value={selectedListing.location}
                              onChange={(e) => setSelectedListing({ ...selectedListing, location: e.target.value })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse sm:ml-4">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
                      onClick={() => selectedListing && handleUpdateListing(selectedListing)}
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                      onClick={() => setIsEditModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:mt-0 sm:w-auto sm:mr-auto"
                      onClick={() => selectedListing && handleDeleteListing(selectedListing.id)}
                    >
                      Delete Listing
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Complete Modal */}
      <Transition.Root show={isCompleteModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setIsCompleteModalOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      onClick={() => setIsCompleteModalOpen(false)}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  {selectedListing && (
                    <div className="sm:flex sm:items-start">
                      <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                        <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                          Complete Listing
                        </Dialog.Title>
                        <div className="mt-4 space-y-4">
                          <div>
                            <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                              Company
                            </label>
                            <select
                              id="company"
                              name="company"
                              value={selectedCompany}
                              onChange={(e) => setSelectedCompany(e.target.value)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
                            >
                              <option value="">Select a company</option>
                              {companies.map((company) => (
                                <option key={company.id} value={company.id}>
                                  {company.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                              Quantity Moved
                            </label>
                            <div className="mt-1 flex rounded-md shadow-sm">
                              <input
                                type="number"
                                name="quantity"
                                id="quantity"
                                value={quantityMoved || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  // Allow empty string or valid numbers
                                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                    const numValue = value === '' ? 0 : Number(value);
                                    // Don't allow more than the total quantity
                                    if (selectedListing && numValue > selectedListing.quantity) {
                                      setQuantityMoved(selectedListing.quantity);
                                    } else {
                                      setQuantityMoved(numValue);
                                    }
                                  }
                                }}
                                max={selectedListing?.quantity}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
                              />
                              <span className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
                                {selectedListing.unit}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-gray-500">
                              {selectedListing.quantity} {selectedListing.unit} total available
                            </p>
                            {quantityMoved > 0 && (
                              <p className="mt-1 text-sm text-gray-500">
                                {((quantityMoved / selectedListing.quantity) * 100).toFixed(1)}% of total quantity
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {modalError && (
                    <ErrorMessage 
                      message={modalError} 
                      onDismiss={() => setModalError(null)} 
                    />
                  )}
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
                      onClick={() => selectedListing && handleMarkAsDone(selectedListing.id)}
                    >
                      Complete
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                      onClick={() => setIsCompleteModalOpen(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
    </OnboardingGuard>
  )
} 