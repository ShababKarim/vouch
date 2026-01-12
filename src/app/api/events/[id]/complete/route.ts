import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { completeEvent, checkAndUpdateStatus } from '@/lib/event-status';
import { checkEventRole } from '@/lib/event';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await requireAuth(request);
        const { id: eventId } = await params;

        const hasPermission = await checkEventRole(session.userId, eventId, ['HOST', 'COHOST']);

        if (!hasPermission) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        await completeEvent(eventId);
        const updatedStatus = await checkAndUpdateStatus(eventId);

        return NextResponse.json({
            success: true,
            status: updatedStatus,
        });
    } catch (error) {
        console.error('Error completing event:', error);

        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        if (error instanceof Error && error.message === 'Event not found') {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        if (error instanceof Error && error.message === 'Only active events can be completed') {
            return NextResponse.json({ error: 'Only active events can be completed' }, { status: 400 });
        }

        return NextResponse.json({ error: 'Failed to complete event' }, { status: 500 });
    }
}
