'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronDown, Terminal, Clock, Copy, Check } from 'lucide-react'
import { getModule } from '@/lib/content'
import { useNav } from '@/components/navigation'

export function LessonScreen({ id }: { id: string }) {
  const { closeOverlay, openTerminalWith } = useNav()
  const mod = getModule(id)
  const [open, setOpen] = useState<Record<number, boolean>>({ 0: true })
  const [copied, setCopied] = useState<string | null>(null)

  if (!mod) return null

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 1200)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/85 px-4 pb-3 pt-5 backdrop-blur">
        <button
          type="button"
          onClick={closeOverlay}
          className="flex items-center gap-1 text-sm text-muted-foreground active:scale-95"
        >
          <ChevronLeft size={18} />
          Roadmap
        </button>
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-28 pt-4">
        <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-widest text-primary">
          <span>{mod.code}</span>
          <span className="h-1 w-1 rounded-full bg-muted-foreground" />
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock size={12} />
            {mod.duration}
          </span>
        </div>
        <h1 className="mt-2 text-balance text-2xl font-bold leading-tight">{mod.title}</h1>
        <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">{mod.intro}</p>

        {/* Theory blocks */}
        <h2 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Theory
        </h2>
        <div className="space-y-2.5">
          {mod.theory.map((block, i) => {
            const isOpen = open[i]
            return (
              <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
                <button
                  type="button"
                  onClick={() => setOpen((p) => ({ ...p, [i]: !p[i] }))}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left active:bg-muted/40"
                >
                  <span className="font-semibold">{block.heading}</span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <p className="border-t border-border px-4 py-3.5 text-sm leading-relaxed text-muted-foreground">
                    {block.body}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {/* Command syntax cards */}
        <h2 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Command Reference
        </h2>
        <div className="space-y-2.5">
          {mod.commands.map((cmd) => (
            <div key={cmd.command} className="rounded-xl border border-primary/20 bg-card">
              <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-primary/15 px-2 py-0.5 font-mono text-sm font-bold text-primary">
                    {cmd.command}
                  </span>
                  <span className="text-sm text-muted-foreground">{cmd.label}</span>
                </div>
              </div>
              <div className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => copy(cmd.example)}
                  className="group flex w-full items-center justify-between gap-2 rounded-lg bg-term-bg px-3 py-2 text-left active:scale-[0.99]"
                >
                  <code className="font-mono text-sm text-term-cyan">{cmd.example}</code>
                  {copied === cmd.example ? (
                    <Check size={15} className="text-success" />
                  ) : (
                    <Copy size={15} className="text-muted-foreground group-active:text-foreground" />
                  )}
                </button>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{cmd.explanation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Try in Terminal floating CTA */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-background via-background/90 to-transparent px-5 pb-5 pt-10">
        <button
          type="button"
          onClick={() => openTerminalWith(mod.starterCommand)}
          className="pointer-events-auto flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 font-bold text-primary-foreground shadow-[0_8px_30px_-6px_rgba(34,211,238,0.5)] active:scale-95"
        >
          <Terminal size={18} />
          Try in Terminal
        </button>
      </div>
    </div>
  )
}
