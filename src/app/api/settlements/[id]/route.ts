import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await requireAuth(request);
        const { id: settlementId } = await params;

        const settlement = await prisma.settlement.findUnique({
            where: { id: settlementId },
        });

        if (!settlement) {
            return NextResponse.json({ error: 'Settlement not found' }, { status: 404 });
        }

        if (settlement.fromUserId !== session.userId && settlement.toUserId !== session.userId) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const updatedSettlement = await prisma.settlement.update({
            where: { id: settlementId },
            data: {
                isSettled: true,
                settledAt: new Date(),
            },
            include: {
                fromUser: {
                    select: { id: true, displayName: true, photoUrl: true },
                },
                toUser: {
                    select: { id: true, displayName: true, photoUrl: true },
                },
            },
        });

        return NextResponse.json(updatedSettlement);
    } catch (error) {
        console.error('Failed to update settlement:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
