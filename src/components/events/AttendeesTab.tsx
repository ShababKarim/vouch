import { Users } from 'lucide-react';
import { Event } from '@/lib/types';

export default function AttendeesTab({ event }: { event: Event }) {
  return (
    <div>
      <h2 className="mb-4 text-lg font-medium text-gray-900">Attendees ({event._count.memberships})</h2>
      {event.memberships.length === 0 ? (
        <p className="text-gray-500">No attendees yet</p>
      ) : (
        <div className="space-y-3">
          {event.memberships.map((membership) => (
            <div key={membership.id} className="flex items-center justify-between">
              <div className="flex items-center">
                {membership.user.photoUrl ? (
                  <img
                    src={membership.user.photoUrl}
                    alt={membership.user.displayName}
                    className="mr-3 h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                    <Users className="h-4 w-4 text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{membership.user.displayName}</p>
                  <p className="text-xs text-gray-500">{membership.role}</p>
                </div>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                  membership.rsvpStatus === 'YES'
                    ? 'bg-green-100 text-green-800'
                    : membership.rsvpStatus === 'NO'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {membership.rsvpStatus}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
