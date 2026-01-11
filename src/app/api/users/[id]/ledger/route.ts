import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request)
    const { id: userId } = await params

    if (userId !== session.userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const unsettledSettlements = await prisma.settlement.findMany({
      where: {
        isSettled: false,
        OR: [
          { fromUserId: userId },
          { toUserId: userId }
        ]
      },
      include: {
        fromUser: {
          select: { id: true, displayName: true, photoUrl: true }
        },
        toUser: {
          select: { id: true, displayName: true, photoUrl: true }
        },
        event: {
          select: { id: true, title: true }
        }
      }
    })

    const ledger: { [counterpartyId: string]: {
      user: { id: string; displayName: string; photoUrl: string | null }
      netAmount: number
      events: Array<{ eventId: string; eventTitle: string; amount: number; isFromUser: boolean }>
    } } = {}

    for (const settlement of unsettledSettlements) {
      const counterparty = settlement.fromUserId === userId ? settlement.toUser : settlement.fromUser
      const isFromUser = settlement.fromUserId === userId
      const amount = Number(settlement.amount)
      const netAmount = isFromUser ? -amount : amount

      if (!ledger[counterparty.id]) {
        ledger[counterparty.id] = {
          user: counterparty,
          netAmount: 0,
          events: []
        }
      }

      ledger[counterparty.id].netAmount += netAmount
      ledger[counterparty.id].events.push({
        eventId: settlement.event.id,
        eventTitle: settlement.event.title,
        amount: amount,
        isFromUser
      })
    }

    const result = Object.values(ledger).filter(entry => entry.netAmount !== 0)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch ledger:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
