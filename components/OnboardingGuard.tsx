'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { checkUserOnboardingStatus, shouldRedirectToOnboarding } from '@/lib/onboarding'

interface OnboardingGuardProps {
  children: React.ReactNode
  requiresCompany?: boolean
}

export default function OnboardingGuard({ children, requiresCompany = false }: OnboardingGuardProps) {
  const [loading, setLoading] = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    async function checkOnboardingStatus() {
      if (authLoading) return

      if (!user) {
        setLoading(false)
        return
      }

      try {
        const { needsOnboarding: userNeedsOnboarding } = await checkUserOnboardingStatus(user)
        
        setNeedsOnboarding(userNeedsOnboarding)

        // Redirect to onboarding if user needs it and is on a protected page
        if (userNeedsOnboarding && (requiresCompany || shouldRedirectToOnboarding(pathname))) {
          router.push('/onboarding')
          return
        }

        setLoading(false)
      } catch (error) {
        console.error('Error checking onboarding status:', error)
        setLoading(false)
      }
    }

    checkOnboardingStatus()
  }, [user, authLoading, router, pathname, requiresCompany])

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

  // If user needs onboarding and we're on a protected page, don't render children
  // (they should be redirected, but this prevents flash of content)
  if (needsOnboarding && (requiresCompany || shouldRedirectToOnboarding(pathname))) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to onboarding...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
} 