'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'

export default function SignUpPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const company = formData.get('company') as string
    const position = formData.get('position') as string
    const zipCode = formData.get('zipCode') as string

    try {
      // First, sign up the user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        console.error('Sign up error:', signUpError)
        throw signUpError
      }

      // If we have a user, create their profile using the admin client
      if (signUpData?.user) {
        console.log('Creating user profile for:', signUpData.user.id)
        
        // Use supabaseAdmin to bypass RLS
        const { error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .insert([{
            user_id: signUpData.user.id,
            first_name: firstName,
            last_name: lastName,
            company: company,
            position: position,
            zip_code: zipCode
          }])

        if (profileError) {
          console.error('Profile creation error details:', profileError)
          throw new Error(`Failed to create profile: ${profileError.message}`)
        }

        // Show success message and redirect
        router.push('/auth/verify-email')
      } else {
        throw new Error('No user data after signup')
      }
    } catch (error: any) {
      console.error('Full error details:', error)
      setError(error.message || 'An error occurred during sign up. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-4">
          Try Dirt Market
        </h1>
        <h2 className="text-center text-xl text-gray-900 px-4">
          Connect with construction sites to trade materials.
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-900 mb-1">
                  First name <span className="text-red-500">*</span>
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-4 py-2 font-sans text-gray-900 placeholder-gray-500"
                />
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-900 mb-1">
                  Last name <span className="text-red-500">*</span>
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-4 py-2 font-sans text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-1">
                Work email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-4 py-2 font-sans text-gray-900 placeholder-gray-500"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-4 py-2 font-sans text-gray-900 placeholder-gray-500"
              />
            </div>

            {/* Company */}
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-900 mb-1">
                Company name <span className="text-red-500">*</span>
              </label>
              <input
                id="company"
                name="company"
                type="text"
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-4 py-2 font-sans text-gray-900 placeholder-gray-500"
              />
            </div>

            {/* Position */}
            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-900 mb-1">
                Position <span className="text-red-500">*</span>
              </label>
              <select
                id="position"
                name="position"
                required
                defaultValue=""
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-4 py-2 font-sans text-gray-900"
              >
                <option value="" disabled>Select your position</option>
                <option value="Foreman/Site Superintendent">Foreman/Site Superintendent</option>
                <option value="Project Manager">Project Manager</option>
                <option value="Estimator">Estimator</option>
              </select>
            </div>

            {/* Zip Code */}
            <div>
              <label htmlFor="zipCode" className="block text-sm font-medium text-gray-900 mb-1">
                Company ZIP code <span className="text-red-500">*</span>
              </label>
              <input
                id="zipCode"
                name="zipCode"
                type="text"
                required
                pattern="[0-9]{5}"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-4 py-2 font-sans text-gray-900 placeholder-gray-500"
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-900">
                  Already have an account?
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/auth/login"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}