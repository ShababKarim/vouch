import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { checkAndUpdateStatus } from '@/lib/event-status'

const updateOutcomeSchema = z.object({
  question: z.string().min(1).max(500).optional(),
  options: z.array(z.string().min(1).max(100)).min(2).optional()
})

async function canModifyOutcome(session: { userId: string }, outcomeId: string) {
  const outcome = await prisma.outcome.findUnique({
    where: { id: outcomeId },
    include: {
      event: {
        include: {
          memberships: {
            where: {
              userId: session.userId,
              role: {
                in: ['HOST', 'COHOST']
              }
            }
          }
        }
      }
    }
  })

  if (!outcome) {
    return { allowed: false, error: 'Outcome not found', outcome: null }
  }

  const isCreator = outcome.creatorId === session.userId
  const isHostOrCohost = outcome.event.memberships.length > 0

  if (!isCreator && !isHostOrCohost) {
    return { allowed: false, error: 'Insufficient permissions', outcome }
  }

  return { allowed: true, error: null, outcome }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request)
    const { id: outcomeId } = await params

    const { allowed, error, outcome } = await canModifyOutcome(session, outcomeId)

    if (!allowed || !outcome) {
      return NextResponse.json(
        { error },
        { status: error === 'Outcome not found' ? 404 : 403 }
      )
    }

    await checkAndUpdateStatus(outcome.eventId)

    const betsCount = await prisma.bet.count({
      where: {
        option: {
          outcomeId
        }
      }
    })

    if (betsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot edit outcome with existing bets' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updateOutcomeSchema.parse(body)

    const updateData: any = {}
    if (validatedData.question) {
      updateData.question = validatedData.question
    }

    let updatedOutcome

    if (validatedData.options) {
      await prisma.option.deleteMany({
        where: { outcomeId }
      })

      updatedOutcome = await prisma.outcome.update({
        where: { id: outcomeId },
        data: {
          ...updateData,
          options: {
            create: validatedData.options.map(label => ({ label }))
          }
        },
        include: {
          options: true,
          creator: {
            select: {
              id: true,
              displayName: true,
              photoUrl: true
            }
          }
        }
      })
    } else {
      updatedOutcome = await prisma.outcome.update({
        where: { id: outcomeId },
        data: updateData,
        include: {
          options: true,
          creator: {
            select: {
              id: true,
              displayName: true,
              photoUrl: true
            }
          }
        }
      })
    }

    return NextResponse.json(updatedOutcome)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating outcome:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request)
    const { id: outcomeId } = await params

    const { allowed, error, outcome } = await canModifyOutcome(session, outcomeId)

    if (!allowed || !outcome) {
      return NextResponse.json(
        { error },
        { status: error === 'Outcome not found' ? 404 : 403 }
      )
    }

    await checkAndUpdateStatus(outcome.eventId)

    const betsCount = await prisma.bet.count({
      where: {
        option: {
          outcomeId
        }
      }
    })

    if (betsCount > 0) {
      await prisma.outcome.update({
        where: { id: outcomeId },
        data: { status: 'REFUNDED' }
      })
    } else {
      await prisma.outcome.delete({
        where: { id: outcomeId }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting outcome:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
