'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, User } from 'lucide-react'

export function BottomNav() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/events') {
      return pathname === '/events' || pathname.startsWith('/events/')
    }
    return pathname === path
  }

  const navItems = [
    {
      href: '/events',
      label: 'Events',
      icon: Calendar
    },
    {
      href: '/profile',
      label: 'Profile',
      icon: User
    }
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1
                  transition-colors duration-200
                  ${active
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium truncate">
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
