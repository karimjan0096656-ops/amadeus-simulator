'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export type Tab = 'home' | 'roadmap' | 'terminal' | 'profile'
export type Overlay =
  | { type: 'lesson'; id: string }
  | { type: 'assessment'; id: string }
  | null

type NavState = {
  tab: Tab
  overlay: Overlay
  terminalSeed: string | null
  goTab: (tab: Tab) => void
  openLesson: (id: string) => void
  openAssessment: (id: string) => void
  closeOverlay: () => void
  openTerminalWith: (command: string) => void
  consumeSeed: () => void
}

const NavContext = createContext<NavState | null>(null)

export function NavProvider({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<Tab>('home')
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [terminalSeed, setTerminalSeed] = useState<string | null>(null)

  const goTab = useCallback((t: Tab) => {
    setOverlay(null)
    setTab(t)
  }, [])

  const openLesson = useCallback((id: string) => setOverlay({ type: 'lesson', id }), [])
  const openAssessment = useCallback((id: string) => setOverlay({ type: 'assessment', id }), [])
  const closeOverlay = useCallback(() => setOverlay(null), [])

  const openTerminalWith = useCallback((command: string) => {
    setTerminalSeed(command)
    setOverlay(null)
    setTab('terminal')
  }, [])

  const consumeSeed = useCallback(() => setTerminalSeed(null), [])

  return (
    <NavContext.Provider
      value={{
        tab,
        overlay,
        terminalSeed,
        goTab,
        openLesson,
        openAssessment,
        closeOverlay,
        openTerminalWith,
        consumeSeed,
      }}
    >
      {children}
    </NavContext.Provider>
  )
}

export function useNav() {
  const ctx = useContext(NavContext)
  if (!ctx) throw new Error('useNav must be used within NavProvider')
  return ctx
}
