import { generateSettlements } from './settlement';
import { PayoutResult } from './pari-mutuel';

// payout factors in 1% rake
describe('generateSettlements', () => {
    it('should handle empty payouts array', () => {
        const result = generateSettlements([]);
        expect(result).toEqual([]);
    });

    it('should handle single winner with no losers', () => {
        const payouts: PayoutResult[] = [{ userId: 'user1', betAmount: 10, payout: 9.9, netGain: -0.1 }];

        const result = generateSettlements(payouts);
        expect(result).toEqual([]);
    });

    it('should handle single loser with no winners', () => {
        const payouts: PayoutResult[] = [{ userId: 'user1', betAmount: 10, payout: 0, netGain: -10 }];

        const result = generateSettlements(payouts);
        expect(result).toEqual([]);
    });

    it('should handle simple one-to-one settlement', () => {
        const payouts: PayoutResult[] = [
            { userId: 'user1', betAmount: 10, payout: 0, netGain: -10 },
            { userId: 'user2', betAmount: 10, payout: 19.8, netGain: 9.8 },
        ];

        const result = generateSettlements(payouts);
        expect(result).toEqual([{ fromUserId: 'user1', toUserId: 'user2', amount: 9.8 }]);
    });

    it('should handle multiple debtors and creditors', () => {
        const payouts: PayoutResult[] = [
            { userId: 'user1', betAmount: 10, payout: 0, netGain: -10 },
            { userId: 'user2', betAmount: 20, payout: 0, netGain: -20 },
            { userId: 'user3', betAmount: 15, payout: 37.12, netGain: 22.12 },
            { userId: 'user4', betAmount: 5, payout: 12.37, netGain: 7.37 },
        ];

        const result = generateSettlements(payouts);

        expect(result).toHaveLength(3);
        expect(result).toEqual(
            expect.arrayContaining([
                { fromUserId: 'user1', toUserId: 'user3', amount: 10 },
                { fromUserId: 'user2', toUserId: 'user3', amount: 12.12 },
                { fromUserId: 'user2', toUserId: 'user4', amount: 7.37 },
            ])
        );
    });

    it('should handle partial settlements when amounts dont match exactly', () => {
        const payouts: PayoutResult[] = [
            { userId: 'user1', betAmount: 10, payout: 0, netGain: -10 },
            { userId: 'user2', betAmount: 5, payout: 0, netGain: -5 },
            { userId: 'user3', betAmount: 20, payout: 34.65, netGain: 14.65 },
        ];

        const result = generateSettlements(payouts);

        expect(result).toHaveLength(2);
        expect(result).toEqual(
            expect.arrayContaining([
                { fromUserId: 'user1', toUserId: 'user3', amount: 10 },
                { fromUserId: 'user2', toUserId: 'user3', amount: 4.65 },
            ])
        );
    });

    it('should handle zero net gains (no settlements needed)', () => {
        const payouts: PayoutResult[] = [
            { userId: 'user1', betAmount: 10, payout: 10, netGain: 0 },
            { userId: 'user2', betAmount: 15, payout: 15, netGain: 0 },
            { userId: 'user3', betAmount: 20, payout: 20, netGain: 0 },
        ];

        const result = generateSettlements(payouts);
        expect(result).toEqual([]);
    });

    it('should handle complex scenario with multiple winners and losers', () => {
        const payouts: PayoutResult[] = [
            { userId: 'alice', betAmount: 50, payout: 0, netGain: -50 },
            { userId: 'bob', betAmount: 30, payout: 0, netGain: -30 },
            { userId: 'charlie', betAmount: 20, payout: 0, netGain: -20 },
            { userId: 'diana', betAmount: 40, payout: 110.76, netGain: 70.76 },
            { userId: 'eve', betAmount: 25, payout: 69.23, netGain: 44.23 },
            { userId: 'frank', betAmount: 15, payout: 0, netGain: -15 },
        ];

        const result = generateSettlements(payouts);

        const totalFromDebtors = result.reduce((sum, s) => sum + s.amount, 0);
        const totalToCreditors = result.reduce((sum, s) => sum + s.amount, 0);

        expect(totalFromDebtors).toBe(114.99000000000001);
        expect(totalToCreditors).toBe(114.99000000000001);
        expect(result.length).toBeGreaterThan(0);

        result.forEach((settlement) => {
            expect(settlement.amount).toBeGreaterThan(0);
            expect(settlement.fromUserId).not.toBe(settlement.toUserId);
        });
    });

    it('should handle decimal amounts correctly', () => {
        const payouts: PayoutResult[] = [
            { userId: 'user1', betAmount: 10.5, payout: 0, netGain: -10.5 },
            { userId: 'user2', betAmount: 5.25, payout: 15.59, netGain: 10.34 },
        ];

        const result = generateSettlements(payouts);
        expect(result).toEqual([{ fromUserId: 'user1', toUserId: 'user2', amount: 10.34 }]);
    });

    it('should preserve settlement order consistency', () => {
        const payouts: PayoutResult[] = [
            { userId: 'user1', betAmount: 10, payout: 0, netGain: -10 },
            { userId: 'user2', betAmount: 20, payout: 44.55, netGain: 24.55 },
            { userId: 'user3', betAmount: 15, payout: 0, netGain: -15 },
        ];

        const result1 = generateSettlements(payouts);
        const result2 = generateSettlements(payouts);

        expect(result1).toEqual(result2);
    });

    it('should handle large numbers without precision issues', () => {
        const payouts: PayoutResult[] = [
            { userId: 'user1', betAmount: 10000, payout: 0, netGain: -10000 },
            { userId: 'user2', betAmount: 5000, payout: 14850, netGain: 9850 },
        ];

        const result = generateSettlements(payouts);
        expect(result).toEqual([{ fromUserId: 'user1', toUserId: 'user2', amount: 9850 }]);
    });
});
