import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkEventRole } from '@/lib/event';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; userId: string }> }) {
    try {
        const session = await requireAuth(request);
        const { id: eventId, userId: targetUserId } = await params;
        const { role } = await request.json();

        const hasPermission = await checkEventRole(session.userId, eventId, ['HOST', 'COHOST']);

        if (!hasPermission) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        if (session.userId === targetUserId) {
            return NextResponse.json({ error: 'Cannot modify your own role' }, { status: 400 });
        }

        if (!['ATTENDEE', 'COHOST'].includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        const targetMembership = await prisma.eventMembership.findUnique({
            where: {
                userId_eventId: {
                    userId: targetUserId,
                    eventId,
                },
            },
        });

        if (!targetMembership) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        if (targetMembership.role === 'HOST') {
            return NextResponse.json({ error: 'Cannot modify host role' }, { status: 400 });
        }

        const updatedMembership = await prisma.eventMembership.update({
            where: {
                userId_eventId: {
                    userId: targetUserId,
                    eventId,
                },
            },
            data: { role },
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

        return NextResponse.json({ membership: updatedMembership });
    } catch (error) {
        console.error('Error updating member role:', error);

        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        return NextResponse.json({ error: 'Failed to update member role' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; userId: string }> }) {
    try {
        const session = await requireAuth(request);
        const { id: eventId, userId: targetUserId } = await params;

        const hasPermission = await checkEventRole(session.userId, eventId, ['HOST', 'COHOST']);

        if (!hasPermission) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        if (session.userId === targetUserId) {
            return NextResponse.json({ error: 'Cannot remove yourself from event' }, { status: 400 });
        }

        const targetMembership = await prisma.eventMembership.findUnique({
            where: {
                userId_eventId: {
                    userId: targetUserId,
                    eventId,
                },
            },
        });

        if (!targetMembership) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        if (targetMembership.role === 'HOST') {
            return NextResponse.json({ error: 'Cannot remove host from event' }, { status: 400 });
        }

        await prisma.eventMembership.delete({
            where: {
                userId_eventId: {
                    userId: targetUserId,
                    eventId,
                },
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error removing member:', error);

        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
    }
}
