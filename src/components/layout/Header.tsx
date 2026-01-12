'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { LogOut, User } from 'lucide-react';

export function Header() {
    const { user, logout } = useAuth();

    return (
        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <Link href="/events" className="text-xl font-bold text-gray-900">
                        Vouch
                    </Link>

                    {user && (
                        <div className="flex items-center gap-4">
                            <Link
                                href="/profile"
                                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                            >
                                {user.photoUrl ? (
                                    <img
                                        src={user.photoUrl}
                                        alt={user.displayName}
                                        className="h-8 w-8 rounded-full object-cover"
                                    />
                                ) : (
                                    <User className="h-8 w-8 text-gray-400" />
                                )}
                                <span className="hidden sm:inline">{user.displayName}</span>
                            </Link>

                            <button
                                onClick={logout}
                                className="p-2 text-gray-500 transition-colors hover:text-gray-700"
                                aria-label="Logout"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
