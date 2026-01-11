import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)

    const events = await prisma.event.findMany({
      where: {
        memberships: {
          some: {
            userId: session.userId
          }
        }
      },
      include: {
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                photoUrl: true
              }
            }
          }
        },
        _count: {
          select: {
            memberships: true,
            outcomes: true
          }
        }
      },
      orderBy: {
        datetime: 'asc'
      }
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Error fetching events:', error)
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const { title, datetime, location, description, coverImage, isPublic } = await request.json()

    if (!title || !datetime || !location) {
      return NextResponse.json(
        { error: 'Title, datetime, and location are required' },
        { status: 400 }
      )
    }

    const event = await prisma.event.create({
      data: {
        title,
        datetime: new Date(datetime),
        location,
        description,
        coverImage,
        isPublic: isPublic || false,
        status: 'UPCOMING',
        inviteCode: crypto.randomUUID(),
        memberships: {
          create: {
            userId: session.userId,
            role: 'HOST',
            rsvpStatus: 'YES'
          }
        }
      },
      include: {
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                photoUrl: true
              }
            }
          }
        },
        _count: {
          select: {
            memberships: true,
            outcomes: true
          }
        }
      }
    })

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Error creating event:', error)
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}
