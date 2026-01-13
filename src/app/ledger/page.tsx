'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuth } from '@/components/layout/AuthProvider';
import { ArrowUpRight, ArrowDownRight, Users, Calendar, DollarSign } from 'lucide-react';

interface LedgerEntry {
  user: {
    id: string;
    displayName: string;
    photoUrl: string | null;
  };
  netAmount: number;
  events: Array<{
    eventId: string;
    eventTitle: string;
    amount: number;
    isFromUser: boolean;
  }>;
}

export default function LedgerPage() {
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchLedger();
    }
  }, [user]);

  const fetchLedger = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/users/${user.id}/ledger`);
      if (!response.ok) {
        throw new Error('Failed to fetch ledger');
      }
      const data = await response.json();
      setLedger(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ledger');
    } finally {
      setIsLoading(false);
    }
  };

  const totalOwed = ledger
    .filter(entry => entry.netAmount < 0)
    .reduce((sum, entry) => sum + Math.abs(entry.netAmount), 0);

  const totalToReceive = ledger
    .filter(entry => entry.netAmount > 0)
    .reduce((sum, entry) => sum + entry.netAmount, 0);

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

  return (
    <ProtectedRoute requireProfile>
      <div className="min-h-screen bg-gray-50 pb-16">
        <Header />

        <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Your Ledger</h1>
            <p className="mt-1 text-sm text-gray-600">
              Cross-event view of all your settlements
            </p>
          </div>

          {/* Summary Cards */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-white p-6 shadow-sm border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowUpRight className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">You Owe</p>
                  <p className="text-2xl font-bold text-red-600">
                    ${totalOwed.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowDownRight className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">You're Owed</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${totalToReceive.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Ledger Entries */}
          {ledger.length === 0 ? (
            <div className="rounded-lg bg-white p-8 text-center shadow-sm border">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No settlements</h3>
              <p className="mt-1 text-sm text-gray-500">
                You don't have any outstanding settlements.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {ledger.map((entry) => (
                <div key={entry.user.id} className="rounded-lg bg-white p-6 shadow-sm border">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      {entry.user.photoUrl ? (
                        <img
                          src={entry.user.photoUrl}
                          alt={entry.user.displayName}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                          <Users className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {entry.user.displayName}
                        </h3>
                        <p className={`text-sm font-medium ${
                          entry.netAmount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {entry.netAmount > 0 ? 'owes you' : 'you owe'} ${Math.abs(entry.netAmount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Event Breakdown
                    </p>
                    {entry.events.map((event, index) => (
                      <div key={`${event.eventId}-${index}`} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-700">{event.eventTitle}</span>
                        </div>
                        <span className={`font-medium ${
                          event.isFromUser ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {event.isFromUser ? '-' : '+'}${event.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}
