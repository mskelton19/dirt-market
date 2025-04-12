'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the token from URL
        const token_hash = searchParams.get('token_hash')
        const type = searchParams.get('type') as 'email'
        
        if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type,
          })

          if (error) {
            throw error
          }

          // If verification successful, redirect to listings page
          router.push('/listings')
        }
      } catch (error) {
        console.error('Error verifying email:', error)
        // If there's an error, redirect to sign in
        router.push('/auth/signin')
      }
    }

    handleEmailConfirmation()
  }, [router, searchParams, supabase.auth])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Verifying your email...
          </h2>
        </div>
      </div>
    </div>
  )
} 