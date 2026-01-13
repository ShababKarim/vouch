'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuth } from '@/components/layout/AuthProvider';
import { Event, Settlement, TabType } from '@/lib/types';
import {
  ArrowLeft,
  Share2,
  Users,
  Calendar,
  MapPin,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  UserCheck,
} from 'lucide-react';
import AttendeesTab from '@/components/events/AttendeesTab';
import SettlementsTab from '@/components/events/SettlementsTab';
import { toTitleCase } from '@/lib/utils';
import DetailsTab from '@/components/events/DetailsTab';

export default function EventDetailPage() {
  const [event, setEvent] = useState<Event | null>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [isUpdatingRsvp, setIsUpdatingRsvp] = useState(false);
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const { user } = useAuth();

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Event not found');
        } else {
          throw new Error('Failed to fetch event');
        }
        return;
      }
      const data = await response.json();
      setEvent(data.event);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSettlements = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/settlements`);
      if (response.ok) {
        const data = await response.json();
        setSettlements(data);
      }
    } catch (err) {
      console.error('Failed to fetch settlements:', err);
    }
  };

  useEffect(() => {
    if (eventId && activeTab === 'settlements') {
      fetchSettlements();
    }
  }, [eventId, activeTab]);

  const handleRsvpUpdate = async (status: 'YES' | 'NO' | 'MAYBE') => {
    if (!user || !event) return;

    setIsUpdatingRsvp(true);
    try {
      const response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rsvpStatus: status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update RSVP');
      }

      // Refresh event data
      await fetchEvent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update RSVP');
    } finally {
      setIsUpdatingRsvp(false);
    }
  };

  const handleSettleSettlement = async (settlementId: string) => {
    try {
      const response = await fetch(`/api/settlements/${settlementId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to settle');
      }

      // Refresh settlements
      await fetchSettlements();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to settle');
    }
  };

  const getUserMembership = () => {
    if (!event || !user) return null;
    return event.memberships.find((m) => m.user.id === user.id);
  };

  const isHost = () => {
    const membership = getUserMembership();
    return membership?.role === 'HOST';
  };

  const handleShare = async () => {
    if (!event) return;

    const shareUrl = `${window.location.origin}/invite/${event.inviteCode}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `Join my event: ${event.title}`,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Invite link copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return 'bg-green-100 text-green-800';
      case 'ACTIVE':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      case 'RESOLVED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'details', label: 'Details', icon: Calendar },
    { id: 'attendees', label: 'Attendees', icon: Users },
    { id: 'bets', label: 'Bets', icon: DollarSign },
    { id: 'settlements', label: 'Settlements', icon: CheckCircle },
  ] as const;

  if (isLoading) {
    return (
      <ProtectedRoute requireProfile>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          </div>
          <BottomNav />
        </div>
      </ProtectedRoute>
    );
  }

  if (!event || error) {
    return (
      <ProtectedRoute requireProfile>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Event not found</h1>
              <p className="mt-2 text-gray-600">
                {error || "This event does not exist or you don't have access to it."}
              </p>
              <button
                onClick={() => router.push('/events')}
                className="mt-4 inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Back to Events
              </button>
            </div>
          </div>
          <BottomNav />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireProfile>
      <div className="min-h-screen bg-gray-50 pb-16">
        <Header />

        <main className="mx-auto max-w-4xl">
          {event.coverImage ? (
            <div className="h-48 w-full">
              <img src={event.coverImage} alt={event.title} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="h-48 w-full bg-gradient-to-br from-blue-500 to-purple-600"></div>
          )}

          <div className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-start justify-between">
              <div className="flex-1">
                <button
                  onClick={() => router.back()}
                  className="mb-4 flex items-center text-sm text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back
                </button>

                <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>

                <div className="mt-2 flex items-center space-x-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(event.status)}`}
                  >
                    {event.status.toLowerCase()}
                  </span>
                  {event.isPublic && <span className="text-xs text-gray-500">Public event</span>}
                </div>
              </div>

              <div className="ml-4 flex items-center space-x-2">
                {getUserMembership() && (
                  <div className="flex items-center space-x-2">
                    {!isHost() && (
                      <div className="flex items-center space-x-1 p-1">
                        <button
                          onClick={() => handleRsvpUpdate('YES')}
                          disabled={isUpdatingRsvp}
                          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                            getUserMembership()?.rsvpStatus === 'YES'
                              ? 'text-green-600'
                              : 'text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <CheckCircle className="mr-1 inline h-3 w-3" />
                          Going
                        </button>
                        <button
                          onClick={() => handleRsvpUpdate('MAYBE')}
                          disabled={isUpdatingRsvp}
                          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                            getUserMembership()?.rsvpStatus === 'MAYBE'
                              ? 'text-yellow-800'
                              : 'text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <Clock className="mr-1 inline h-3 w-3" />
                          Maybe
                        </button>
                        <button
                          onClick={() => handleRsvpUpdate('NO')}
                          disabled={isUpdatingRsvp}
                          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                            getUserMembership()?.rsvpStatus === 'NO'
                              ? 'text-red-600'
                              : 'text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <XCircle className="mr-1 inline h-3 w-3" />
                          Not Going
                        </button>
                      </div>
                    )}

                    {isHost() && (
                      <div className="flex items-center space-x-1">
                        <button
                          className="p-2 text-gray-500 transition-colors hover:text-gray-700"
                          title="Event settings"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                        <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
                          <UserCheck className="mr-1 h-3 w-3" />
                          Host
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleShare}
                  className="p-2 text-gray-500 transition-colors hover:text-gray-700"
                  title="Share event"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="mb-6 space-y-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                {formatDateTime(event.datetime)}
              </div>

              <div className="flex items-center">
                <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                {event.location}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="mr-2 h-4 w-4 text-gray-400" />
                  <span>{event._count.memberships} attending</span>
                </div>

                {event._count.outcomes > 0 && (
                  <div className="flex items-center">
                    <DollarSign className="mr-1 h-4 w-4 text-gray-400" />
                    <span>{event._count.outcomes} betting markets</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 overflow-x-scroll">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as TabType)}
                      className={`group inline-flex items-center border-b-2 px-1 py-4 text-sm font-medium ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      } `}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="mt-6">
              {activeTab === 'details' && <DetailsTab event={event} />}

              {activeTab === 'attendees' && (
                <AttendeesTab event={event} userMembership={getUserMembership() || undefined} />
              )}

              {activeTab === 'bets' && (
                <div>
                  <h2 className="mb-4 text-lg font-medium text-gray-900">Betting Markets</h2>
                  <p className="text-gray-500">Betting functionality coming soon...</p>
                </div>
              )}

              {activeTab === 'settlements' && (
                <SettlementsTab settlements={settlements} handleSettleSettlement={handleSettleSettlement} />
              )}
            </div>
          </div>
        </main>

        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}
