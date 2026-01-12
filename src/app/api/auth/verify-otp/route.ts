import { NextRequest, NextResponse } from 'next/server'
import { createSmsService } from '@/services/sms'
import {
    AUTH_COOKIE_HTTP_ONLY,
    AUTH_COOKIE_MAX_AGE,
    AUTH_COOKIE_NAME,
    AUTH_COOKIE_SAME_SITE,
    AUTH_COOKIE_SECURE,
    signJwt
} from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json()

    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Phone number and code are required' },
        { status: 400 }
      )
    }

    // Verify OTP
    const smsService = createSmsService()
    const isValid = await smsService.verifyOtp(phone, code)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 401 }
      )
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { phone },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Create JWT
    const token = signJwt({
      userId: user.id,
        ...user,
    })

    // Set HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        displayName: user.displayName,
        photoUrl: user.photoUrl,
      },
    })

    response.cookies.set(AUTH_COOKIE_NAME, token, {
        httpOnly: AUTH_COOKIE_HTTP_ONLY,
        secure: AUTH_COOKIE_SECURE,
        sameSite: AUTH_COOKIE_SAME_SITE,
        maxAge: AUTH_COOKIE_MAX_AGE,
    })

    return response
  } catch (error) {
    console.error('Error verifying OTP:', error)
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    )
  }
}
