'use client';

import { useState } from 'react';
import { Event } from '@/lib/types';
import AttendeeList from './AttendeeList';
import AddAttendeeModal from './AddAttendeeModal';
import TextBlastModal from './TextBlastModal';

export default function AttendeesTab({ event, userMembership }: { event: Event; userMembership?: { id: string; role: string; rsvpStatus: string } }) {
  const [isAddAttendeeModalOpen, setIsAddAttendeeModalOpen] = useState(false);
  const [isTextBlastModalOpen, setIsTextBlastModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddAttendee = async (phone: string) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/events/${event.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add attendee');
      }

      // Refresh event data
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add attendee');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromoteMember = async (userId: string, newRole: 'COHOST') => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/events/${event.id}/members/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to promote member');
      }

      // Refresh event data
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to promote member');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/events/${event.id}/members/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove member');
      }

      // Refresh event data
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendBlast = async (message: string, filter: 'all' | 'yes' | 'maybe') => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/events/${event.id}/blast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, filter }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send text blast');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send text blast');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AttendeeList
        event={event}
        currentUserMembership={userMembership}
        onPromoteMember={handlePromoteMember}
        onRemoveMember={handleRemoveMember}
        onOpenAddAttendee={() => setIsAddAttendeeModalOpen(true)}
        onOpenTextBlast={() => setIsTextBlastModalOpen(true)}
      />

      <AddAttendeeModal
        isOpen={isAddAttendeeModalOpen}
        onClose={() => setIsAddAttendeeModalOpen(false)}
        onAddAttendee={handleAddAttendee}
      />

      <TextBlastModal
        isOpen={isTextBlastModalOpen}
        onClose={() => setIsTextBlastModalOpen(false)}
        onSendBlast={handleSendBlast}
        event={event}
      />
    </>
  );
}
