'use client'

import { Home, Map, TerminalSquare, User } from 'lucide-react'
import { useNav, type Tab } from './navigation'

const items: { tab: Tab; label: string; Icon: typeof Home }[] = [
  { tab: 'home', label: 'Home', Icon: Home },
  { tab: 'roadmap', label: 'Roadmap', Icon: Map },
  { tab: 'terminal', label: 'Terminal', Icon: TerminalSquare },
  { tab: 'profile', label: 'Profile', Icon: User },
]

export function BottomNav() {
  const { tab, goTab } = useNav()

  return (
    <nav
      aria-label="Primary"
      className="border-t border-border bg-card/95 backdrop-blur-md"
    >
      <ul className="flex items-stretch">
        {items.map(({ tab: t, label, Icon }) => {
          const active = tab === t
          return (
            <li key={t} className="flex-1">
              <button
                type="button"
                onClick={() => goTab(t)}
                aria-current={active ? 'page' : undefined}
                className="group relative flex w-full flex-col items-center gap-1 py-2.5 outline-none"
              >
                <span
                  className={`absolute top-0 h-0.5 w-8 rounded-full transition-all ${
                    active ? 'bg-primary' : 'bg-transparent'
                  }`}
                />
                <Icon
                  size={20}
                  strokeWidth={active ? 2.4 : 1.9}
                  className={active ? 'text-primary' : 'text-muted-foreground'}
                />
                <span
                  className={`text-[10px] font-medium tracking-wide ${
                    active ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {label}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
