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
  const [customOpen, setCustomOpen] = useState(false)
  const [customMinutes, setCustomMinutes] = useState('')
  const [customSeconds, setCustomSeconds] = useState('')
  const startedForSignal = useRef(autoStartSignal)

  function start(seconds: number) {
    setLastDuration(seconds)
    setSecondsLeft(seconds)
  }

  function startCustom() {
    const minutes = Number(customMinutes) || 0
    const seconds = Number(customSeconds) || 0
    const total = minutes * 60 + seconds
    if (total <= 0) return
    start(total)
    setCustomMinutes('')
    setCustomSeconds('')
    setCustomOpen(false)
  }

  // Auto-start using the last-used duration whenever the caller signals a set was logged.
  // Compares against the signal value we last started for (rather than a "first render" flag)
  // so this stays correct even if effects double-fire on mount, e.g. under StrictMode.
  // If a countdown is already running, leave it where it is instead of restarting it - logging
  // another set mid-rest shouldn't push the clock back out to the full duration.
  useEffect(() => {
    if (autoStartSignal === undefined || autoStartSignal === startedForSignal.current) return
    startedForSignal.current = autoStartSignal
    setSecondsLeft((current) => (current === null || current <= 0 ? lastDuration : current))
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
    const lastMatchesPreset = PRESETS.includes(lastDuration)
    return (
      <div className="rest-timer">
        <div className="rest-timer-row">
          <span className="muted">Rest timer:</span>
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              className={p === lastDuration ? 'choice-btn rest-timer-preset rest-timer-next' : 'choice-btn rest-timer-preset'}
              onClick={() => start(p)}
              title={p === lastDuration ? 'Auto-starts at this duration after logging a set' : undefined}
            >
              {p === lastDuration && <span className="rest-timer-next-arrow" aria-hidden="true">&#9654;</span>}
              {formatClock(p)}
            </button>
          ))}
          <div className="rest-timer-custom-wrap">
            <button
              type="button"
              className={!lastMatchesPreset ? 'choice-btn rest-timer-preset rest-timer-next' : 'choice-btn rest-timer-preset'}
              onClick={() => setCustomOpen((open) => !open)}
              title={!lastMatchesPreset ? `Auto-starts at ${formatClock(lastDuration)} after logging a set` : undefined}
            >
              {!lastMatchesPreset && <span className="rest-timer-next-arrow" aria-hidden="true">&#9654;</span>}
              Custom
            </button>
            {customOpen && (
              <div className="rest-timer-custom-popover">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="Min"
                  className="rest-timer-custom-input"
                  autoFocus
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                />
                <span className="muted">:</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={59}
                  placeholder="Sec"
                  className="rest-timer-custom-input"
                  value={customSeconds}
                  onChange={(e) => setCustomSeconds(e.target.value)}
                />
                <button type="button" className="choice-btn" onClick={startCustom}>
                  Start
                </button>
              </div>
            )}
          </div>
        </div>
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
