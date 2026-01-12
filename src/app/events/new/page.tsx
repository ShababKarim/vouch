'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { ArrowLeft, Camera, Globe, Lock } from 'lucide-react';

interface EventFormData {
    title: string;
    datetime: string;
    location: string;
    description: string;
    isPublic: boolean;
    coverImage?: string;
}

export default function NewEventPage() {
    const [formData, setFormData] = useState<EventFormData>({
        title: '',
        datetime: '',
        location: '',
        description: '',
        isPublic: false,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            setError('Please enter an event title');
            return;
        }

        if (!formData.datetime) {
            setError('Please select a date and time');
            return;
        }

        if (!formData.location.trim()) {
            setError('Please enter a location');
            return;
        }

        const eventDate = new Date(formData.datetime);
        if (eventDate < new Date()) {
            setError('Event must be in the future');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create event');
            }

            const data = await response.json();
            router.push(`/events/${data.event?.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create event');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setError('Cover image must be less than 5MB');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const { url } = await response.json();
            setFormData((prev) => ({ ...prev, coverImage: url }));
            setError('');
        } catch (err) {
            setError('Failed to upload cover image');
        }
    };

    const handleInputChange = (field: keyof EventFormData, value: string | boolean) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setError('');
    };

    return (
        <ProtectedRoute requireProfile>
            <div className="min-h-screen bg-gray-50 pb-16">
                <Header />

                <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                        >
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Back to events
                        </button>
                        <h1 className="mt-4 text-2xl font-bold text-gray-900">Create Event</h1>
                        <p className="mt-1 text-sm text-gray-600">Set up your event and invite people to join</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="rounded-lg bg-white p-6 shadow">
                            <div className="space-y-6">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Cover image</label>
                                    <div className="flex items-center space-x-6">
                                        <div className="shrink-0">
                                            {formData.coverImage ? (
                                                <img
                                                    src={formData.coverImage}
                                                    alt="Event cover"
                                                    className="h-20 w-20 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-200">
                                                    <Camera className="h-8 w-8 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handlePhotoUpload}
                                                className="hidden"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm leading-4 font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                                            >
                                                <Camera className="mr-1 inline h-4 w-4" />
                                                Choose image
                                            </button>
                                            <p className="mt-1 text-xs text-gray-500">JPG, PNG or GIF. Max 5MB.</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                                        Event title *
                                    </label>
                                    <input
                                        type="text"
                                        id="title"
                                        required
                                        value={formData.title}
                                        onChange={(e) => handleInputChange('title', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        placeholder="Enter event title"
                                        maxLength={100}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="datetime" className="block text-sm font-medium text-gray-700">
                                        Date and time *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        id="datetime"
                                        required
                                        value={formData.datetime}
                                        onChange={(e) => handleInputChange('datetime', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        min={new Date().toISOString().slice(0, 16)}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                                        Location *
                                    </label>
                                    <input
                                        type="text"
                                        id="location"
                                        required
                                        value={formData.location}
                                        onChange={(e) => handleInputChange('location', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        placeholder="Enter event location"
                                        maxLength={200}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                        Description
                                    </label>
                                    <textarea
                                        id="description"
                                        rows={4}
                                        value={formData.description}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        placeholder="Describe your event"
                                        maxLength={500}
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        {formData.description.length}/500 characters
                                    </p>
                                </div>

                                <div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="isPublic"
                                            checked={formData.isPublic}
                                            onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900">
                                            Make this event public
                                        </label>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Public events can be joined by anyone with the invite link
                                    </p>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-md bg-red-50 p-4">
                                <div className="text-sm text-red-800">{error}</div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                                ) : (
                                    'Create Event'
                                )}
                            </button>
                        </div>
                    </form>
                </main>

                <BottomNav />
            </div>
        </ProtectedRoute>
    );
}
