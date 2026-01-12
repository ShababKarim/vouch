import { prisma } from './prisma';
import { EventStatus } from '@prisma/client';

export async function checkAndUpdateStatus(eventId: string): Promise<EventStatus> {
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
            outcomes: {
                select: {
                    status: true,
                },
            },
        },
    });

    if (!event) {
        throw new Error('Event not found');
    }

    let newStatus = event.status;

    if (event.status === 'UPCOMING' && new Date() > event.datetime) {
        newStatus = 'ACTIVE';

        await prisma.outcome.updateMany({
            where: {
                eventId,
                status: 'OPEN',
            },
            data: {
                status: 'LOCKED',
            },
        });
    }

    if (event.status === 'ACTIVE' || event.status === 'COMPLETED') {
        const allOutcomesResolved = event.outcomes.every(
            (outcome) => outcome.status === 'RESOLVED' || outcome.status === 'REFUNDED'
        );

        if (allOutcomesResolved && event.outcomes.length > 0) {
            newStatus = 'RESOLVED';
        }
    }

    if (newStatus !== event.status) {
        await prisma.event.update({
            where: { id: eventId },
            data: { status: newStatus },
        });
    }

    return newStatus;
}

export async function completeEvent(eventId: string): Promise<void> {
    const event = await prisma.event.findUnique({
        where: { id: eventId },
    });

    if (!event) {
        throw new Error('Event not found');
    }

    if (event.status !== 'ACTIVE') {
        throw new Error('Only active events can be completed');
    }

    await prisma.event.update({
        where: { id: eventId },
        data: { status: 'COMPLETED' },
    });
}
