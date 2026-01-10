import jwt from 'jsonwebtoken'
import { env } from './env'
import { prisma } from './prisma'
import { NextRequest } from 'next/server'

export interface JWTPayload {
  userId: string
  phone: string
}

export function signJwt(payload: JWTPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: `${env.JWT_EXPIRY_HOURS}h`,
  })
}

export function verifyJwt(token: string): JWTPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JWTPayload
  } catch (error) {
    throw new Error('Invalid token')
  }
}

export async function getSession(request: NextRequest): Promise<JWTPayload | null> {
  try {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return null
    }
    
    const payload = verifyJwt(token)
    
    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    })
    
    if (!user) {
      return null
    }
    
    return payload
  } catch (error) {
    return null
  }
}

export async function requireAuth(request: NextRequest): Promise<JWTPayload> {
  const session = await getSession(request)
  
  if (!session) {
    throw new Error('Authentication required')
  }
  
  return session
}
