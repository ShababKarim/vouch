'use client';

import { useState, useEffect } from 'react';
import { Outcome } from '@/lib/types';
import OutcomeCard from './OutcomeCard';
import CreateOutcomeModal from './CreateOutcomeModal';
import { Plus, TrendingUp } from 'lucide-react';

interface OutcomeListProps {
  eventId: string;
  eventStatus: string;
  userMembership?: {
    role: string;
  };
}

export default function OutcomeList({ eventId, eventStatus, userMembership }: OutcomeListProps) {
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const canCreateOutcome = eventStatus === 'UPCOMING' && userMembership;

  useEffect(() => {
    fetchOutcomes();
  }, [eventId]);

  const fetchOutcomes = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/outcomes`);
      if (!response.ok) {
        throw new Error('Failed to fetch outcomes');
      }
      const data = await response.json();
      setOutcomes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load outcomes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOutcome = async (question: string, options: string[]) => {
    try {
      const response = await fetch(`/api/events/${eventId}/outcomes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, options }),
      });

      if (!response.ok) {
        throw new Error('Failed to create outcome');
      }

      await fetchOutcomes();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create outcome');
    }
  };

  const handlePlaceBet = async (outcomeId: string, optionId: string, amount: number) => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/outcomes/${outcomeId}/bets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId, amount }),
      });

      if (!response.ok) {
        throw new Error('Failed to place bet');
      }

      await fetchOutcomes();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to place bet');
    } finally {
      setIsRefreshing(false);
    }
  };

  const totalPool = outcomes.reduce((sum, outcome) => 
    sum + outcome.options.reduce((optionSum, option) => optionSum + option.totalAmount, 0), 0
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200"></div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-lg bg-gray-200"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center">
        <div className="text-red-600">{error}</div>
        <button
          onClick={fetchOutcomes}
          className="mt-2 text-blue-600 hover:text-blue-700"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Betting Markets</h2>
          {outcomes.length > 0 && (
            <div className="mt-1 flex items-center text-sm text-gray-500">
              <TrendingUp className="mr-1 h-4 w-4" />
              ${totalPool.toFixed(2)} total pool across {outcomes.length} market{outcomes.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        
        {canCreateOutcome && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="mr-1 h-4 w-4" />
            Create Market
          </button>
        )}
      </div>

      {outcomes.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <TrendingUp className="h-full w-full" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No betting markets yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            {canCreateOutcome 
              ? "Create the first betting market for this event"
              : "No markets have been created for this event yet"
            }
          </p>
          {canCreateOutcome && (
            <div className="mt-6">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Plus className="mr-1 h-4 w-4" />
                Create Market
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {outcomes.map((outcome) => (
            <OutcomeCard
              key={outcome.id}
              outcome={outcome}
              eventStatus={eventStatus}
              onPlaceBet={handlePlaceBet}
            />
          ))}
        </div>
      )}

      <CreateOutcomeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateOutcome={handleCreateOutcome}
      />

      {isRefreshing && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-25 flex items-center justify-center">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-700">Updating...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
