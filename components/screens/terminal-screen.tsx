'use client'

import { useState } from 'react'
import { Target, ChevronRight, CheckCircle2, RotateCcw } from 'lucide-react'
import { GdsTerminal, type TermLine } from '@/components/gds-terminal'
import { useNav } from '@/components/navigation'

const OBJECTIVES = [
  { id: 1, label: 'Display availability CAI → DXB on 15 JUL', match: (c: string) => c.startsWith('AN') },
  { id: 2, label: 'Sell 1 seat from the availability', match: (c: string) => c.startsWith('SS') },
  { id: 3, label: 'Add a passenger name', match: (c: string) => c.startsWith('NM') },
  { id: 4, label: 'Add contact, ticketing & end the PNR', match: (c: string) => c.startsWith('ER') || c.startsWith('ET') },
]

export function TerminalScreen() {
  const { terminalSeed, consumeSeed } = useNav()
  const [done, setDone] = useState<Set<number>>(new Set())
  const [resetKey, setResetKey] = useState(0)

  const handleCommand = (command: string) => {
    setDone((prev) => {
      const next = new Set(prev)
      for (const obj of OBJECTIVES) {
        if (!next.has(obj.id) && obj.match(command)) {
          next.add(obj.id)
          break
        }
      }
      return next
    })
  }

  const completed = done.size
  const total = OBJECTIVES.length

  return (
    <div className="flex h-full flex-col">
      {/* Objective panel */}
      <div className="border-b border-border bg-card px-5 pb-4 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
            <Target size={14} />
            Scenario
          </div>
          <button
            type="button"
            onClick={() => {
              setDone(new Set())
              setResetKey((k) => k + 1)
            }}
            className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground active:scale-95"
          >
            <RotateCcw size={12} />
            Reset
          </button>
        </div>
        <h1 className="mt-2 text-pretty text-lg font-bold leading-tight">
          Issue a ticket for 1 adult passenger
        </h1>
        <div className="mt-3 space-y-1.5">
          {OBJECTIVES.map((obj) => {
            const complete = done.has(obj.id)
            return (
              <div key={obj.id} className="flex items-center gap-2 text-sm">
                {complete ? (
                  <CheckCircle2 size={16} className="shrink-0 text-success" />
                ) : (
                  <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full border border-muted-foreground/40 text-[10px] text-muted-foreground">
                    {obj.id}
                  </span>
                )}
                <span className={complete ? 'text-muted-foreground line-through' : 'text-foreground/90'}>
                  {obj.label}
                </span>
              </div>
            )
          })}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${(completed / total) * 100}%` }}
            />
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {completed}/{total}
          </span>
        </div>
      </div>

      {/* Terminal */}
      <div className="flex min-h-0 flex-1 flex-col p-4">
        <GdsTerminal
          key={resetKey}
          className="flex-1"
          seed={terminalSeed}
          onSeedConsumed={consumeSeed}
          onCommand={handleCommand}
        />
      </div>
    </div>
  )
}
