'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuth } from '@/components/layout/AuthProvider';
import { Camera, User, DollarSign, TrendingUp, TrendingDown, LogOut } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [ledger, setLedger] = useState<any[]>([]);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPhotoUrl(user.photoUrl || '');
      fetchLedger();
    }
  }, [user]);

  const fetchLedger = async () => {
    try {
      const response = await fetch(`/api/users/${user?.id}/ledger`);
      if (response.ok) {
        const data = await response.json();
        setLedger(data);
      }
    } catch (err) {
      console.error('Failed to fetch ledger:', err);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      setError('Display name is required');
      return;
    }

    setIsUpdatingProfile(true);
    setError('');

    try {
      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName.trim(),
          photoUrl: photoUrl || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profile update failed');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be less than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { url } = await response.json();
      setPhotoUrl(url);
      setError('');
    } catch (err) {
      setError('Failed to upload photo');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const totalOwed = ledger.reduce((sum, item) => sum + (item.netAmount < 0 ? Math.abs(item.netAmount) : 0), 0);
  const totalOwing = ledger.reduce((sum, item) => sum + (item.netAmount > 0 ? item.netAmount : 0), 0);

  if (!user) {
    return null;
  }

  return (
    <ProtectedRoute requireProfile>
      <div className="min-h-screen bg-gray-50 pb-16">
        <Header />

        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <p className="mt-1 text-sm text-gray-600">Manage your account and view your betting ledger</p>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-medium text-gray-900">Profile Information</h2>

              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div>
                  <label className="mb-4 block text-sm font-medium text-gray-700">Profile photo</label>
                  <div className="flex items-center space-x-6">
                    <div className="shrink-0">
                      {photoUrl ? (
                        <img src={photoUrl} alt="Profile" className="h-20 w-20 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200">
                          <User className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm leading-4 font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                      >
                        <Camera className="mr-1 inline h-4 w-4" />
                        Change photo
                      </button>
                      <p className="mt-1 text-xs text-gray-500">JPG, PNG or GIF. Max 5MB.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                    Display name
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Enter your name"
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone number</label>
                  <input
                    type="tel"
                    value={user.phone}
                    disabled
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 text-gray-500 shadow-sm sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">Phone number cannot be changed</p>
                </div>

                {error && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="text-sm text-red-800">{error}</div>
                  </div>
                )}

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </button>

                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isUpdatingProfile ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-medium text-gray-900">Betting Ledger</h2>

              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-red-50 p-4">
                  <div className="flex items-center">
                    <TrendingDown className="mr-2 h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-red-900">Total Owed</p>
                      <p className="text-lg font-bold text-red-600">${totalOwed.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-green-50 p-4">
                  <div className="flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-900">Total Owing</p>
                      <p className="text-lg font-bold text-green-600">${totalOwing.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {ledger.length === 0 ? (
                <div className="py-8 text-center">
                  <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No betting activity</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Your betting ledger will appear here once you participate in events.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ledger.map((item, index) => (
                    <div key={index} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                      <div className="flex items-center">
                        {item.user.photoUrl ? (
                          <img
                            src={item.user.photoUrl}
                            alt={item.user.displayName}
                            className="mr-3 h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                            <User className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.user.displayName}</p>
                          <p className="text-xs text-gray-500">
                            {item.events.length} event
                            {item.events.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${item.netAmount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.netAmount > 0 ? '+' : ''}${item.netAmount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">{item.netAmount > 0 ? 'you are owed' : 'you owe'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>

        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}
