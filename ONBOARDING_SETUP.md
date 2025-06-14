# Onboarding System Setup Guide

## Overview

We've built a comprehensive onboarding system for users who have signed up but don't yet have a company association. This system allows users to either join an existing company or create a new one.

## Components Created

### 1. Database Schema

**New Migration Files:**
- `supabase/migrations/20250614080000_create_user_companies_table.sql`
- `supabase/migrations/20250614080001_seed_companies.sql`

**Tables Added:**
- `user_companies`: Junction table for user-company relationships
  - Fields: `id`, `user_id`, `company_id`, `role`, `status`, `joined_at`, `created_at`, `updated_at`
  - Roles: `admin`, `manager`, `member`
  - Status: `active`, `inactive`, `pending`

### 2. Pages Created

**Main Onboarding Pages:**
- `/app/onboarding/page.tsx` - Company search and selection interface
- `/app/onboarding/create-company/page.tsx` - New company creation form

### 3. Utility Functions

**`lib/onboarding.ts`:**
- `checkUserOnboardingStatus()` - Checks if user has active company relationship
- `getUserCompany()` - Gets user's current company information
- `shouldRedirectToOnboarding()` - Determines if user should be redirected

### 4. Components

**`components/OnboardingGuard.tsx`:**
- Wrapper component that protects pages requiring company affiliation
- Automatically redirects users to onboarding if needed

### 5. Updated Pages

**Pages now protected with OnboardingGuard:**
- `/app/listings/new/page.tsx` - Create new listing (requires company)
- `/app/listings/manage/page.tsx` - Manage listings (requires company)

**Updated authentication flow:**
- `/app/auth/login/page.tsx` - Checks onboarding status after login
- `/app/auth/callback/page.tsx` - Redirects to onboarding after email verification
- `/app/auth/signup/page.tsx` - Simplified signup (company info moved to onboarding)

## User Flow

1. **New User Signup:**
   - User fills basic info (name, email, password, position, phone)
   - Company-related fields removed from signup form
   - After email verification → redirects to `/onboarding`

2. **Onboarding Process:**
   - Step 2 of 2 progress indicator
   - Search for existing companies
   - Three sample companies displayed: Dunder Mifflin, Acme Inc., Scoops Ahoy
   - Option to "Join" existing company or "Create new company"

3. **Create New Company:**
   - Comprehensive form with company details
   - Industry selection, company size, address, etc.
   - User becomes admin of newly created company

4. **Company Association:**
   - Creates record in `user_companies` table
   - Updates user metadata with `company_id`
   - Redirects to main app (`/listings`)

5. **Protected Pages:**
   - Pages requiring company affiliation check user status
   - Automatically redirect to onboarding if needed
   - No company = can't access listing creation/management

## To Deploy/Test

1. **Apply Database Migrations:**
   ```bash
   supabase db reset
   # or
   supabase migration up
   ```

2. **Environment Setup:**
   - Ensure Mapbox token is configured
   - Supabase environment variables are set

3. **Test Flow:**
   - Create new user account
   - Verify email
   - Should be redirected to onboarding
   - Try joining existing company or creating new one
   - Access protected pages (should work after company association)
   - Try accessing protected pages without company (should redirect)

## Features

- **Responsive Design:** Works on mobile and desktop
- **Search Functionality:** Type-ahead search for companies
- **Company Logos:** Avatar initials for companies
- **Role-based Access:** Admin, Manager, Member roles
- **Progress Indicators:** Clear step progression
- **Error Handling:** Comprehensive error messages
- **Loading States:** Proper loading indicators

## Security

- **Row Level Security (RLS):** Enabled on all tables
- **User Authentication:** Required for all operations
- **Company Access Control:** Users can only see their own company relationships
- **Admin Permissions:** Company admins can view all company relationships

## Future Enhancements

1. **Company Invitations:** Allow companies to invite users
2. **Company Profiles:** Detailed company pages
3. **Multi-company Support:** Users belonging to multiple companies
4. **Company Verification:** Admin approval process for new companies
5. **Company Search Filters:** Filter by industry, location, size
6. **Company Logos:** Upload and display actual company logos

The onboarding system is now fully functional and ready for testing! 