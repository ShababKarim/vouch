import { calculatePayouts, BetWithUser } from './pari-mutuel';

describe('calculatePayouts', () => {
    it('should handle empty bets array', () => {
        const result = calculatePayouts([], 'option1');
        expect(result).toEqual([]);
    });

    it('should calculate payouts correctly with standard scenario', () => {
        const bets: BetWithUser[] = [
            { userId: 'user1', optionId: 'yes', amount: 10 },
            { userId: 'user2', optionId: 'yes', amount: 20 },
            { userId: 'user3', optionId: 'no', amount: 15 },
        ];

        const result = calculatePayouts(bets, 'yes');

        const user1Result = result.find((r) => r.userId === 'user1');
        const user2Result = result.find((r) => r.userId === 'user2');
        const user3Result = result.find((r) => r.userId === 'user3');

        expect(user1Result?.payout).toBeCloseTo(14.84, 2);
        expect(user1Result?.netGain).toBeCloseTo(4.84, 2);
        expect(user2Result?.payout).toBeCloseTo(29.69, 2);
        expect(user2Result?.netGain).toBeCloseTo(9.69, 2);
        expect(user3Result?.payout).toBe(0);
        expect(user3Result?.netGain).toBe(-15);
    });

    it('should refund all bets if no bets on winning option', () => {
        const bets: BetWithUser[] = [
            { userId: 'user1', optionId: 'yes', amount: 10 },
            { userId: 'user2', optionId: 'yes', amount: 20 },
        ];

        const result = calculatePayouts(bets, 'no');

        expect(result).toEqual([
            { userId: 'user1', betAmount: 10, payout: 10, netGain: 0 },
            { userId: 'user2', betAmount: 20, payout: 20, netGain: 0 },
        ]);
    });

    it('should handle single bettor scenario', () => {
        const bets: BetWithUser[] = [{ userId: 'user1', optionId: 'yes', amount: 50 }];

        const result = calculatePayouts(bets, 'yes');

        expect(result).toEqual([{ userId: 'user1', betAmount: 50, payout: 49.5, netGain: -0.5 }]);
    });

    it('should handle custom rake percentage', () => {
        const bets: BetWithUser[] = [
            { userId: 'user1', optionId: 'yes', amount: 100 },
            { userId: 'user2', optionId: 'no', amount: 100 },
        ];

        const result = calculatePayouts(bets, 'yes', 0.05);

        const user1Result = result.find((r) => r.userId === 'user1');
        expect(user1Result?.payout).toBeCloseTo(190, 2);
        expect(user1Result?.netGain).toBeCloseTo(90, 2);
    });

    it('should handle multiple winners correctly', () => {
        const bets: BetWithUser[] = [
            { userId: 'user1', optionId: 'yes', amount: 30 },
            { userId: 'user2', optionId: 'yes', amount: 30 },
            { userId: 'user3', optionId: 'no', amount: 40 },
        ];

        const result = calculatePayouts(bets, 'yes');

        const user1Result = result.find((r) => r.userId === 'user1');
        const user2Result = result.find((r) => r.userId === 'user2');
        const user3Result = result.find((r) => r.userId === 'user3');

        expect(user1Result?.payout).toBeCloseTo(49.5, 2);
        expect(user2Result?.payout).toBeCloseTo(49.5, 2);
        expect(user3Result?.payout).toBe(0);
    });

    it('should handle payouts with decimal amounts greater than 2', () => {
        const bets: BetWithUser[] = [
            { userId: 'user1', optionId: 'yes', amount: 10 },
            { userId: 'user2', optionId: 'yes', amount: 20 },
            { userId: 'user3', optionId: 'no', amount: 15 },
            { userId: 'user4', optionId: 'no', amount: 5 },
        ];

        const result = calculatePayouts(bets, 'no');

        const user1Result = result.find((r) => r.userId === 'user1');
        const user2Result = result.find((r) => r.userId === 'user2');
        const user3Result = result.find((r) => r.userId === 'user3');
        const user4Result = result.find((r) => r.userId === 'user4');

        expect(user1Result?.payout).toBeCloseTo(0);
        expect(user2Result?.payout).toBeCloseTo(0);
        expect(user3Result?.payout).toBeCloseTo(37.12, 2);
        expect(user4Result?.payout).toBeCloseTo(12.37, 2);
    });
});
