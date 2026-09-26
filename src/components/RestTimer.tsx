import { useEffect, useState } from 'react'

const PRESETS = [60, 90, 120, 180]

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function RestTimer() {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)

  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return
    const id = window.setTimeout(() => setSecondsLeft((s) => (s === null ? null : s - 1)), 1000)
    return () => window.clearTimeout(id)
  }, [secondsLeft])

  if (secondsLeft === null) {
    return (
      <div className="rest-timer">
        <span className="muted">Rest timer:</span>
        {PRESETS.map((p) => (
          <button key={p} type="button" className="choice-btn rest-timer-preset" onClick={() => setSecondsLeft(p)}>
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
