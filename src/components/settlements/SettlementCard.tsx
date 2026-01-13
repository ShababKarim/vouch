import { CheckCircle, Users } from 'lucide-react';
import { Settlement } from '@/lib/types';

interface SettlementCardProps {
  settlement: Settlement;
  onSettle?: (settlementId: string) => void;
}

export default function SettlementCard({ settlement, onSettle }: SettlementCardProps) {
  const handleSettleClick = () => {
    if (onSettle) {
      onSettle(settlement.id);
    }
  };

  return (
    <div className="rounded-lg border bg-gray-50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            {settlement.debtor.photoUrl ? (
              <img
                src={settlement.debtor.photoUrl}
                alt={settlement.debtor.displayName}
                className="mr-3 h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                <Users className="h-4 w-4 text-gray-400" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">{settlement.debtor.displayName}</p>
              <p className="text-xs text-gray-500">owes</p>
            </div>
          </div>

          <div className="text-center">
            <p className={`text-lg font-bold ${settlement.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${Math.abs(settlement.amount).toFixed(2)}
            </p>
          </div>

          <div className="flex items-center">
            <div className="mr-3 text-right">
              <p className="text-sm font-medium text-gray-900">{settlement.creditor.displayName}</p>
              <p className="text-xs text-gray-500">is owed</p>
            </div>
            {settlement.creditor.photoUrl ? (
              <img
                src={settlement.creditor.photoUrl}
                alt={settlement.creditor.displayName}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                <Users className="h-4 w-4 text-gray-400" />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
              settlement.isSettled ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {settlement.isSettled ? 'Settled' : 'Pending'}
          </span>

          {!settlement.isSettled && onSettle && (
            <button
              onClick={handleSettleClick}
              className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700"
            >
              Mark as Settled
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
