'use client'

import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

export default function Navbar() {
  const { user, signOut } = useAuth()

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-indigo-600">
                Construction Marketplace
              </span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/listings"
                className="inline-flex items-center px-1 pt-1 text-gray-900"
              >
                Browse Materials
              </Link>
              {user && (
                <Link
                  href="/listings/new"
                  className="inline-flex items-center px-1 pt-1 text-gray-900"
                >
                  Post New Listing
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">{user.email}</span>
                <button
                  onClick={() => signOut()}
                  className="text-gray-700 hover:text-gray-900"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="text-gray-700 hover:text-gray-900"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}