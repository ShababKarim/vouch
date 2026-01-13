import { NextRequest, NextResponse } from 'next/server';
import {
  AUTH_COOKIE_HTTP_ONLY,
  AUTH_COOKIE_MAX_AGE,
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_SAME_SITE,
  AUTH_COOKIE_SECURE,
} from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true });

    // Clear the auth cookie
    response.cookies.set(AUTH_COOKIE_NAME, '', {
      httpOnly: AUTH_COOKIE_HTTP_ONLY,
      secure: AUTH_COOKIE_SECURE,
      sameSite: AUTH_COOKIE_SAME_SITE,
      maxAge: AUTH_COOKIE_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error('Error logging out:', error);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
