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
  /** "ring" shows the countdown as a large progress ring with the presets underneath. */
  variant?: 'box' | 'ring'
}

const RING_RADIUS = 44
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

export function RestTimer({ autoStartSignal, variant = 'box' }: Props) {
  const [lastDuration, setLastDuration] = useLocalStorage(LAST_DURATION_KEY, 90)
  // The countdown is driven by a real end timestamp rather than a decrementing counter - a plain
  // tick-based counter drifts (or stalls entirely) once the interval below gets throttled or paused,
  // which mobile browsers do aggressively while the screen is locked or the tab is backgrounded.
  // Deriving the remaining time from `endAt` means it's always correct the instant it's recomputed,
  // no matter how long ticks were paused for.
  const [endAt, setEndAt] = useState<number | null>(null)
  const [duration, setDuration] = useState(lastDuration)
  const [nowTick, setNowTick] = useState(() => Date.now())
  const [customOpen, setCustomOpen] = useState(false)
  const [customMinutes, setCustomMinutes] = useState('')
  const [customSeconds, setCustomSeconds] = useState('')
  const startedForSignal = useRef(autoStartSignal)
  const alertedForEndAt = useRef<number | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const secondsLeft = endAt === null ? null : Math.max(0, Math.ceil((endAt - nowTick) / 1000))

  // Vibration only fires reliably when triggered directly by a user tap - by the time a countdown
  // reaches zero, the browser no longer treats it as one, so most phones silently ignore it. A short
  // tone is the reliable cross-device alert instead. Its AudioContext has the same restriction, so it
  // has to be created/resumed here, at countdown-start time (still close enough to a real tap to
  // count), then just reused - already unlocked - whenever the countdown actually finishes later.
  function primeAlertSound() {
    try {
      if (!audioCtxRef.current) {
        const AudioContextCtor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!AudioContextCtor) return
        audioCtxRef.current = new AudioContextCtor()
      }
      if (audioCtxRef.current.state === 'suspended') {
        void audioCtxRef.current.resume()
      }
    } catch {
      // Web Audio unsupported/blocked - nothing we can do about it here.
    }
  }

  function playAlertSound() {
    const ctx = audioCtxRef.current
    if (!ctx) return
    try {
      const beep = (startTime: number) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = 880
        gain.gain.setValueAtTime(0.0001, startTime)
        gain.gain.exponentialRampToValueAtTime(0.35, startTime + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.28)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(startTime)
        osc.stop(startTime + 0.3)
      }
      beep(ctx.currentTime)
      beep(ctx.currentTime + 0.35)
    } catch {
      // Playback failed - nothing we can do about it here.
    }
  }

  function start(seconds: number) {
    primeAlertSound()
    setLastDuration(seconds)
    setDuration(seconds)
    setEndAt(Date.now() + seconds * 1000)
    setNowTick(Date.now())
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
  // so this stays correct even if effects double-fire on mount, e.g. under StrictMode. Always
  // restarts fresh, even if a countdown from the previous set is still running - logging a set
  // before the prior rest finished means resting again from right now, not just watching out the
  // old clock, which otherwise made the timer look like it hadn't started at all.
  useEffect(() => {
    if (autoStartSignal === undefined || autoStartSignal === startedForSignal.current) return
    startedForSignal.current = autoStartSignal
    primeAlertSound()
    const now = Date.now()
    setDuration(lastDuration)
    setEndAt(now + lastDuration * 1000)
    setNowTick(now)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStartSignal])

  // Keeps the displayed countdown live, and - critically - snaps it back in sync the instant the tab
  // regains focus, so a countdown that finished while the screen was locked shows "Rest complete" (and
  // fires the alert) right away instead of whenever the throttled interval next happens to fire.
  useEffect(() => {
    if (endAt === null) return
    function tick() {
      setNowTick(Date.now())
    }
    const id = window.setInterval(tick, 1000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [endAt])

  useEffect(() => {
    if (endAt === null || secondsLeft === null || secondsLeft > 0) return
    if (alertedForEndAt.current === endAt) return
    alertedForEndAt.current = endAt
    try {
      navigator.vibrate?.([200, 100, 200])
    } catch {
      // Vibration unsupported/blocked - nothing we can do about it here.
    }
    playAlertSound()
  }, [endAt, secondsLeft])

  const lastMatchesPreset = PRESETS.includes(lastDuration)
  const presetControls = (
    <>
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
    </>
  )

  if (variant === 'ring') {
    const done = secondsLeft === 0
    const fraction = secondsLeft === null ? 0 : Math.min(1, secondsLeft / Math.max(1, duration))
    return (
      <div className="rest-ring-wrap">
        <div className={done ? 'rest-ring rest-ring-done' : 'rest-ring'}>
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle className="rest-ring-track" cx="50" cy="50" r={RING_RADIUS} />
            <circle
              className="rest-ring-progress"
              cx="50"
              cy="50"
              r={RING_RADIUS}
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={RING_CIRCUMFERENCE * (1 - fraction)}
            />
          </svg>
          <div className="rest-ring-label">
            <span className="rest-ring-time">{formatClock(secondsLeft ?? lastDuration)}</span>
            <span className="muted">{secondsLeft === null ? 'rest' : done ? 'done' : 'resting'}</span>
          </div>
        </div>
        {secondsLeft !== null && (
          <button type="button" className="link-btn rest-ring-cancel" onClick={() => setEndAt(null)}>
            {done ? 'Dismiss' : 'Cancel'}
          </button>
        )}
        <div className="rest-timer-row rest-ring-presets">
          {presetControls}
        </div>
      </div>
    )
  }

  if (secondsLeft === null) {
    return (
      <div className="rest-timer">
        <div className="rest-timer-row">
          <span className="muted">Rest timer:</span>
          {presetControls}
        </div>
      </div>
    )
  }

  const done = secondsLeft === 0

  return (
    <div className={`rest-timer rest-timer-active ${done ? 'rest-timer-done' : ''}`}>
      <span className="rest-timer-clock">{formatClock(secondsLeft)}</span>
      <span className="muted">{done ? 'Rest complete' : 'resting...'}</span>
      <button type="button" className="link-btn" onClick={() => setEndAt(null)}>
        {done ? 'Dismiss' : 'Cancel'}
      </button>
    </div>
  )
}
