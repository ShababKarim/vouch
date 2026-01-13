import { CheckCircle } from 'lucide-react';
import { Settlement } from '@/lib/types';
import SettlementCard from '@/components/settlements/SettlementCard';

export default function SettlementsTab({
  settlements,
  handleSettleSettlement,
}: {
  settlements: Settlement[];
  handleSettleSettlement: (settlementId: string) => void;
}) {
  return (
    <div>
      <h2 className="mb-4 text-lg font-medium text-gray-900">Settlements</h2>
      {settlements.length === 0 ? (
        <div className="py-8 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No settlements yet</h3>
          <p className="mt-1 text-sm text-gray-500">Settlements will appear here after betting is completed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {settlements.map((settlement) => (
            <SettlementCard
              key={settlement.id}
              settlement={settlement}
              onSettle={handleSettleSettlement}
            />
          ))}
        </div>
      )}
    </div>
  );
}
