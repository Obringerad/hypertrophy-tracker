import { useState } from 'react'
import type { Exercise, LoggedExercise, PlanDay, WorkoutSession } from '../types'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { WorkoutHome } from './WorkoutHome'
import { ActiveWorkout, type QueueItem } from './ActiveWorkout'
import { FreeformWorkout } from './FreeformWorkout'

interface Props {
  exercises: Exercise[]
  sessions: WorkoutSession[]
  onSave: (session: WorkoutSession) => void
  planDay?: PlanDay | null
  activePlanId?: string
}

interface WorkoutDraft {
  date: string
  recovery: number
  notes: string
  logged: LoggedExercise[]
  /** Present only when the draft was started as a guided (plan-based) workout. */
  planDayId?: string
  queue?: QueueItem[]
  stepIndex?: number
  /** Present only when the draft was started as a freeform workout. */
  activeExerciseId?: string
}

const DRAFT_KEY = 'hypertrophy.workoutDraft'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Clears the draft directly, bypassing React state. Finishing a workout also triggers a
 * parent-level tab change (App navigates to Plans/Home), which can unmount this component in
 * the same batch before its own `setDraft(null)` gets a chance to commit and run its
 * localStorage-writing effect - so the state setter alone isn't reliable here.
 */
function clearDraftImmediately() {
  try {
    window.localStorage.removeItem(DRAFT_KEY)
  } catch {
    // Storage unavailable - nothing we can do about it here.
  }
}

export function WorkoutLogger({ exercises, sessions, onSave, planDay, activePlanId }: Props) {
  const [draft, setDraft] = useLocalStorage<WorkoutDraft | null>(DRAFT_KEY, null)
  const [started, setStarted] = useState(() => draft !== null)
  const [recovery, setRecovery] = useState(() => draft?.recovery ?? 3)
  const [date, setDate] = useState(() => draft?.date ?? todayIso())

  if (exercises.length === 0) {
    return <p className="muted">Add an exercise first, then come back here to log a workout.</p>
  }

  const isToday = date === todayIso()
  const effectivePlanDay = isToday ? (planDay ?? null) : null

  function finishAndReset(session: WorkoutSession) {
    clearDraftImmediately()
    onSave(session)
    setStarted(false)
    setRecovery(3)
    setDate(todayIso())
    setDraft(null)
  }

  function cancelWorkout() {
    clearDraftImmediately()
    setStarted(false)
    setDraft(null)
  }

  if (!started) {
    return (
      <WorkoutHome
        planDay={effectivePlanDay}
        hasActivePlan={activePlanId !== undefined}
        recovery={recovery}
        onRecoveryChange={setRecovery}
        onStart={() => setStarted(true)}
        date={date}
        onDateChange={setDate}
        isToday={isToday}
      />
    )
  }

  return effectivePlanDay ? (
    <ActiveWorkout
      planDay={effectivePlanDay}
      exercises={exercises}
      sessions={sessions}
      recovery={recovery}
      date={date}
      activePlanId={activePlanId}
      onFinish={finishAndReset}
      onCancel={cancelWorkout}
      initialProgress={
        draft ? { queue: draft.queue, stepIndex: draft.stepIndex, logged: draft.logged, notes: draft.notes } : undefined
      }
      onProgressChange={(progress) =>
        setDraft({ date, recovery, notes: progress.notes, logged: progress.logged, planDayId: effectivePlanDay.id, queue: progress.queue, stepIndex: progress.stepIndex })
      }
    />
  ) : (
    <FreeformWorkout
      exercises={exercises}
      sessions={sessions}
      recovery={recovery}
      date={date}
      activePlanId={activePlanId}
      onFinish={finishAndReset}
      onCancel={cancelWorkout}
      initialProgress={
        draft
          ? { logged: draft.logged, notes: draft.notes, activeExerciseId: draft.activeExerciseId ?? exercises[0]?.id ?? '' }
          : undefined
      }
      onProgressChange={(progress) =>
        setDraft({ date, recovery, notes: progress.notes, logged: progress.logged, activeExerciseId: progress.activeExerciseId })
      }
    />
  )
}
