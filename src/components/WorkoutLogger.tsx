import { useState } from 'react'
import type { Exercise, PlanDay, WorkoutSession } from '../types'
import { WorkoutHome } from './WorkoutHome'
import { ActiveWorkout } from './ActiveWorkout'
import { FreeformWorkout } from './FreeformWorkout'

interface Props {
  exercises: Exercise[]
  sessions: WorkoutSession[]
  onSave: (session: WorkoutSession) => void
  planDay?: PlanDay | null
  activePlanId?: string
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function WorkoutLogger({ exercises, sessions, onSave, planDay, activePlanId }: Props) {
  const [started, setStarted] = useState(false)
  const [recovery, setRecovery] = useState(3)
  const [date, setDate] = useState(todayIso())

  if (exercises.length === 0) {
    return <p className="muted">Add an exercise first, then come back here to log a workout.</p>
  }

  const isToday = date === todayIso()
  const effectivePlanDay = isToday ? (planDay ?? null) : null

  function finishAndReset(session: WorkoutSession) {
    onSave(session)
    setStarted(false)
    setRecovery(3)
    setDate(todayIso())
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
      onCancel={() => setStarted(false)}
    />
  ) : (
    <FreeformWorkout
      exercises={exercises}
      sessions={sessions}
      recovery={recovery}
      date={date}
      activePlanId={activePlanId}
      onFinish={finishAndReset}
      onCancel={() => setStarted(false)}
    />
  )
}
