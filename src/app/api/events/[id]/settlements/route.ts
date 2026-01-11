import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request)
    const { id: eventId } = await params

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        memberships: {
          where: { userId: session.userId }
        }
      }
    })

    if (!event || event.memberships.length === 0) {
      return NextResponse.json(
        { error: 'Event not found or access denied' },
        { status: 404 }
      )
    }

    const settlements = await prisma.settlement.findMany({
      where: { eventId },
      include: {
        fromUser: {
          select: { id: true, displayName: true, photoUrl: true }
        },
        toUser: {
          select: { id: true, displayName: true, photoUrl: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(settlements)
  } catch (error) {
    console.error('Failed to fetch settlements:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
