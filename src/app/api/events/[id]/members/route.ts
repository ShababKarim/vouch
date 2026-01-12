import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createSmsService } from '@/services/sms';
import { env } from '@/lib/env';
import { checkEventRole, checkEventMembership } from '@/lib/event';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await requireAuth(request);
        const { id: eventId } = await params;

        const isMember = await checkEventMembership(session.userId, eventId);

        if (!isMember) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const members = await prisma.eventMembership.findMany({
            where: { eventId },
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
        });

        return NextResponse.json({ members });
    } catch (error) {
        console.error('Error fetching members:', error);

        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
    }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await requireAuth(request);
        const { id: eventId } = await params;
        const { phone } = await request.json();

        if (!phone) {
            return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
        }

        const hasPermission = await checkEventRole(session.userId, eventId, ['HOST', 'COHOST']);

        if (!hasPermission) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        let user = await prisma.user.findUnique({
            where: { phone },
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    phone,
                    displayName: phone,
                },
            });
        }

        const existingMembership = await prisma.eventMembership.findUnique({
            where: {
                userId_eventId: {
                    userId: user.id,
                    eventId,
                },
            },
        });

        if (existingMembership) {
            return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
        }

        const membership = await prisma.eventMembership.create({
            data: {
                userId: user.id,
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
                        phone: true,
                    },
                },
            },
        });

        if (env.APP_ENV !== 'local') {
            const smsService = createSmsService();
            const event = await prisma.event.findUnique({
                where: { id: eventId },
                select: { title: true, inviteCode: true },
            });

            if (event) {
                const inviteUrl = `${env.NEXT_PUBLIC_APP_URL}/invite/${event.inviteCode}`;
                const message = `You're invited to ${event.title}! View details and RSVP: ${inviteUrl}`;
                await smsService.sendSms(phone, message);
            }
        }

        return NextResponse.json({ membership });
    } catch (error) {
        console.error('Error adding member:', error);

        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });
    }
}
