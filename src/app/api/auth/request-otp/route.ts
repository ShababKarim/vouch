import { NextRequest, NextResponse } from 'next/server';
import { createSmsService } from '@/services/sms';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const { phone } = await request.json();

        if (!phone) {
            return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
        }

        // Find or create user
        let user = await prisma.user.findUnique({
            where: { phone },
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    phone,
                    displayName: phone, // Temporary display name
                },
            });
        }

        // Send OTP
        const smsService = createSmsService();
        await smsService.sendOtp(phone);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error requesting OTP:', error);
        return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
    }
}
