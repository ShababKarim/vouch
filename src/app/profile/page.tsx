'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { useAuth } from '@/components/layout/AuthProvider'
import { Camera, User, DollarSign, TrendingUp, TrendingDown, LogOut } from 'lucide-react'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [ledger, setLedger] = useState<any[]>([])
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '')
      setPhotoUrl(user.photoUrl || '')
      fetchLedger()
    }
  }, [user])

  const fetchLedger = async () => {
    try {
      const response = await fetch(`/api/users/${user?.id}/ledger`)
      if (response.ok) {
        const data = await response.json()
        setLedger(data)
      }
    } catch (err) {
      console.error('Failed to fetch ledger:', err)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!displayName.trim()) {
      setError('Display name is required')
      return
    }

    setIsUpdatingProfile(true)
    setError('')

    try {
      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: displayName.trim(), photoUrl: photoUrl || undefined })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update profile')
      }

      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profile update failed')
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be less than 5MB')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const { url } = await response.json()
      setPhotoUrl(url)
      setError('')
    } catch (err) {
      setError('Failed to upload photo')
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const totalOwed = ledger.reduce((sum, item) => sum + (item.netAmount < 0 ? Math.abs(item.netAmount) : 0), 0)
  const totalOwing = ledger.reduce((sum, item) => sum + (item.netAmount > 0 ? item.netAmount : 0), 0)

  if (!user) {
    return null
  }

  return (
    <ProtectedRoute requireProfile>
      <div className="min-h-screen bg-gray-50 pb-16">
        <Header />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your account and view your betting ledger
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h2>
              
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Profile photo
                  </label>
                  <div className="flex items-center space-x-6">
                    <div className="shrink-0">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt="Profile"
                          className="h-20 w-20 object-cover rounded-full"
                        />
                      ) : (
                        <div className="h-20 w-20 bg-gray-200 rounded-full flex items-center justify-center">
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
                        className="bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Camera className="h-4 w-4 inline mr-1" />
                        Change photo
                      </button>
                      <p className="mt-1 text-xs text-gray-500">
                        JPG, PNG or GIF. Max 5MB.
                      </p>
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
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter your name"
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    value={user.phone}
                    disabled
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Phone number cannot be changed
                  </p>
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
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdatingProfile ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Betting Ledger</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <TrendingDown className="h-5 w-5 text-red-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-red-900">Total Owed</p>
                      <p className="text-lg font-bold text-red-600">
                        ${totalOwed.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-green-900">Total Owing</p>
                      <p className="text-lg font-bold text-green-600">
                        ${totalOwing.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {ledger.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No betting activity</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Your betting ledger will appear here once you participate in events.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ledger.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        {item.user.photoUrl ? (
                          <img
                            src={item.user.photoUrl}
                            alt={item.user.displayName}
                            className="h-8 w-8 rounded-full object-cover mr-3"
                          />
                        ) : (
                          <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                            <User className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.user.displayName}</p>
                          <p className="text-xs text-gray-500">
                            {item.events.length} event{item.events.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${
                          item.netAmount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {item.netAmount > 0 ? '+' : ''}${item.netAmount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.netAmount > 0 ? 'you are owed' : 'you owe'}
                        </p>
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
  )
}
