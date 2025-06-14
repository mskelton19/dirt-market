'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

type Company = {
  id: string
  name: string
  address_line1?: string
  city?: string
  state?: string
  postal_code?: string
}

export default function OnboardingPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [companies, setCompanies] = useState<Company[]>([])
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (user) {
      fetchCompanies()
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCompanies(companies.slice(0, 3)) // Show first 3 companies
    } else {
      const filtered = companies.filter(company =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredCompanies(filtered.slice(0, 10)) // Show up to 10 results
    }
  }, [searchTerm, companies])

  async function fetchCompanies() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, address_line1, city, state, postal_code')
        .eq('status', 'active')
        .order('name')

      if (error) throw error

      setCompanies(data || [])
    } catch (error: any) {
      console.error('Error fetching companies:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleJoinCompany(companyId: string) {
    if (!user) return

    try {
      setIsJoining(true)
      
      // Create user-company relationship
      const { error: relationError } = await supabase
        .from('user_companies')
        .insert({
          user_id: user.id,
          company_id: companyId,
          role: 'member',
          status: 'active'
        })

      if (relationError) throw relationError

      // Update user metadata to include company_id
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          company_id: companyId
        }
      })

      if (updateError) throw updateError

      // Redirect to main app
      router.push('/listings')
    } catch (error: any) {
      console.error('Error joining company:', error)
      setError(error.message)
    } finally {
      setIsJoining(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Step 2 of 2</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-indigo-600 h-2 rounded-full w-full"></div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Connect to your company</h1>
          <p className="mt-2 text-gray-600">Search for your company or create a new one</p>
        </div>

        {/* Search Input */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Start typing..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Company List */}
        <div className="space-y-3 mb-6">
          {filteredCompanies.map((company) => (
            <div key={company.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-medium text-sm">
                    {company.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{company.name}</h3>
                  {(company.address_line1 || company.city) && (
                    <p className="text-sm text-gray-500">
                      {[company.address_line1, company.city, company.state, company.postal_code]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleJoinCompany(company.id)}
                disabled={isJoining}
                className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded-md hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isJoining ? 'Joining...' : 'Join'}
              </button>
            </div>
          ))}
        </div>

        {/* No Results */}
        {searchTerm && filteredCompanies.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <p>No companies found matching "{searchTerm}"</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Can't find it?</span>
            <button
              onClick={() => router.push('/onboarding/create-company')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Create new company
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 