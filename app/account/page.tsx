'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/supabase-js';
import { formatPhoneNumber, unformatPhoneNumber } from '@/utils/phoneUtils';

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth/signin');
          return;
        }
        setUser(user);
        setEmail(user.email || '');
        const phoneNumber = user.user_metadata?.phone || '';
        setPhone(formatPhoneNumber(phoneNumber));
      } catch (error) {
        console.error('Error loading user:', error);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [router, supabase]);

  const handleUpdateProfile = async () => {
    try {
      setError(null);
      setSuccess(null);

      const unformattedPhone = unformatPhoneNumber(phone);

      const { error: updateError } = await supabase.auth.updateUser({
        email: email,
        data: {
          phone: unformattedPhone,
          first_name: user?.user_metadata?.first_name,
          last_name: user?.user_metadata?.last_name,
          company_name: user?.user_metadata?.company_name
        }
      });

      if (updateError) throw updateError;

      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handlePasswordReset = async () => {
    try {
      setError(null);
      setSuccess(null);

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (resetError) throw resetError;

      setSuccess('Password reset email sent. Please check your inbox.');
    } catch (error: any) {
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h1>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Read-only fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <div className="mt-1">
                <input
                  type="text"
                  value={user?.user_metadata?.first_name || ''}
                  disabled
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <div className="mt-1">
                <input
                  type="text"
                  value={user?.user_metadata?.last_name || ''}
                  disabled
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Company</label>
              <div className="mt-1">
                <input
                  type="text"
                  value={user?.user_metadata?.company_name || ''}
                  disabled
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-900"
                />
              </div>
            </div>

            {/* Editable fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <div className="mt-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isEditing}
                  className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${
                    isEditing ? 'bg-white text-gray-900' : 'bg-gray-50 text-gray-900'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <div className="mt-1">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!isEditing}
                  className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${
                    isEditing ? 'bg-white text-gray-900' : 'bg-gray-50 text-gray-900'
                  }`}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
              {isEditing ? (
                <>
                  <button
                    onClick={handleUpdateProfile}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Edit Profile
                </button>
              )}

              <button
                onClick={handlePasswordReset}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 