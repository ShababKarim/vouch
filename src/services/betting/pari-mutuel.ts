import { floorToTwoDecimals } from './utils'

export interface BetWithUser {
    userId: string;
    optionId: string;
    amount: number;
}

export interface PayoutResult {
    userId: string;
    betAmount: number;
    payout: number;
    netGain: number;
}

export function calculatePayouts(
    bets: BetWithUser[],
    winningOptionId: string,
    rakePercent: number = 0.01
): PayoutResult[] {
    if (bets.length === 0) {
        return [];
    }

    const totalPool = bets.reduce((sum, bet) => sum + bet.amount, 0);
    const rake = totalPool * rakePercent;
    const netPool = totalPool - rake;

    const winningBets = bets.filter(bet => bet.optionId === winningOptionId);
    const totalWinningBets = winningBets.reduce((sum, bet) => sum + bet.amount, 0);

    if (totalWinningBets === 0) {
        return bets.map(bet => ({
            userId: bet.userId,
            betAmount: bet.amount,
            payout: bet.amount,
            netGain: 0
        }));
    }

    const payoutResults: PayoutResult[] = [];

    for (const bet of winningBets) {
        const proportionOfWinningPool = netPool / totalWinningBets;
        const payout = floorToTwoDecimals(bet.amount * proportionOfWinningPool);
        const netGain = floorToTwoDecimals(payout - bet.amount);

        payoutResults.push({
            userId: bet.userId,
            betAmount: bet.amount,
            payout,
            netGain
        });
    }

    for (const bet of bets.filter(bet => bet.optionId !== winningOptionId)) {
        payoutResults.push({
            userId: bet.userId,
            betAmount: bet.amount,
            payout: 0,
            netGain: -bet.amount
        });
    }

    return payoutResults;
}
