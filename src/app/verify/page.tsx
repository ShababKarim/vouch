'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/layout/AuthProvider'
import { ArrowLeft, Shield } from 'lucide-react'

function VerifyContent() {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState(60)
  const { verifyOtp, login, user, isUserVerified } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const phone = searchParams.get('phone')

  useEffect(() => {
    if (!phone) {
      router.push('/login')
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [phone, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!code.trim()) {
      setError('Please enter the verification code')
      return
    }

    if (code.length !== 6) {
      setError('Please enter a 6-digit code')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await verifyOtp(phone!, code.trim())
        if (isUserVerified(user)) {
            router.push('/events')
        } else {
            router.push('/setup')
        }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (timeLeft > 0) return

    try {
      await login(phone!)
      setTimeLeft(60)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code')
    }
  }

  const formatCode = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 6)
  }

  if (!phone) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <button
          onClick={() => router.back()}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </button>

        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            Verify your phone
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We sent a 6-digit code to {phone}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                Verification code
              </label>
              <input
                id="code"
                name="code"
                type="text"
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(e) => setCode(formatCode(e.target.value))}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-center text-lg tracking-widest"
                placeholder="000000"
                maxLength={6}
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  'Verify'
                )}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={timeLeft > 0}
                className="text-sm text-blue-600 hover:text-blue-500 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {timeLeft > 0
                  ? `Resend code in ${timeLeft}s`
                  : "Didn't receive the code? Resend"
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
}
