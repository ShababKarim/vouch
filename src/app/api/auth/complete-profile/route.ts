import { NextRequest, NextResponse } from 'next/server'
import {
    AUTH_COOKIE_HTTP_ONLY,
    AUTH_COOKIE_MAX_AGE,
    AUTH_COOKIE_NAME,
    AUTH_COOKIE_SAME_SITE,
    AUTH_COOKIE_SECURE,
    requireAuth, signJwt
} from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const { displayName, photoUrl } = await request.json()

    if (!displayName) {
      return NextResponse.json(
        { error: 'Display name is required' },
        { status: 400 }
      )
    }

    // Update user profile
    const user = await prisma.user.update({
      where: { id: session.userId },
      data: {
        displayName,
        photoUrl: photoUrl || null,
      },
    })
      const response = NextResponse.json({
          success: true,
          user: {
              id: user.id,
              phone: user.phone,
              displayName: user.displayName,
              photoUrl: user.photoUrl,
          },
      })

      // Create JWT
      const token = signJwt({
          userId: user.id,
          ...user,
      })
      console.log(`USER: ${JSON.stringify(user)}`);

      response.cookies.set(AUTH_COOKIE_NAME, token, {
          httpOnly: AUTH_COOKIE_HTTP_ONLY,
          secure: AUTH_COOKIE_SECURE,
          sameSite: AUTH_COOKIE_SAME_SITE,
          maxAge: AUTH_COOKIE_MAX_AGE,
      })

      return response
  } catch (error) {
    console.error('Error completing profile:', error)
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
