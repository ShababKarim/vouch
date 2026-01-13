import { PayoutResult } from './pari-mutuel';
import { floorToTwoDecimals } from './utils';

export interface Settlement {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

export function generateSettlements(payouts: PayoutResult[]): Settlement[] {
  const balances: { [userId: string]: number } = {};

  for (const payout of payouts) {
    balances[payout.userId] = (balances[payout.userId] || 0) + payout.netGain;
  }

  const debtors: Array<{ userId: string; amount: number }> = [];
  const creditors: Array<{ userId: string; amount: number }> = [];

  for (const [userId, balance] of Object.entries(balances)) {
    if (balance < 0) {
      debtors.push({ userId, amount: Math.abs(balance) });
    } else if (balance > 0) {
      creditors.push({ userId, amount: balance });
    }
  }

  const settlements: Settlement[] = [];

  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];

    const settlementAmount = Math.min(debtor.amount, creditor.amount);

    settlements.push({
      fromUserId: debtor.userId,
      toUserId: creditor.userId,
      amount: settlementAmount,
    });

    debtor.amount = floorToTwoDecimals(debtor.amount - settlementAmount);
    creditor.amount = floorToTwoDecimals(creditor.amount - settlementAmount);

    if (debtor.amount === 0) {
      debtorIndex++;
    }
    if (creditor.amount === 0) {
      creditorIndex++;
    }
  }

  return settlements;
}
