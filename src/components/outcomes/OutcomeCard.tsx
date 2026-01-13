'use client';

import { useState } from 'react';
import { Outcome, Option } from '@/lib/types';
import { DollarSign, TrendingUp, User, Clock, CheckCircle } from 'lucide-react';

interface OutcomeCardProps {
  outcome: Outcome;
  eventStatus: string;
  onPlaceBet: (outcomeId: string, optionId: string, amount: number) => Promise<void>;
}

export default function OutcomeCard({ outcome, eventStatus, onPlaceBet }: OutcomeCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState('');
  const [isPlacingBet, setIsPlacingBet] = useState(false);

  const totalPool = outcome.options.reduce((sum, option) => sum + option.totalAmount, 0);
  const isBettingLocked = eventStatus !== 'UPCOMING' || outcome.status !== 'OPEN';

  const calculateOdds = (option: Option) => {
    if (totalPool === 0 || option.totalAmount === 0) return '∞';
    const impliedProbability = option.totalAmount / totalPool;
    const decimalOdds = 1 / impliedProbability;
    return decimalOdds.toFixed(2);
  };

  const handlePlaceBet = async () => {
    if (!selectedOption || !betAmount || isBettingLocked) return;

    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) return;

    setIsPlacingBet(true);
    try {
      await onPlaceBet(outcome.id, selectedOption, amount);
      setBetAmount('');
      setSelectedOption(null);
    } catch (error) {
      console.error('Failed to place bet:', error);
    } finally {
      setIsPlacingBet(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-green-100 text-green-800';
      case 'LOCKED':
        return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED':
        return 'bg-blue-100 text-blue-800';
      case 'REFUNDED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900">{outcome.question}</h3>
          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <User className="mr-1 h-4 w-4" />
              {outcome.creator.displayName}
            </div>
            <div className="flex items-center">
              <Clock className="mr-1 h-4 w-4" />
              {new Date(outcome.createdAt).toLocaleDateString()}
            </div>
            <div className="flex items-center">
              <DollarSign className="mr-1 h-4 w-4" />${totalPool.toFixed(2)} pool
            </div>
          </div>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(outcome.status)}`}
        >
          {outcome.status.toLowerCase()}
        </span>
      </div>

      {outcome.status === 'RESOLVED' && outcome.winningOptionId && (
        <div className="mb-4 rounded-md bg-green-50 p-3">
          <div className="flex items-center text-sm text-green-800">
            <CheckCircle className="mr-2 h-4 w-4" />
            Winner: {outcome.options.find((opt) => opt.id === outcome.winningOptionId)?.label}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {outcome.options.map((option) => (
          <div
            key={option.id}
            className={`rounded-lg border p-4 transition-colors ${
              selectedOption === option.id
                ? 'border-blue-500 bg-blue-50'
                : isBettingLocked
                  ? 'border-gray-200 bg-gray-50'
                  : 'cursor-pointer border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => !isBettingLocked && setSelectedOption(option.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">{option.label}</h4>
                  {option.totalAmount > 0 && (
                    <div className="flex items-center text-sm text-gray-500">
                      <TrendingUp className="mr-1 h-4 w-4" />
                      {calculateOdds(option)}x
                    </div>
                  )}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  ${option.totalAmount.toFixed(2)} from {option.betCount} bet{option.betCount !== 1 ? 's' : ''}
                  {option.userBet && (
                    <span className="ml-2 font-medium text-blue-600">
                      Your bet: ${option.userBet.amount.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
              {!isBettingLocked && (
                <div className="ml-4">
                  <input
                    type="radio"
                    checked={selectedOption === option.id}
                    onChange={() => setSelectedOption(option.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {!isBettingLocked && selectedOption && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Bet Amount ($)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                placeholder="0.00"
                className="mt-1 block w-full rounded-md border-gray-300 px-1 py-1 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <button
              onClick={handlePlaceBet}
              disabled={!betAmount || parseFloat(betAmount) <= 0 || isPlacingBet}
              className="mt-6 inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPlacingBet ? 'Placing...' : 'Place Bet'}
            </button>
          </div>
        </div>
      )}

      {isBettingLocked && (
        <div className="mt-4 text-center text-sm text-gray-500">
          {eventStatus !== 'UPCOMING'
            ? 'Betting is locked after event starts'
            : 'This outcome is no longer accepting bets'}
        </div>
      )}
    </div>
  );
}
