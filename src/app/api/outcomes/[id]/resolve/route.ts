import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { checkAndUpdateStatus } from '@/lib/event-status';
import { calculatePayouts } from '@/services/betting/pari-mutuel';
import { generateSettlements } from '@/services/betting/settlement';

const resolveOutcomeSchema = z.object({
  winningOptionId: z.string(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(request);
    const { id: outcomeId } = await params;

    const outcome = await prisma.outcome.findUnique({
      where: { id: outcomeId },
      include: {
        event: {
          include: {
            memberships: {
              where: {
                userId: session.userId,
                role: {
                  in: ['HOST', 'COHOST'],
                },
              },
            },
          },
        },
        options: {
          include: {
            bets: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!outcome) {
      return NextResponse.json({ error: 'Outcome not found' }, { status: 404 });
    }

    if (outcome.event.memberships.length === 0) {
      return NextResponse.json({ error: 'Only hosts or co-hosts can resolve outcomes' }, { status: 403 });
    }

    await checkAndUpdateStatus(outcome.eventId);

    if (outcome.status !== 'LOCKED') {
      return NextResponse.json({ error: 'Only locked outcomes can be resolved' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = resolveOutcomeSchema.parse(body);

    const isValidOption = outcome.options.some((option) => option.id === validatedData.winningOptionId);

    if (!isValidOption) {
      return NextResponse.json({ error: 'Invalid winning option' }, { status: 400 });
    }

    const allBets = outcome.options.flatMap((option) =>
      option.bets.map((bet) => ({
        userId: bet.userId,
        optionId: bet.optionId,
        amount: Number(bet.amount),
      }))
    );

    const payouts = calculatePayouts(allBets, validatedData.winningOptionId);
    const settlements = generateSettlements(payouts);

    await prisma.$transaction(async (tx) => {
      await tx.outcome.update({
        where: { id: outcomeId },
        data: {
          status: 'RESOLVED',
          winningOptionId: validatedData.winningOptionId,
        },
      });

      for (const settlement of settlements) {
        await tx.settlement.create({
          data: {
            eventId: outcome.eventId,
            fromUserId: settlement.fromUserId,
            toUserId: settlement.toUserId,
            amount: settlement.amount,
          },
        });
      }
    });

    const updatedOutcome = await prisma.outcome.findUnique({
      where: { id: outcomeId },
      include: {
        options: {
          include: {
            bets: {
              include: {
                user: {
                  select: {
                    id: true,
                    displayName: true,
                    photoUrl: true,
                  },
                },
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            displayName: true,
            photoUrl: true,
          },
        },
      },
    });

    await checkAndUpdateStatus(outcome.eventId);

    return NextResponse.json({
      outcome: updatedOutcome,
      payouts,
      settlements,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }

    console.error('Error resolving outcome:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
