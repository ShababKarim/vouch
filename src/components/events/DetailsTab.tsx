import { Event } from '@/lib/types';
import { toTitleCase } from '@/lib/utils';

export default function DetailsTab({ event }: { event: Event }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-lg font-medium text-gray-900">About this event</h2>
        {event.description ? (
          <p className="whitespace-pre-wrap text-gray-600">{event.description}</p>
        ) : (
          <p className="text-gray-500 italic">No description provided</p>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-lg font-medium text-gray-900">Event details</h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1 text-sm text-gray-900">{toTitleCase(event.status)}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Privacy</dt>
            <dd className="mt-1 text-sm text-gray-900">{event.isPublic ? 'Public' : 'Private'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Invite code</dt>
            <dd className="mt-1 font-mono text-sm text-gray-900">{event.inviteCode}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
