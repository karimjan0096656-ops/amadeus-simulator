'use client'

import { NavProvider, useNav } from './navigation'
import { BottomNav } from './bottom-nav'
import { HomeScreen } from './screens/home-screen'
import { RoadmapScreen } from './screens/roadmap-screen'
import { TerminalScreen } from './screens/terminal-screen'
import { ProfileScreen } from './screens/profile-screen'
import { LessonScreen } from './screens/lesson-screen'
import { AssessmentScreen } from './screens/assessment-screen'

function ScreenRouter() {
  const { tab, overlay } = useNav()

  if (overlay?.type === 'lesson') return <LessonScreen id={overlay.id} />
  if (overlay?.type === 'assessment') return <AssessmentScreen id={overlay.id} />

  switch (tab) {
    case 'home':
      return <HomeScreen />
    case 'roadmap':
      return <RoadmapScreen />
    case 'terminal':
      return <TerminalScreen />
    case 'profile':
      return <ProfileScreen />
  }
}

export function AppShell() {
  return (
    <NavProvider>
      {/* Desktop backdrop */}
      <div className="grid-glow flex min-h-dvh w-full items-center justify-center bg-background md:p-6">
        {/* Phone frame */}
        <div className="relative flex h-dvh w-full max-w-[440px] flex-col overflow-hidden bg-background shadow-2xl md:h-[900px] md:max-h-[90dvh] md:rounded-[2.25rem] md:border md:border-border md:shadow-[0_0_80px_-20px_rgba(34,211,238,0.25)]">
          <main className="no-scrollbar flex-1 overflow-y-auto">
            <ScreenRouter />
          </main>
          <BottomNav />
        </div>
      </div>
    </NavProvider>
  )
}
