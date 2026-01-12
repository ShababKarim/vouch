import { CheckCircle, Users } from 'lucide-react';
import { Settlement } from '@/lib/types';

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
                    <p className="mt-1 text-sm text-gray-500">
                        Settlements will appear here after betting is completed.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {settlements.map((settlement) => (
                        <div key={settlement.id} className="rounded-lg border bg-gray-50 p-4">
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
                                            <p className="text-sm font-medium text-gray-900">
                                                {settlement.debtor.displayName}
                                            </p>
                                            <p className="text-xs text-gray-500">owes</p>
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <p
                                            className={`text-lg font-bold ${
                                                settlement.amount > 0 ? 'text-green-600' : 'text-red-600'
                                            }`}
                                        >
                                            ${Math.abs(settlement.amount).toFixed(2)}
                                        </p>
                                    </div>

                                    <div className="flex items-center">
                                        <div className="mr-3 text-right">
                                            <p className="text-sm font-medium text-gray-900">
                                                {settlement.creditor.displayName}
                                            </p>
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
                                            settlement.isSettled
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                        }`}
                                    >
                                        {settlement.isSettled ? 'Settled' : 'Pending'}
                                    </span>

                                    {!settlement.isSettled && (
                                        <button
                                            onClick={() => handleSettleSettlement(settlement.id)}
                                            className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                                        >
                                            Mark as Settled
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
