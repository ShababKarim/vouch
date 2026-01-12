'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { useAuth } from '@/components/layout/AuthProvider'
import { Event, Settlement, TabType } from '@/lib/types'
import { ArrowLeft, Share2, Users, Calendar, MapPin, DollarSign, CheckCircle, XCircle, Clock, Settings, UserCheck } from 'lucide-react'
import AttendeesTab from "@/components/events/AttendeesTab";
import SettlementsTab from "@/components/events/SettlementsTab";

export default function EventDetailPage() {
  const [event, setEvent] = useState<Event | null>(null)
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('details')
  const [isUpdatingRsvp, setIsUpdatingRsvp] = useState(false)
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  const { user } = useAuth()

  useEffect(() => {
    if (eventId) {
      fetchEvent()
    }
  }, [eventId])

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError('Event not found')
        } else {
          throw new Error('Failed to fetch event')
        }
        return
      }
      const data = await response.json()
      setEvent(data.event)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSettlements = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/settlements`)
      if (response.ok) {
        const data = await response.json()
        setSettlements(data)
      }
    } catch (err) {
      console.error('Failed to fetch settlements:', err)
    }
  }

  useEffect(() => {
    if (eventId && activeTab === 'settlements') {
      fetchSettlements()
    }
  }, [eventId, activeTab])

  const handleRsvpUpdate = async (status: 'YES' | 'NO' | 'MAYBE') => {
    if (!user || !event) return

    setIsUpdatingRsvp(true)
    try {
      const response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rsvpStatus: status })
      })

      if (!response.ok) {
        throw new Error('Failed to update RSVP')
      }

      // Refresh event data
      await fetchEvent()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update RSVP')
    } finally {
      setIsUpdatingRsvp(false)
    }
  }

  const handleSettleSettlement = async (settlementId: string) => {
    try {
      const response = await fetch(`/api/settlements/${settlementId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Failed to settle')
      }

      // Refresh settlements
      await fetchSettlements()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to settle')
    }
  }

  const getUserMembership = () => {
    if (!event || !user) return null
    return event.memberships.find(m => m.user.id === user.id)
  }

  const isHost = () => {
    const membership = getUserMembership()
    return membership?.role === 'HOST'
  }

  const handleShare = async () => {
    if (!event) return

    const shareUrl = `${window.location.origin}/invite/${event.inviteCode}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `Join my event: ${event.title}`,
          url: shareUrl
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl)
        alert('Invite link copied to clipboard!')
      } catch (err) {
        console.error('Failed to copy link:', err)
      }
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return 'bg-green-100 text-green-800'
      case 'ACTIVE':
        return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      case 'RESOLVED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const toTitleCase = (str: string) => {
    return str.toLowerCase().replace(/\b\w/g, (match) => match.toUpperCase())
  }

  const tabs = [
    { id: 'details', label: 'Details', icon: Calendar },
    { id: 'attendees', label: 'Attendees', icon: Users },
    { id: 'bets', label: 'Bets', icon: DollarSign },
    { id: 'settlements', label: 'Settlements', icon: CheckCircle },
  ] as const

  if (isLoading) {
    return (
      <ProtectedRoute requireProfile>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <BottomNav />
        </div>
      </ProtectedRoute>
    )
  }

  if (!event || error) {
    return (
      <ProtectedRoute requireProfile>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Event not found</h1>
              <p className="mt-2 text-gray-600">{error || 'This event does not exist or you don\'t have access to it.'}</p>
              <button
                onClick={() => router.push('/events')}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Back to Events
              </button>
            </div>
          </div>
          <BottomNav />
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requireProfile>
      <div className="min-h-screen bg-gray-50 pb-16">
        <Header />
        
        <main className="max-w-4xl mx-auto">
          {event.coverImage ? (
            <div className="h-48 w-full">
              <img
                src={event.coverImage}
                alt={event.title}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="h-48 w-full bg-gradient-to-br from-blue-500 to-purple-600"></div>
          )}

          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <button
                  onClick={() => router.back()}
                  className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </button>
                
                <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
                
                <div className="mt-2 flex items-center space-x-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                    {event.status.toLowerCase()}
                  </span>
                  {event.isPublic && (
                    <span className="text-xs text-gray-500">Public event</span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                {getUserMembership() && (
                  <div className="flex items-center space-x-2">
                    {!isHost() && (
                      <div className="flex items-center space-x-1 p-1">
                        <button
                          onClick={() => handleRsvpUpdate('YES')}
                          disabled={isUpdatingRsvp}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            getUserMembership()?.rsvpStatus === 'YES'
                              ? 'text-green-600'
                              : 'text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <CheckCircle className="h-3 w-3 inline mr-1" />
                          Going
                        </button>
                        <button
                          onClick={() => handleRsvpUpdate('MAYBE')}
                          disabled={isUpdatingRsvp}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            getUserMembership()?.rsvpStatus === 'MAYBE'
                              ? 'text-yellow-800'
                              : 'text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <Clock className="h-3 w-3 inline mr-1" />
                          Maybe
                        </button>
                        <button
                          onClick={() => handleRsvpUpdate('NO')}
                          disabled={isUpdatingRsvp}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            getUserMembership()?.rsvpStatus === 'NO'
                              ? 'text-red-600'
                              : 'text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <XCircle className="h-3 w-3 inline mr-1" />
                          Not Going
                        </button>
                      </div>
                    )}
                    
                    {isHost() && (
                      <div className="flex items-center space-x-1">
                        <button
                          className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                          title="Event settings"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <UserCheck className="h-3 w-3 mr-1" />
                          Host
                        </span>
                      </div>
                    )}
                  </div>
                )}
                
                <button
                  onClick={handleShare}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                  title="Share event"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4 text-sm text-gray-600 mb-6">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                {formatDateTime(event.datetime)}
              </div>
              
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                {event.location}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{event._count.memberships} attending</span>
                </div>
                
                {event._count.outcomes > 0 && (
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                    <span>{event._count.outcomes} betting markets</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as TabType)}
                      className={`
                        group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                        ${activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }
                      `}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </div>

            <div className="mt-6">
              {activeTab === 'details' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 mb-2">About this event</h2>
                    {event.description ? (
                      <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
                    ) : (
                      <p className="text-gray-500 italic">No description provided</p>
                    )}
                  </div>

                  <div>
                    <h2 className="text-lg font-medium text-gray-900 mb-2">Event details</h2>
                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Status</dt>
                        <dd className="mt-1 text-sm text-gray-900">{toTitleCase(event.status)}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Privacy</dt>
                        <dd className="mt-1 text-sm text-gray-900">{event.isPublic ? 'Public' : 'Private'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Invite code</dt>
                        <dd className="mt-1 text-sm text-gray-900 font-mono">{event.inviteCode}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}

              {activeTab === 'attendees' &&
                  <AttendeesTab event={event} />
              }

              {activeTab === 'bets' && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Betting Markets</h2>
                  <p className="text-gray-500">Betting functionality coming soon...</p>
                </div>
              )}

              {activeTab === 'settlements' && <SettlementsTab settlements={settlements} handleSettleSettlement={handleSettleSettlement} />}
            </div>
          </div>
        </main>
        
        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}
