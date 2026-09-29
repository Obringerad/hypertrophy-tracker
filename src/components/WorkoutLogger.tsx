import { useState } from 'react'
import type { Exercise, LoggedExercise, WorkoutPlan, WorkoutSession } from '../types'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { resolveTodaysPlanDay } from '../lib/planEngine'
import { WorkoutHome } from './WorkoutHome'
import { ActiveWorkout, type QueueItem } from './ActiveWorkout'
import { FreeformWorkout } from './FreeformWorkout'
import { ConfirmDialog } from './ConfirmDialog'

interface Props {
  exercises: Exercise[]
  sessions: WorkoutSession[]
  onSave: (session: WorkoutSession) => void
  plan?: WorkoutPlan | null
  activePlanId?: string
  onShowPlates?: (weight: number) => void
}

interface WorkoutDraft {
  date: string
  recovery: number
  notes: string
  logged: LoggedExercise[]
  /** When this workout was started, so a finished session's duration survives a backgrounded/reloaded tab. */
  startedAt?: number
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

export function WorkoutLogger({ exercises, sessions, onSave, plan, activePlanId, onShowPlates }: Props) {
  const [draft, setDraft] = useLocalStorage<WorkoutDraft | null>(DRAFT_KEY, null)
  const [started, setStarted] = useState(() => draft !== null)
  const [recovery, setRecovery] = useState(() => draft?.recovery ?? 3)
  const [date, setDate] = useState(() => draft?.date ?? todayIso())
  const [startedAt, setStartedAt] = useState<number | undefined>(() => draft?.startedAt)
  const [repeatExerciseId, setRepeatExerciseId] = useState<string | undefined>(undefined)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  /** Overrides which of the plan's days today's workout uses, when the user swaps away from the
   * one the schedule/rotation would normally pick (e.g. doing Legs instead of today's Pull). */
  const [selectedDayId, setSelectedDayId] = useState<string | undefined>(() => draft?.planDayId)

  if (exercises.length === 0) {
    return <p className="muted">Add an exercise first, then come back here to log a workout.</p>
  }

  const isToday = date === todayIso()
  const scheduledPlanDay = plan ? resolveTodaysPlanDay(plan) : null
  const selectedDay = selectedDayId ? plan?.days.find((d) => d.id === selectedDayId) : undefined
  const effectivePlanDay = isToday ? (selectedDay ?? scheduledPlanDay) : null

  function start() {
    setStartedAt(Date.now())
    setStarted(true)
  }

  function startRepeatLast() {
    const lastSession = sessions.slice().sort((a, b) => b.date.localeCompare(a.date))[0]
    setRepeatExerciseId(lastSession?.exercises[0]?.exerciseId)
    setStartedAt(Date.now())
    setStarted(true)
  }

  function finishAndReset(session: WorkoutSession) {
    const durationMinutes = startedAt ? Math.max(1, Math.round((Date.now() - startedAt) / 60_000)) : undefined
    clearDraftImmediately()
    onSave({ ...session, durationMinutes })
    setStarted(false)
    setStartedAt(undefined)
    setRepeatExerciseId(undefined)
    setRecovery(3)
    setDate(todayIso())
    setSelectedDayId(undefined)
    setDraft(null)
  }

  function performCancelWorkout() {
    clearDraftImmediately()
    setStarted(false)
    setStartedAt(undefined)
    setRepeatExerciseId(undefined)
    setSelectedDayId(undefined)
    setDraft(null)
  }

  function cancelWorkout() {
    const hasLoggedSets = (draft?.logged.length ?? 0) > 0
    if (hasLoggedSets) {
      setConfirmingCancel(true)
      return
    }
    performCancelWorkout()
  }

  const confirmDialog = (
    <ConfirmDialog
      open={confirmingCancel}
      message="Discard this workout? All logged sets will be lost."
      confirmLabel="Discard"
      onConfirm={() => {
        setConfirmingCancel(false)
        performCancelWorkout()
      }}
      onCancel={() => setConfirmingCancel(false)}
    />
  )

  if (!started) {
    return (
      <WorkoutHome
        planDay={effectivePlanDay}
        plan={plan}
        onSelectDay={setSelectedDayId}
        hasActivePlan={activePlanId !== undefined}
        recovery={recovery}
        onRecoveryChange={setRecovery}
        onStart={start}
        onRepeatLast={!effectivePlanDay && sessions.length > 0 ? startRepeatLast : undefined}
        date={date}
        onDateChange={setDate}
        isToday={isToday}
      />
    )
  }

  return effectivePlanDay ? (
    <>
    <ActiveWorkout
      planDay={effectivePlanDay}
      exercises={exercises}
      sessions={sessions}
      recovery={recovery}
      date={date}
      activePlanId={activePlanId}
      onFinish={finishAndReset}
      onCancel={cancelWorkout}
      onShowPlates={onShowPlates}
      initialProgress={
        draft ? { queue: draft.queue, stepIndex: draft.stepIndex, logged: draft.logged, notes: draft.notes } : undefined
      }
      onProgressChange={(progress) =>
        setDraft({
          date,
          recovery,
          startedAt,
          notes: progress.notes,
          logged: progress.logged,
          planDayId: effectivePlanDay.id,
          queue: progress.queue,
          stepIndex: progress.stepIndex,
        })
      }
    />
    {confirmDialog}
    </>
  ) : (
    <>
    <FreeformWorkout
      exercises={exercises}
      sessions={sessions}
      recovery={recovery}
      date={date}
      activePlanId={activePlanId}
      onFinish={finishAndReset}
      onCancel={cancelWorkout}
      onShowPlates={onShowPlates}
      initialProgress={
        draft
          ? { logged: draft.logged, notes: draft.notes, activeExerciseId: draft.activeExerciseId ?? exercises[0]?.id ?? '' }
          : { logged: [], notes: '', activeExerciseId: repeatExerciseId ?? exercises[0]?.id ?? '' }
      }
      onProgressChange={(progress) =>
        setDraft({ date, recovery, startedAt, notes: progress.notes, logged: progress.logged, activeExerciseId: progress.activeExerciseId })
      }
    />
    {confirmDialog}
    </>
  )
}
