import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createSmsService } from '@/services/sms'
import { checkEventRole } from '@/lib/event'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(request)
    const { id: eventId } = await params
    const { message, filter = 'all' } = await request.json()

    if (!message || message.trim() === '') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    if (!['all', 'yes', 'maybe'].includes(filter)) {
      return NextResponse.json(
        { error: 'Invalid filter option' },
        { status: 400 }
      )
    }

    const hasPermission = await checkEventRole(session.userId, eventId, ['HOST', 'COHOST'])
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    let whereClause: any = { eventId }
    
    if (filter === 'yes') {
      whereClause.rsvpStatus = 'YES'
    } else if (filter === 'maybe') {
      whereClause.rsvpStatus = 'MAYBE'
    }

    const members = await prisma.eventMembership.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            phone: true
          }
        }
      }
    })

    if (members.length === 0) {
      return NextResponse.json(
        { error: 'No members found with the specified filter' },
        { status: 404 }
      )
    }

    const smsService = createSmsService()
    const results = []

    for (const member of members) {
      try {
        await smsService.sendSms(member.user.phone, message)
        results.push({
          userId: member.user.id,
          displayName: member.user.displayName,
          phone: member.user.phone,
          status: 'sent'
        })
      } catch (error) {
        console.error(`Failed to send SMS to ${member.user.phone}:`, error)
        results.push({
          userId: member.user.id,
          displayName: member.user.displayName,
          phone: member.user.phone,
          status: 'failed'
        })
      }
    }

    const sentCount = results.filter(r => r.status === 'sent').length
    const failedCount = results.filter(r => r.status === 'failed').length

    return NextResponse.json({
      message: 'Text blast completed',
      totalRecipients: results.length,
      sentCount,
      failedCount,
      results
    })
  } catch (error) {
    console.error('Error sending text blast:', error)
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to send text blast' },
      { status: 500 }
    )
  }
}
