'use client'

import { Flame, Zap, ChevronRight, Play, TerminalSquare, Target, Check } from 'lucide-react'
import { useState } from 'react'
import { useNav } from '../navigation'
import { ProgressRing } from '../ui/progress-ring'
import { modules, profile, dailyChallenge, getModule } from '@/lib/content'

export function HomeScreen() {
  const { openLesson, openTerminalWith, goTab } = useNav()
  const activeModule = modules.find((m) => m.status === 'active') ?? modules[0]
  const [answer, setAnswer] = useState('')
  const [solved, setSolved] = useState(false)

  const checkChallenge = () => {
    if (answer.trim().toUpperCase().replace(/\s+/g, '') === dailyChallenge.answer) {
      setSolved(true)
    }
  }

  return (
    <div className="flex flex-col gap-5 px-5 pb-8 pt-6">
      {/* Top bar */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-foreground ring-2 ring-primary/40">
            NK
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Welcome back</p>
            <h1 className="text-base font-semibold leading-tight">{profile.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
          <Flame size={16} className="text-warning" />
          <span className="text-sm font-bold">{profile.streak}</span>
          <span className="text-xs text-muted-foreground">day streak</span>
        </div>
      </header>

      {/* Stats strip */}
      <section aria-label="Your progress" className="grid grid-cols-3 gap-3">
        <StatCard label="XP" value={profile.xp.toLocaleString()} accent />
        <StatCard label="Accuracy" value={`${profile.accuracy}%`} />
        <StatCard label="Modules" value={`${profile.completedModules}/${profile.totalModules}`} />
      </section>

      {/* Continue course */}
      <section aria-labelledby="continue-heading" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 id="continue-heading" className="text-sm font-semibold text-muted-foreground">
            Continue Course
          </h2>
          <button onClick={() => goTab('roadmap')} className="text-xs font-medium text-primary">
            View roadmap
          </button>
        </div>

        <button
          onClick={() => openLesson(activeModule.id)}
          className="group relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-brand to-card p-5 text-left"
        >
          <div className="absolute right-0 top-0 h-full w-1/2 grid-glow opacity-40" aria-hidden />
          <div className="relative flex items-center gap-4">
            <ProgressRing value={activeModule.progress} size={64} stroke={6}>
              <span className="text-xs font-bold text-primary">{activeModule.progress}%</span>
            </ProgressRing>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                {activeModule.code} • Basic GDS Core
              </span>
              <h3 className="mt-0.5 truncate text-lg font-semibold text-foreground">
                {activeModule.title}
              </h3>
              <p className="truncate text-sm text-muted-foreground">{activeModule.subtitle}</p>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-105">
              <Play size={18} className="translate-x-0.5" fill="currentColor" />
            </span>
          </div>
        </button>
      </section>

      {/* Quick terminal practice */}
      <button
        onClick={() => openTerminalWith('')}
        className="flex items-center gap-4 rounded-2xl border border-primary/30 bg-term-bg p-4 text-left transition-colors hover:border-primary/60"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <TerminalSquare size={22} />
        </span>
        <div className="flex-1">
          <h3 className="font-mono text-sm font-semibold text-term-cyan">Quick Terminal Practice</h3>
          <p className="text-xs text-muted-foreground">Open a free-play GDS command line</p>
        </div>
        <ChevronRight size={18} className="text-muted-foreground" />
      </button>

      {/* Daily command challenge */}
      <section
        aria-labelledby="challenge-heading"
        className="rounded-2xl border border-border bg-card p-5"
      >
        <div className="mb-3 flex items-center gap-2">
          <Target size={16} className="text-accent" />
          <h2 id="challenge-heading" className="text-sm font-semibold">
            {dailyChallenge.title}
          </h2>
          <span className="ml-auto rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
            {dailyChallenge.reward}
          </span>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{dailyChallenge.prompt}</p>

        {solved ? (
          <div className="flex items-center gap-2 rounded-xl border border-success/40 bg-success/10 px-4 py-3">
            <Check size={18} className="text-success" />
            <span className="text-sm font-medium text-success">Correct! {dailyChallenge.answer}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-term-bg px-3 py-2.5 font-mono text-sm">
              <span className="text-term-dim">&gt;</span>
              <input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) checkChallenge()
                }}
                placeholder="Type the command…"
                spellCheck={false}
                autoCapitalize="characters"
                className="w-full bg-transparent uppercase tracking-wide text-term-green outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-term-dim"
                aria-label="Your answer command"
              />
            </div>
            <button
              onClick={checkChallenge}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Check
            </button>
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-3 text-center">
      <div className={`flex items-center justify-center gap-1 ${accent ? 'text-primary' : 'text-foreground'}`}>
        {accent && <Zap size={13} className="text-primary" />}
        <span className="text-lg font-bold leading-none">{value}</span>
      </div>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  )
}
