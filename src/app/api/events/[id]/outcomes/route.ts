import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { checkAndUpdateStatus } from '@/lib/event-status';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(request);
    const { id: eventId } = await params;

    const membership = await prisma.eventMembership.findUnique({
      where: {
        userId_eventId: {
          userId: session.userId,
          eventId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this event' }, { status: 403 });
    }

    await checkAndUpdateStatus(eventId);

    const outcomes = await prisma.outcome.findMany({
      where: { eventId },
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
      orderBy: { createdAt: 'asc' },
    });

    const outcomesWithTotals = outcomes.map((outcome) => {
      const optionsWithTotals = outcome.options.map((option) => {
        const totalAmount = option.bets.reduce((sum, bet) => sum + Number(bet.amount), 0);
        const userBet = option.bets.find((bet) => bet.userId === session.userId);

        return {
          id: option.id,
          label: option.label,
          createdAt: option.createdAt,
          totalAmount,
          userBet: userBet
            ? {
                id: userBet.id,
                amount: Number(userBet.amount),
                createdAt: userBet.createdAt,
              }
            : null,
          betCount: option.bets.length,
        };
      });

      return {
        id: outcome.id,
        question: outcome.question,
        status: outcome.status,
        winningOptionId: outcome.winningOptionId,
        createdAt: outcome.createdAt,
        updatedAt: outcome.updatedAt,
        creator: outcome.creator,
        options: optionsWithTotals,
      };
    });

    return NextResponse.json(outcomesWithTotals);
  } catch (error) {
    console.error('Error fetching outcomes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const createOutcomeSchema = z.object({
  question: z.string().min(1).max(500),
  options: z.array(z.string().min(1).max(100)).min(2),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(request);
    const { id: eventId } = await params;

    const membership = await prisma.eventMembership.findUnique({
      where: {
        userId_eventId: {
          userId: session.userId,
          eventId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this event' }, { status: 403 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    await checkAndUpdateStatus(eventId);

    if (event.status !== 'UPCOMING') {
      return NextResponse.json({ error: 'Outcomes can only be created before event starts' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = createOutcomeSchema.parse(body);

    const outcome = await prisma.outcome.create({
      data: {
        eventId,
        creatorId: session.userId,
        question: validatedData.question,
        options: {
          create: validatedData.options.map((label) => ({ label })),
        },
      },
      include: {
        options: true,
        creator: {
          select: {
            id: true,
            displayName: true,
            photoUrl: true,
          },
        },
      },
    });

    return NextResponse.json(outcome, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }

    console.error('Error creating outcome:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
