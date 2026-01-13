'use client';

import { useState } from 'react';
import { X, MessageSquare, Send, Users, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Event } from '@/lib/types';

interface TextBlastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendBlast: (message: string, filter: 'all' | 'yes' | 'maybe') => Promise<void>;
  event: Event;
}

export default function TextBlastModal({ isOpen, onClose, onSendBlast, event }: TextBlastModalProps) {
  console.log('TextBlastModal render - isOpen:', isOpen);

  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState<'all' | 'yes' | 'maybe'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const getRecipientCount = () => {
    switch (filter) {
      case 'yes':
        return event.memberships.filter((m) => m.rsvpStatus === 'YES').length;
      case 'maybe':
        return event.memberships.filter((m) => m.rsvpStatus === 'MAYBE').length;
      default:
        return event.memberships.length;
    }
  };

  const getRecipientDescription = () => {
    const count = getRecipientCount();
    if (count === 0) return 'No recipients';

    let status = '';
    switch (filter) {
      case 'yes':
        status = 'going';
        break;
      case 'maybe':
        status = 'maybe going';
        break;
      default:
        status = 'attendees';
    }

    return `${count} ${status}${count !== 1 ? '' : ''}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    if (message.length > 160) {
      setError('Message must be 160 characters or less');
      return;
    }

    if (getRecipientCount() === 0) {
      setError('No recipients match the selected filter');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onSendBlast(message.trim(), filter);
      setMessage('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send text blast');
    } finally {
      setIsLoading(false);
    }
  };

  const filterOptions = [
    {
      value: 'all' as const,
      label: 'All Attendees',
      description: 'Send to everyone',
      icon: Users,
    },
    {
      value: 'yes' as const,
      label: 'Going Only',
      description: 'Send only to those who RSVPd yes',
      icon: CheckCircle,
    },
    {
      value: 'maybe' as const,
      label: 'Maybe Only',
      description: 'Send only to those who RSVPd maybe',
      icon: Clock,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="bg-opacity-75 fixed inset-0 bg-gray-900 transition-opacity" onClick={onClose} />

        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          {/*Modal*/}
          <div className="overflow-y-auto bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <MessageSquare className="mr-2 h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-medium text-gray-900">Send Text Blast</h3>
              </div>
              <button onClick={onClose} className="rounded-md text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Send to</label>
                <div className="space-y-2">
                  {filterOptions.map((option) => {
                    const Icon = option.icon;
                    const count =
                      option.value === 'all'
                        ? event.memberships.length
                        : event.memberships.filter((m) => m.rsvpStatus === option.value.toUpperCase()).length;

                    return (
                      <label
                        key={option.value}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                          filter === option.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="filter"
                            value={option.value}
                            checked={filter === option.value}
                            onChange={(e) => setFilter(e.target.value as 'all' | 'yes' | 'maybe')}
                            className="mr-3"
                          />
                          <Icon className="mr-2 h-4 w-4 text-gray-600" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{option.label}</div>
                            <div className="text-xs text-gray-500">{option.description}</div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">{count}</div>
                      </label>
                    );
                  })}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Recipients: <span className="font-medium">{getRecipientDescription()}</span>
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                  Message
                </label>
                <div className="mt-1">
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      setError('');
                    }}
                    placeholder="Enter your message here..."
                    rows={4}
                    maxLength={160}
                    className="block w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    disabled={isLoading}
                  />
                  <div className="mt-1 flex justify-between text-xs text-gray-500">
                    <span>160 character limit</span>
                    <span className={message.length > 160 ? 'text-red-600' : ''}>{message.length}/160</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="rounded-md bg-gray-50 p-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <MessageSquare className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="ml-3 text-xs text-gray-600">
                    <p>This message will be sent via SMS to all selected attendees.</p>
                    <p className="mt-1">Standard messaging rates may apply.</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="submit"
                  disabled={isLoading || getRecipientCount() === 0}
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Sending...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Send className="mr-2 h-4 w-4" />
                      Send to {getRecipientCount()} {getRecipientCount() === 1 ? 'person' : 'people'}
                    </div>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
