import { User } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export interface UserCompany {
  id: string
  user_id: string
  company_id: string
  role: 'admin' | 'manager' | 'member'
  status: 'active' | 'inactive' | 'pending'
  joined_at: string
  companies: {
    id: string
    name: string
    slug: string
  }
}

/**
 * Check if a user has completed onboarding (has an active company relationship)
 */
export async function checkUserOnboardingStatus(user: User | null): Promise<{
  needsOnboarding: boolean
  userCompany: UserCompany | null
  error: string | null
}> {
  if (!user) {
    return {
      needsOnboarding: true,
      userCompany: null,
      error: 'No authenticated user'
    }
  }

  try {
    const supabase = createClientComponentClient()

    // Check if user has an active company relationship
    const { data: userCompany, error } = await supabase
      .from('user_companies')
      .select(`
        *,
        companies (
          id,
          name,
          slug
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected if no company relationship exists
      throw error
    }

    const needsOnboarding = !userCompany
    
    return {
      needsOnboarding,
      userCompany: userCompany as UserCompany | null,
      error: null
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('Error checking onboarding status:', error)
    return {
      needsOnboarding: true,
      userCompany: null,
      error: errorMessage
    }
  }
}

/**
 * Get user's current company information
 */
export async function getUserCompany(user: User): Promise<UserCompany | null> {
  try {
    const supabase = createClientComponentClient()

    const { data: userCompany, error } = await supabase
      .from('user_companies')
      .select(`
        *,
        companies (
          id,
          name,
          slug,
          industry,
          company_size,
          address_line1,
          city,
          state,
          postal_code
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No company relationship found
      }
      throw error
    }

    return userCompany as UserCompany
  } catch (error) {
    console.error('Error getting user company:', error)
    return null
  }
}

/**
 * Check if user should be redirected to onboarding
 * This can be used in pages that require a user to have a company
 */
export function shouldRedirectToOnboarding(pathname: string): boolean {
  // Don't redirect if already on onboarding pages
  if (pathname.startsWith('/onboarding')) {
    return false
  }

  // Don't redirect for auth pages
  if (pathname.startsWith('/auth')) {
    return false
  }

  // Don't redirect for public pages
  const publicPages = ['/', '/listings']
  if (publicPages.includes(pathname)) {
    return false
  }

  // Redirect for pages that require company association
  const protectedPages = ['/listings/new', '/listings/manage']
  return protectedPages.includes(pathname)
} 