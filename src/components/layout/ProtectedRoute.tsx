'use client'

import { useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'

interface ProtectedRouteProps {
  children: ReactNode
  requireProfile?: boolean
}

export function ProtectedRoute({ children, requireProfile = false }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login')
        return
      }

      if (requireProfile && !user.displayName) {
        router.push('/setup')
        return
      }
    }
  }, [user, isLoading, requireProfile, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (requireProfile && !user.displayName) {
    return null
  }

  return <>{children}</>
}
