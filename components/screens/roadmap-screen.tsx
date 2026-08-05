'use client'

import { useState } from 'react'
import { Check, Lock, Play, GraduationCap, Layers, Rocket } from 'lucide-react'
import { useNav } from '../navigation'
import { tracks, getModule, type LessonModule } from '@/lib/content'

export function RoadmapScreen() {
  const [active, setActive] = useState<'core' | 'advanced'>('core')
  const track = tracks.find((t) => t.id === active)!
  const trackModules = track.moduleIds.map((id) => getModule(id)!).filter(Boolean)

  return (
    <div className="flex flex-col gap-5 px-5 pb-8 pt-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Learning Roadmap</p>
        <h1 className="mt-1 text-2xl font-bold text-balance">Your path to GDS mastery</h1>
      </header>

      {/* Track selector */}
      <div
        role="tablist"
        aria-label="Course tracks"
        className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-card p-1.5"
      >
        {tracks.map((t) => {
          const on = active === t.id
          const Icon = t.id === 'core' ? Layers : Rocket
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={on}
              onClick={() => setActive(t.id)}
              className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2.5 text-center transition-colors ${
                on ? 'bg-brand text-brand-foreground' : 'text-muted-foreground'
              }`}
            >
              <Icon size={16} className={on ? 'text-primary' : ''} />
              <span className="text-xs font-semibold">{t.name}</span>
            </button>
          )
        })}
      </div>

      {/* Timeline */}
      <section aria-label={`${track.name} modules`} className="relative pl-2">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <GraduationCap size={16} className="text-accent" />
          <span>{track.tagline}</span>
        </div>

        <ol className="relative">
          {trackModules.map((m, i) => (
            <TimelineNode key={m.id} module={m} last={i === trackModules.length - 1} />
          ))}
        </ol>
      </section>
    </div>
  )
}

function TimelineNode({ module: m, last }: { module: LessonModule; last: boolean }) {
  const { openLesson } = useNav()
  const locked = m.status === 'locked'

  return (
    <li className="relative flex gap-4 pb-5">
      {/* spine + node */}
      <div className="relative flex flex-col items-center">
        <span
          className={`z-10 flex h-11 w-11 items-center justify-center rounded-xl border text-sm font-bold ${
            m.status === 'completed'
              ? 'border-success/50 bg-success/15 text-success'
              : m.status === 'active'
                ? 'border-primary bg-primary text-primary-foreground shadow-[0_0_18px_-2px_var(--primary)]'
                : 'border-border bg-muted text-muted-foreground'
          }`}
        >
          {m.status === 'completed' ? (
            <Check size={18} />
          ) : locked ? (
            <Lock size={16} />
          ) : (
            <Play size={16} className="translate-x-0.5" fill="currentColor" />
          )}
        </span>
        {!last && (
          <span
            className={`absolute top-11 h-[calc(100%-1rem)] w-0.5 ${
              m.status === 'completed' ? 'bg-success/40' : 'bg-border'
            }`}
            aria-hidden
          />
        )}
      </div>

      {/* card */}
      <button
        disabled={locked}
        onClick={() => !locked && openLesson(m.id)}
        className={`flex-1 rounded-2xl border p-4 text-left transition-colors ${
          locked
            ? 'cursor-not-allowed border-border bg-card/50 opacity-70'
            : 'border-border bg-card hover:border-primary/50'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {m.code}
          </span>
          <span className="text-[10px] text-muted-foreground">{m.duration}</span>
        </div>
        <h3 className="mt-1 text-base font-semibold">{m.title}</h3>
        <p className="text-sm text-muted-foreground">{m.subtitle}</p>

        {m.status === 'active' && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${m.progress}%` }} />
          </div>
        )}
        {m.status === 'completed' && (
          <span className="mt-2 inline-block text-xs font-medium text-success">Completed</span>
        )}
        {m.status === 'locked' && (
          <span className="mt-2 inline-block text-xs text-muted-foreground">
            Complete previous module to unlock
          </span>
        )}
      </button>
    </li>
  )
}
