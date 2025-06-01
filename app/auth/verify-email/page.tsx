'use client'

import Link from 'next/link'

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
          Check your email
        </h2>
        <div className="mt-4 text-center text-gray-600">
          We sent you a verification link. Please check your email and click the link to verify your account.
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">What happens next?</h3>
              <div className="mt-2 space-y-4 text-sm text-gray-600">
                <p>1. Check your email inbox (and spam folder)</p>
                <p>2. Click the verification link in the email</p>
                <p>3. Once verified, you can sign in to your account</p>
              </div>
            </div>

            <div className="text-sm">
              <p className="text-gray-600">
                Didn't receive the email? Check your spam folder or{' '}
                <Link href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                  try signing up again
                </Link>
              </p>
            </div>

            <div className="mt-6">
              <Link
                href="/auth/login"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Return to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 