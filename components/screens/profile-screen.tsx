'use client'

import { Flame, Trophy, Target, Ticket, TrendingUp, Award, ChevronRight } from 'lucide-react'
import { profile, modules } from '@/lib/content'
import { useNav } from '@/components/navigation'

const stats = [
  { icon: Flame, label: 'Day streak', value: profile.streak, tint: 'text-warning' },
  { icon: Target, label: 'Accuracy', value: `${profile.accuracy}%`, tint: 'text-success' },
  { icon: Ticket, label: 'Tickets issued', value: profile.ticketsIssued, tint: 'text-primary' },
  { icon: Trophy, label: 'Rank', value: profile.rank, tint: 'text-warning' },
]

const badges = [
  { name: 'First PNR', earned: true },
  { name: 'Availability Ace', earned: true },
  { name: 'Fare Wizard', earned: false },
  { name: 'Ticketing Pro', earned: false },
]

export function ProfileScreen() {
  const { openAssessment } = useNav()
  const xpPct = Math.round((profile.xp / profile.nextLevelXp) * 100)

  return (
    <div className="no-scrollbar h-full overflow-y-auto px-5 pb-8 pt-8">
      <div className="flex flex-col items-center text-center">
        <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/50 text-2xl font-bold text-primary-foreground">
          {profile.name.split(' ').map((n) => n[0]).join('')}
        </div>
        <h1 className="mt-3 text-xl font-bold">{profile.name}</h1>
        <p className="text-sm text-muted-foreground">{profile.handle}</p>
        <span className="mt-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {profile.level}
        </span>
      </div>

      {/* XP progress */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 font-semibold">
            <TrendingUp size={15} className="text-primary" />
            Experience
          </span>
          <span className="font-mono text-muted-foreground">
            {profile.xp} / {profile.nextLevelXp} XP
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${xpPct}%` }} />
        </div>
      </div>

      {/* Stats grid */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
            <s.icon size={18} className={s.tint} />
            <div className="mt-2 text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Certification CTA */}
      <button
        type="button"
        onClick={() => openAssessment('cert-core')}
        className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-left active:scale-[0.99]"
      >
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/20 text-primary">
          <Award size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Take Certification Exam</p>
          <p className="text-xs text-muted-foreground">Timed practical booking scenario</p>
        </div>
        <ChevronRight size={20} className="shrink-0 text-primary" />
      </button>

      {/* Badges */}
      <h2 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Badges
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {badges.map((b) => (
          <div
            key={b.name}
            className={`flex items-center gap-2.5 rounded-xl border p-3 ${
              b.earned ? 'border-border bg-card' : 'border-dashed border-border bg-transparent opacity-50'
            }`}
          >
            <Award size={18} className={b.earned ? 'text-warning' : 'text-muted-foreground'} />
            <span className="text-sm font-medium">{b.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
