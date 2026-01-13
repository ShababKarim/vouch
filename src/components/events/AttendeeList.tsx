'use client';

import { useState } from 'react';
import { Users, Crown, UserMinus, ChevronUp, MessageSquare } from 'lucide-react';
import { Event } from '@/lib/types';

interface AttendeeListProps {
  event: Event;
  currentUserMembership?: {
    id: string;
    role: string;
    rsvpStatus: string;
  };
  onPromoteMember: (userId: string, newRole: 'COHOST') => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
  onOpenAddAttendee: () => void;
  onOpenTextBlast: () => void;
}

export default function AttendeeList({
  event,
  currentUserMembership,
  onPromoteMember,
  onRemoveMember,
  onOpenAddAttendee,
  onOpenTextBlast,
}: AttendeeListProps) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const isHost = currentUserMembership?.role === 'HOST' || currentUserMembership?.role === 'COHOST';

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'HOST':
        return (
          <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
            <Crown className="mr-1 h-3 w-3" />
            Host
          </span>
        );
      case 'COHOST':
        return (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
            <Crown className="mr-1 h-3 w-3" />
            Co-host
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
            <Users className="mr-1 h-3 w-3" />
            Attendee
          </span>
        );
    }
  };

  const getRsvpBadge = (status: string) => {
    switch (status) {
      case 'YES':
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
            Going
          </span>
        );
      case 'NO':
        return (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
            Not Going
          </span>
        );
      case 'MAYBE':
        return (
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
            Maybe
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
            Pending
          </span>
        );
    }
  };

  const handlePromote = async (userId: string) => {
    console.log('Promoting member:', userId);
    setIsUpdating(userId);
    try {
      await onPromoteMember(userId, 'COHOST');
    } catch (error) {
      console.error('Failed to promote member:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRemove = async (userId: string) => {
    console.log('Removing member:', userId);
    if (!confirm('Are you sure you want to remove this member?')) return;
    
    setIsUpdating(userId);
    try {
      await onRemoveMember(userId);
    } catch (error) {
      console.error('Failed to remove member:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  const sortedMemberships = event.memberships.sort((a, b) => {
    const roleOrder = { HOST: 0, COHOST: 1, ATTENDEE: 2 };
    const roleDiff = roleOrder[a.role as keyof typeof roleOrder] - roleOrder[b.role as keyof typeof roleOrder];
    if (roleDiff !== 0) return roleDiff;
    return a.user.displayName.localeCompare(b.user.displayName);
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">
          Attendees ({event._count.memberships})
        </h2>
        {isHost && (
          <div className="flex space-x-2">
            <button
              onClick={() => {
                console.log('Opening text blast modal');
                onOpenTextBlast();
              }}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Text Blast
            </button>
            <button
              onClick={() => {
                console.log('Opening add attendee modal');
                onOpenAddAttendee();
              }}
              className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              Add Attendee
            </button>
          </div>
        )}
      </div>

      {event.memberships.length === 0 ? (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No attendees yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            {isHost ? 'Add some attendees to get started!' : 'Be the first to join this event!'}
          </p>
          {isHost && (
            <div className="mt-6">
              <button
                onClick={onOpenAddAttendee}
                className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
              >
                Add First Attendee
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedMemberships.map((membership) => (
            <div
              key={membership.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="flex items-center flex-1">
                {membership.user.photoUrl ? (
                  <img
                    src={membership.user.photoUrl}
                    alt={membership.user.displayName}
                    className="mr-3 h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                    <Users className="h-5 w-5 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900">
                      {membership.user.displayName}
                    </p>
                    {getRoleBadge(membership.role)}
                  </div>
                  <div className="mt-1">
                    {getRsvpBadge(membership.rsvpStatus)}
                  </div>
                </div>
              </div>

              {isHost && membership.role !== 'HOST' && (
                <div className="flex items-center space-x-2">
                  {membership.role === 'ATTENDEE' && (
                    <button
                      onClick={() => handlePromote(membership.user.id)}
                      disabled={isUpdating === membership.user.id}
                      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronUp className="mr-1 h-3 w-3" />
                      Promote
                    </button>
                  )}
                  <button
                    onClick={() => handleRemove(membership.user.id)}
                    disabled={isUpdating === membership.user.id}
                    className="inline-flex items-center rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 shadow-sm hover:bg-red-100 disabled:opacity-50"
                  >
                    <UserMinus className="mr-1 h-3 w-3" />
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
