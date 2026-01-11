import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkEventMembership } from '@/lib/event'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(request)
    const { id: eventId } = await params
    const { rsvpStatus } = await request.json()

    if (!['YES', 'NO', 'MAYBE'].includes(rsvpStatus)) {
      return NextResponse.json(
        { error: 'Invalid RSVP status' },
        { status: 400 }
      )
    }

    const isMember = await checkEventMembership(session.userId, eventId)
    
    if (!isMember) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const membership = await prisma.eventMembership.update({
      where: {
        userId_eventId: {
          userId: session.userId,
          eventId
        }
      },
      data: { rsvpStatus },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            photoUrl: true
          }
        }
      }
    })

    return NextResponse.json({ membership })
  } catch (error) {
    console.error('Error updating RSVP:', error)
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update RSVP' },
      { status: 500 }
    )
  }
}
