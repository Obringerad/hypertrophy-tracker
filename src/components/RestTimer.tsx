import { useEffect, useRef, useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

const PRESETS = [60, 90, 120, 180]
const LAST_DURATION_KEY = 'hypertrophy.lastRestSeconds'

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

interface Props {
  /** Bump this (e.g. after logging a set) to auto-start a countdown using the last-used duration. */
  autoStartSignal?: number
}

export function RestTimer({ autoStartSignal }: Props) {
  const [lastDuration, setLastDuration] = useLocalStorage(LAST_DURATION_KEY, 90)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const startedForSignal = useRef(autoStartSignal)

  function start(seconds: number) {
    setLastDuration(seconds)
    setSecondsLeft(seconds)
  }

  // Auto-start using the last-used duration whenever the caller signals a set was logged.
  // Compares against the signal value we last started for (rather than a "first render" flag)
  // so this stays correct even if effects double-fire on mount, e.g. under StrictMode.
  useEffect(() => {
    if (autoStartSignal === undefined || autoStartSignal === startedForSignal.current) return
    startedForSignal.current = autoStartSignal
    setSecondsLeft(lastDuration)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStartSignal])

  useEffect(() => {
    if (secondsLeft === null) return
    if (secondsLeft <= 0) {
      try {
        navigator.vibrate?.([200, 100, 200])
      } catch {
        // Vibration unsupported/blocked - nothing we can do about it here.
      }
      return
    }
    const id = window.setTimeout(() => setSecondsLeft((s) => (s === null ? null : s - 1)), 1000)
    return () => window.clearTimeout(id)
  }, [secondsLeft])

  if (secondsLeft === null) {
    return (
      <div className="rest-timer">
        <span className="muted">Rest timer:</span>
        {PRESETS.map((p) => (
          <button key={p} type="button" className="choice-btn rest-timer-preset" onClick={() => start(p)}>
            {formatClock(p)}
          </button>
        ))}
      </div>
    )
  }

  const done = secondsLeft === 0

  return (
    <div className={`rest-timer rest-timer-active ${done ? 'rest-timer-done' : ''}`}>
      <span className="rest-timer-clock">{formatClock(secondsLeft)}</span>
      <span className="muted">{done ? 'Rest complete' : 'resting...'}</span>
      <button type="button" className="link-btn" onClick={() => setSecondsLeft(null)}>
        {done ? 'Dismiss' : 'Cancel'}
      </button>
    </div>
  )
}
