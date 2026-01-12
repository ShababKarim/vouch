import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkAndUpdateStatus } from '@/lib/event-status';
import { checkEventMembership, checkEventRole } from '@/lib/event';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await requireAuth(request);
        const { id: eventId } = await params;

        const isMember = await checkEventMembership(session.userId, eventId);

        if (!isMember) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        await checkAndUpdateStatus(eventId);

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                memberships: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                displayName: true,
                                photoUrl: true,
                                phone: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
                outcomes: {
                    include: {
                        options: {
                            include: {
                                _count: {
                                    select: {
                                        bets: true,
                                    },
                                },
                            },
                        },
                        creator: {
                            select: {
                                id: true,
                                displayName: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'asc',
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

        return NextResponse.json({ event });
    } catch (error) {
        console.error('Error fetching event:', error);

        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await requireAuth(request);
        const { id: eventId } = await params;
        const { title, datetime, location, description, coverImage, isPublic } = await request.json();

        const hasPermission = await checkEventRole(session.userId, eventId, ['HOST', 'COHOST']);

        if (!hasPermission) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (datetime !== undefined) updateData.datetime = new Date(datetime);
        if (location !== undefined) updateData.location = location;
        if (description !== undefined) updateData.description = description;
        if (coverImage !== undefined) updateData.coverImage = coverImage;
        if (isPublic !== undefined) updateData.isPublic = isPublic;

        const event = await prisma.event.update({
            where: { id: eventId },
            data: updateData,
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

        return NextResponse.json({ event });
    } catch (error) {
        console.error('Error updating event:', error);

        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await requireAuth(request);
        const { id: eventId } = await params;

        const isHost = await checkEventRole(session.userId, eventId, ['HOST']);

        if (!isHost) {
            return NextResponse.json({ error: 'Only hosts can delete events' }, { status: 403 });
        }

        await prisma.event.delete({
            where: { id: eventId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting event:', error);

        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }
}
