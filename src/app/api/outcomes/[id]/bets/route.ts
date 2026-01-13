import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { checkAndUpdateStatus } from '@/lib/event-status';

const placeBetSchema = z.object({
  optionId: z.string(),
  amount: z.number().positive(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(request);
    const { id: outcomeId } = await params;

    const outcome = await prisma.outcome.findUnique({
      where: { id: outcomeId },
      include: {
        event: {
          include: {
            memberships: {
              where: { userId: session.userId },
            },
          },
        },
      },
    });

    if (!outcome) {
      return NextResponse.json({ error: 'Outcome not found' }, { status: 404 });
    }

    if (outcome.event.memberships.length === 0) {
      return NextResponse.json({ error: 'Not a member of this event' }, { status: 403 });
    }

    const bets = await prisma.bet.findMany({
      where: {
        option: {
          outcomeId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            photoUrl: true,
          },
        },
        option: {
          select: {
            id: true,
            label: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(bets);
  } catch (error) {
    console.error('Error fetching bets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(request);
    const { id: outcomeId } = await params;

    const outcome = await prisma.outcome.findUnique({
      where: { id: outcomeId },
      include: {
        event: true,
        options: true,
      },
    });

    if (!outcome) {
      return NextResponse.json({ error: 'Outcome not found' }, { status: 404 });
    }

    const membership = await prisma.eventMembership.findUnique({
      where: {
        userId_eventId: {
          userId: session.userId,
          eventId: outcome.eventId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this event' }, { status: 403 });
    }

    await checkAndUpdateStatus(outcome.eventId);

    if (outcome.event.status !== 'UPCOMING') {
      return NextResponse.json({ error: 'Betting is not allowed after event starts' }, { status: 400 });
    }

    if (outcome.status !== 'OPEN') {
      return NextResponse.json({ error: 'Outcome is not accepting bets' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = placeBetSchema.parse(body);

    const isValidOption = outcome.options.some((option) => option.id === validatedData.optionId);

    if (!isValidOption) {
      return NextResponse.json({ error: 'Invalid option for this outcome' }, { status: 400 });
    }

    const existingBet = await prisma.bet.findUnique({
      where: {
        userId_optionId: {
          userId: session.userId,
          optionId: validatedData.optionId,
        },
      },
    });

    let bet;

    if (existingBet) {
      bet = await prisma.bet.update({
        where: { id: existingBet.id },
        data: { amount: validatedData.amount },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              photoUrl: true,
            },
          },
          option: {
            select: {
              id: true,
              label: true,
            },
          },
        },
      });
    } else {
      await prisma.bet.deleteMany({
        where: {
          userId: session.userId,
          option: {
            outcomeId,
          },
        },
      });

      bet = await prisma.bet.create({
        data: {
          userId: session.userId,
          optionId: validatedData.optionId,
          amount: validatedData.amount,
        },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              photoUrl: true,
            },
          },
          option: {
            select: {
              id: true,
              label: true,
            },
          },
        },
      });
    }

    return NextResponse.json(bet, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }

    console.error('Error placing bet:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
