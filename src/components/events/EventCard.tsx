'use client'

import Link from 'next/link'
import { Calendar, MapPin, Users, DollarSign } from 'lucide-react'

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

interface EventCardProps {
  event: Event
}

export function EventCard({ event }: EventCardProps) {
  const eventDate = new Date(event.datetime)
  const isPast = eventDate < new Date()
  const isUpcoming = !isPast

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return 'bg-green-100 text-green-800'
      case 'ACTIVE':
        return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      case 'RESOLVED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Link href={`/events/${event.id}`}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden">
        {event.coverImage ? (
          <div className="h-32 w-full">
            <img
              src={event.coverImage}
              alt={event.title}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="h-32 w-full bg-gradient-to-br from-blue-500 to-purple-600"></div>
        )}
        
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
              {event.title}
            </h3>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
              {event.status.toLowerCase()}
            </span>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              {formatDateTime(eventDate)}
            </div>
            
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
              <span className="truncate">{event.location}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-gray-400" />
                <span>{event.memberCount} attending</span>
              </div>
              
              {event.outcomeCount > 0 && (
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                  <span>{event.outcomeCount} bets</span>
                </div>
              )}
            </div>
          </div>

          {event.description && (
            <p className="mt-3 text-sm text-gray-600 line-clamp-2">
              {event.description}
            </p>
          )}

          <div className="mt-3 flex items-center justify-between">
            <span className={`text-xs font-medium ${isUpcoming ? 'text-green-600' : 'text-gray-500'}`}>
              {isUpcoming ? 'Upcoming' : 'Past'}
            </span>
            
            {event.isPublic && (
              <span className="text-xs text-gray-500">
                Public event
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
