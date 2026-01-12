'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, User } from 'lucide-react';

export function BottomNav() {
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === '/events') {
            return pathname === '/events' || pathname.startsWith('/events/');
        }
        return pathname === path;
    };

    const navItems = [
        {
            href: '/events',
            label: 'Events',
            icon: Calendar,
        },
        {
            href: '/profile',
            label: 'Profile',
            icon: User,
        },
    ];

    return (
        <nav className="fixed right-0 bottom-0 left-0 z-50 border-t border-gray-200 bg-white">
            <div className="mx-auto max-w-7xl px-4">
                <div className="flex justify-around">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex min-w-0 flex-1 flex-col items-center justify-center px-3 py-2 transition-colors duration-200 ${
                                    active ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                                } `}
                            >
                                <Icon className="mb-1 h-6 w-6" />
                                <span className="truncate text-xs font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
