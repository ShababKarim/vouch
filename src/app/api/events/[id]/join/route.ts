import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(request);
    const { id: eventId } = await params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (!event.isPublic) {
      return NextResponse.json({ error: 'Event is not public' }, { status: 403 });
    }

    if (event.status !== 'UPCOMING') {
      return NextResponse.json({ error: 'Event is not accepting new members' }, { status: 400 });
    }

    const existingMembership = await prisma.eventMembership.findUnique({
      where: {
        userId_eventId: {
          userId: session.userId,
          eventId,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json({ error: 'Already a member of this event' }, { status: 400 });
    }

    const membership = await prisma.eventMembership.create({
      data: {
        userId: session.userId,
        eventId,
        role: 'ATTENDEE',
        rsvpStatus: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            photoUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ membership });
  } catch (error) {
    console.error('Error joining event:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Failed to join event' }, { status: 500 });
  }
}
