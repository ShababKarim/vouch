'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { EventCard } from '@/components/events/EventCard'
import { Plus, Calendar, Filter } from 'lucide-react'

interface Event {
  id: string
  title: string
  datetime: string
  location: string
  description?: string
  coverImage?: string
  isPublic: boolean
  status: string
  memberCount: number
  outcomeCount: number
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all')

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events')
      if (!response.ok) {
        throw new Error('Failed to fetch events')
      }
      const data = await response.json()
      setEvents(data['events'])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredEvents = events.filter(event => {
    const eventDate = new Date(event.datetime)
    const now = new Date()
    
    switch (filter) {
      case 'upcoming':
        return eventDate >= now
      case 'past':
        return eventDate < now
      default:
        return true
    }
  })

  const sortedEvents = filteredEvents.sort((a, b) => {
    const dateA = new Date(a.datetime)
    const dateB = new Date(b.datetime)
    return dateB.getTime() - dateA.getTime()
  })

  if (isLoading) {
    return (
      <ProtectedRoute requireProfile>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <BottomNav />
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requireProfile>
      <div className="min-h-screen bg-gray-50 pb-16">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Events</h1>
              <p className="mt-1 text-sm text-gray-600">
                Your upcoming and past events
              </p>
            </div>
            
            <Link
              href="/events/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Link>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <div className="mb-6">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">Filter:</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    filter === 'all'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('upcoming')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    filter === 'upcoming'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setFilter('past')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    filter === 'past'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Past
                </button>
              </div>
            </div>
          </div>

          {sortedEvents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No events</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'all' 
                  ? "Get started by creating your first event."
                  : `No ${filter} events found.`
                }
              </p>
              {filter === 'all' && (
                <div className="mt-6">
                  <Link
                    href="/events/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sortedEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </main>
        
        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}
