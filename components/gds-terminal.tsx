'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { CornerDownLeft, Delete } from 'lucide-react'
import { initEngine, runCommand } from '@/lib/gds/engine'

export type TermLine = { id: number; text: string; kind: 'command' | 'response' | 'error' | 'hint' | 'system' }

const DEFAULT_MACROS = ['AN', 'SS', 'NM1', '/', '-', 'AP', 'TKOK', 'RF', 'FXP', 'FQD', 'TTP', 'ER']

let lineId = 0
const nextId = () => ++lineId

type Props = {
  seed?: string | null
  onSeedConsumed?: () => void
  onCommand?: (command: string, output: TermLine[]) => void
  welcome?: string[]
  macros?: string[]
  className?: string
}

export function GdsTerminal({ seed, onSeedConsumed, onCommand, welcome, macros = DEFAULT_MACROS, className }: Props) {
  const [lines, setLines] = useState<TermLine[]>(
    () => (welcome ?? [
      'AMADEUS TRAINING TERMINAL v3.1',
      'TYPE A COMMAND AND PRESS RUN. EXAMPLE: AN15JULCAIDXB',
    ]).map((text) => ({ id: nextId(), text, kind: 'system' as const })),
  )
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    initEngine()
  }, [])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [lines])

  const submit = useCallback(
    (raw: string) => {
      const value = raw.trim()
      if (!value) return
      const cmdLine: TermLine = { id: nextId(), text: value.toUpperCase(), kind: 'command' }
      const output = runCommand(value).map((l) => ({ id: nextId(), ...l })) as TermLine[]
      setLines((prev) => [...prev, cmdLine, ...output])
      setInput('')
      onCommand?.(value.toUpperCase(), output)
    },
    [onCommand],
  )

  const insert = (token: string) => {
    setInput((prev) => prev + token)
    inputRef.current?.focus()
  }

  return (
    <div className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border border-primary/25 bg-term-bg ${className ?? ''}`}>
      {/* Title bar */}
      <div className="flex items-center gap-2 border-b border-primary/15 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-danger/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/80" />
        <span className="ml-2 font-mono text-[11px] tracking-wider text-term-dim">amadeus@gds — session</span>
      </div>

      {/* Output */}
      <div
        ref={scrollRef}
        className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-3 font-mono text-[13px] leading-relaxed"
        onClick={() => inputRef.current?.focus()}
      >
        {lines.map((l) => (
          <pre
            key={l.id}
            className={`whitespace-pre-wrap break-words ${
              l.kind === 'command'
                ? 'text-term-cyan'
                : l.kind === 'error'
                  ? 'text-danger'
                  : l.kind === 'hint'
                    ? 'text-term-amber'
                    : l.kind === 'system'
                      ? 'text-term-dim'
                      : 'text-term-green'
            }`}
          >
            {l.kind === 'command' ? `> ${l.text}` : l.text || '\u00A0'}
          </pre>
        ))}
      </div>

      {/* Macro toolbar */}
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto border-t border-primary/15 px-3 py-2">
        {macros.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => insert(m)}
            className="shrink-0 rounded-md border border-primary/25 bg-primary/10 px-2.5 py-1 font-mono text-xs font-semibold text-term-cyan active:scale-95"
          >
            {m}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setInput((p) => p.slice(0, -1))}
          aria-label="Backspace"
          className="ml-auto shrink-0 rounded-md border border-border bg-muted px-2.5 py-1 text-muted-foreground active:scale-95"
        >
          <Delete size={15} />
        </button>
      </div>

      {/* Input line */}
      <div className="flex items-center gap-2 border-t border-primary/15 bg-black/30 px-3 py-2.5">
        <span className="font-mono text-sm text-term-green">&gt;</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) submit(input)
          }}
          placeholder="Enter command…"
          spellCheck={false}
          autoCapitalize="characters"
          autoCorrect="off"
          autoComplete="off"
          aria-label="GDS command input"
          className="min-w-0 flex-1 bg-transparent font-mono text-sm uppercase tracking-wide text-term-green caret-term-cyan outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-term-dim"
        />
        <button
          type="button"
          onClick={() => submit(input)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground active:scale-95"
        >
          RUN
          <CornerDownLeft size={14} />
        </button>
      </div>
    </div>
  )
}
