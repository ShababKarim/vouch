import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code: inviteCode } = await params;

    const event = await prisma.event.findUnique({
      where: { inviteCode },
      include: {
        memberships: {
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
        _count: {
          select: {
            memberships: true,
            outcomes: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const publicEventData = {
      id: event.id,
      title: event.title,
      datetime: event.datetime,
      location: event.location,
      description: event.description,
      coverImage: event.coverImage,
      isPublic: event.isPublic,
      status: event.status,
      createdAt: event.createdAt,
      memberCount: event._count.memberships,
      outcomeCount: event._count.outcomes,
    };

    return NextResponse.json({ event: publicEventData });
  } catch (error) {
    console.error('Error fetching event by invite code:', error);
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
  }
}
