import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { checkAndUpdateStatus } from '@/lib/event-status'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request)
    const { id: betId } = await params

    const bet = await prisma.bet.findUnique({
      where: { id: betId },
      include: {
        option: {
          include: {
            outcome: {
              include: {
                event: true
              }
            }
          }
        }
      }
    })

    if (!bet) {
      return NextResponse.json(
        { error: 'Bet not found' },
        { status: 404 }
      )
    }

    if (bet.userId !== session.userId) {
      return NextResponse.json(
        { error: 'Can only delete your own bets' },
        { status: 403 }
      )
    }

    await checkAndUpdateStatus(bet.option.outcome.eventId)

    if (bet.option.outcome.event.status !== 'UPCOMING') {
      return NextResponse.json(
        { error: 'Cannot delete bets after event starts' },
        { status: 400 }
      )
    }

    await prisma.bet.delete({
      where: { id: betId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting bet:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
