'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, Clock, CheckCircle2, XCircle, Award, Flag, AlertTriangle } from 'lucide-react'
import { GdsTerminal, type TermLine } from '@/components/gds-terminal'
import { useNav } from '@/components/navigation'

type Step = { label: string; test: RegExp; hint: string }

const STEPS: Step[] = [
  { label: 'Display availability CAI–DXB', test: /^AN\d{2}[A-Z]{3}CAIDXB/, hint: 'AN + DDMMM + CAIDXB' },
  { label: 'Sell 1 seat from availability', test: /^SS\d/, hint: 'SS1Y1' },
  { label: 'Add passenger name', test: /^NM\d/, hint: 'NM1LASTNAME/FIRST MR' },
  { label: 'Price the itinerary', test: /^FXP/, hint: 'FXP' },
  { label: 'End & save the PNR', test: /^(ER|ET)/, hint: 'ER' },
]

const EXAM_SECONDS = 300

export function AssessmentScreen({ id }: { id: string }) {
  const { closeOverlay } = useNav()
  const [entered, setEntered] = useState<string[]>([])
  const [seconds, setSeconds] = useState(EXAM_SECONDS)
  const [submitted, setSubmitted] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (submitted) return
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!)
          setSubmitted(true)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [submitted])

  const results = useMemo(
    () =>
      STEPS.map((step) => ({
        ...step,
        passed: entered.some((c) => step.test.test(c)),
      })),
    [entered],
  )

  const passedCount = results.filter((r) => r.passed).length
  const grade = Math.round((passedCount / STEPS.length) * 100)
  const timeUsed = EXAM_SECONDS - seconds

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  const lowTime = seconds <= 30

  if (submitted) {
    return (
      <ResultView
        grade={grade}
        results={results}
        timeUsed={timeUsed}
        onRetry={() => {
          setEntered([])
          setSeconds(EXAM_SECONDS)
          setSubmitted(false)
        }}
        onExit={closeOverlay}
      />
    )
  }

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border bg-card px-5 pb-4 pt-5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={closeOverlay}
            className="flex items-center gap-1 text-sm text-muted-foreground active:scale-95"
          >
            <ChevronLeft size={18} />
            Exit
          </button>
          <div
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-sm font-bold tabular-nums ${
              lowTime
                ? 'animate-pulse border-danger/40 bg-danger/10 text-danger'
                : 'border-primary/30 bg-primary/10 text-primary'
            }`}
          >
            <Clock size={14} />
            {mm}:{ss}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-warning">
          <Flag size={13} />
          Practical Exam
        </div>
        <h1 className="mt-1.5 text-pretty text-lg font-bold leading-tight">
          Book & price a 1-adult trip: Cairo to Dubai, 15 July
        </h1>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${(passedCount / STEPS.length) * 100}%` }}
            />
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {passedCount}/{STEPS.length}
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        {/* Live validator chips */}
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {results.map((r, i) => (
            <span
              key={i}
              className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${
                r.passed
                  ? 'border-success/40 bg-success/10 text-success'
                  : 'border-border bg-muted text-muted-foreground'
              }`}
            >
              {r.passed ? <CheckCircle2 size={12} /> : <span className="font-mono">{i + 1}</span>}
              {r.label.split(' ').slice(0, 2).join(' ')}
            </span>
          ))}
        </div>

        <GdsTerminal
          className="flex-1"
          welcome={['AMADEUS CERTIFICATION EXAM — LIVE VALIDATION ACTIVE', 'COMPLETE ALL OBJECTIVES BEFORE THE TIMER EXPIRES.']}
          onCommand={(command: string) => setEntered((prev) => [...prev, command])}
        />

        <button
          type="button"
          onClick={() => setSubmitted(true)}
          className="rounded-xl bg-primary py-3.5 font-bold text-primary-foreground active:scale-[0.98]"
        >
          Submit Exam
        </button>
      </div>
    </div>
  )
}

function ResultView({
  grade,
  results,
  timeUsed,
  onRetry,
  onExit,
}: {
  grade: number
  results: (Step & { passed: boolean })[]
  timeUsed: number
  onRetry: () => void
  onExit: () => void
}) {
  const passed = grade >= 80
  const mm = String(Math.floor(timeUsed / 60)).padStart(2, '0')
  const ss = String(timeUsed % 60).padStart(2, '0')
  const errors = results.filter((r) => !r.passed)

  return (
    <div className="no-scrollbar h-full overflow-y-auto px-5 pb-10 pt-8">
      <div className="flex flex-col items-center text-center">
        <div
          className={`grid h-24 w-24 place-items-center rounded-full border-4 ${
            passed ? 'border-success/40 bg-success/10 text-success' : 'border-warning/40 bg-warning/10 text-warning'
          }`}
        >
          <Award size={40} />
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {passed ? 'Certification Passed' : 'Keep Practising'}
        </p>
        <div className="mt-1 font-mono text-5xl font-bold">
          {grade}
          <span className="text-2xl text-muted-foreground">%</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Completed in {mm}:{ss} · {results.filter((r) => r.passed).length}/{results.length} objectives
        </p>
      </div>

      {/* Parser feedback */}
      <h2 className="mb-2 mt-8 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        System Parsing Report
      </h2>
      <div className="space-y-2">
        {results.map((r, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3"
          >
            {r.passed ? (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success" />
            ) : (
              <XCircle size={18} className="mt-0.5 shrink-0 text-danger" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium">{r.label}</p>
              {!r.passed && (
                <p className="mt-0.5 font-mono text-xs text-danger">
                  ERR: entry not detected · expected format {r.hint}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {errors.length > 0 && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <p>
            {errors.length} objective{errors.length > 1 ? 's' : ''} failed validation. Review the command reference
            and retry the scenario.
          </p>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onExit}
          className="flex-1 rounded-xl border border-border py-3 font-semibold text-foreground active:scale-[0.98]"
        >
          Done
        </button>
        <button
          type="button"
          onClick={onRetry}
          className="flex-1 rounded-xl bg-primary py-3 font-bold text-primary-foreground active:scale-[0.98]"
        >
          Retry Exam
        </button>
      </div>
    </div>
  )
}
