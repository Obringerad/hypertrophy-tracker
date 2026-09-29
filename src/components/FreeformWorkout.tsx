import { useEffect, useMemo, useState } from 'react'
import type { Exercise, LoggedExercise, SetEntry, WorkoutSession } from '../types'
import { suggestNextSession } from '../lib/progression'
import { maxWeightEver } from '../lib/records'
import { formatWeight } from '../lib/units'
import { useSettings } from '../context/SettingsContext'
import { SuggestionCard } from './SuggestionCard'
import { RestTimer } from './RestTimer'
import { NumberStepper } from './NumberStepper'
import { LastTimeSets } from './LastTimeSets'

export interface FreeformWorkoutProgress {
  logged: LoggedExercise[]
  notes: string
  activeExerciseId: string
}

interface Props {
  exercises: Exercise[]
  sessions: WorkoutSession[]
  recovery: number
  date: string
  activePlanId?: string
  onFinish: (session: WorkoutSession) => void
  onCancel: () => void
  initialProgress?: FreeformWorkoutProgress
  onProgressChange: (progress: FreeformWorkoutProgress) => void
  onShowPlates?: (weight: number) => void
}

/** Exercise ids in most-recently-logged order, deduped, oldest history first is skipped. */
function recentExerciseIds(sessions: WorkoutSession[], limit: number): string[] {
  const sorted = sessions.slice().sort((a, b) => b.date.localeCompare(a.date))
  const seen = new Set<string>()
  const result: string[] = []
  for (const s of sorted) {
    for (const log of s.exercises) {
      if (!seen.has(log.exerciseId)) {
        seen.add(log.exerciseId)
        result.push(log.exerciseId)
        if (result.length >= limit) return result
      }
    }
  }
  return result
}

export function FreeformWorkout({
  exercises,
  sessions,
  recovery,
  date,
  activePlanId,
  onFinish,
  onCancel,
  initialProgress,
  onProgressChange,
  onShowPlates,
}: Props) {
  const { weightUnit } = useSettings()
  const [logged, setLogged] = useState<LoggedExercise[]>(() => initialProgress?.logged ?? [])
  const [activeExerciseId, setActiveExerciseId] = useState(
    () => initialProgress?.activeExerciseId ?? exercises[0]?.id ?? '',
  )
  const [setForm, setSetForm] = useState({ weight: 0, reps: 0, rpe: 8 })
  const [exerciseFilter, setExerciseFilter] = useState('')
  const [notes, setNotes] = useState(() => initialProgress?.notes ?? '')
  const [restSignal, setRestSignal] = useState(0)

  // Persist progress on every change so a backgrounded/reloaded tab can resume mid-workout.
  useEffect(() => {
    onProgressChange({ logged, notes, activeExerciseId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logged, notes, activeExerciseId])

  const activeExercise = exercises.find((e) => e.id === activeExerciseId)
  const suggestion = useMemo(
    () => (activeExercise ? suggestNextSession(activeExercise, sessions, weightUnit) : null),
    [activeExercise, sessions, weightUnit],
  )
  // Prefill weight/reps from the suggestion (i.e. what you did last time) whenever the active exercise changes.
  useEffect(() => {
    if (suggestion) {
      setSetForm({ weight: suggestion.suggestedWeight, reps: suggestion.suggestedReps, rpe: 8 })
    } else {
      setSetForm({ weight: 0, reps: 0, rpe: 8 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeExerciseId])

  const activeLog = logged.find((l) => l.exerciseId === activeExerciseId)
  const priorBest = maxWeightEver(sessions, activeExerciseId, weightUnit)

  const filteredExercises = exercises.filter((e) => e.name.toLowerCase().includes(exerciseFilter.toLowerCase()))
  const recentIds = useMemo(() => recentExerciseIds(sessions, 6), [sessions])

  function selectExercise(id: string) {
    setActiveExerciseId(id)
  }

  function addSet() {
    if (!activeExerciseId || setForm.reps <= 0) return
    setLogged((prev) => {
      const existing = prev.find((l) => l.exerciseId === activeExerciseId)
      const newSet: SetEntry = { ...setForm }
      if (existing) {
        return prev.map((l) => (l.exerciseId === activeExerciseId ? { ...l, sets: [...l.sets, newSet] } : l))
      }
      return [...prev, { exerciseId: activeExerciseId, sets: [newSet] }]
    })
    setRestSignal((n) => n + 1)
  }

  function removeSet(exerciseId: string, index: number) {
    setLogged((prev) =>
      prev
        .map((l) => (l.exerciseId === exerciseId ? { ...l, sets: l.sets.filter((_, i) => i !== index) } : l))
        .filter((l) => l.sets.length > 0),
    )
  }

  function finish() {
    if (logged.length === 0) return
    onFinish({
      id: crypto.randomUUID(),
      date,
      recovery,
      exercises: logged,
      notes: notes.trim() || undefined,
      planId: activePlanId,
      unit: weightUnit,
    })
  }

  return (
    <div className="panel">
      <div className="workout-sticky-header">
        <h2>Freeform Workout</h2>
        {recentIds.length > 0 && (
          <div className="recent-exercise-chips">
            {recentIds.map((id) => {
              const ex = exercises.find((e) => e.id === id)
              if (!ex) return null
              return (
                <button
                  key={id}
                  type="button"
                  className={id === activeExerciseId ? 'choice-btn recent-exercise-chip active' : 'choice-btn recent-exercise-chip'}
                  onClick={() => selectExercise(id)}
                >
                  {ex.name}
                </button>
              )
            })}
          </div>
        )}
        <div className="exercise-picker freeform-exercise-picker">
          <input
            type="text"
            placeholder="Filter exercises..."
            value={exerciseFilter}
            onChange={(e) => setExerciseFilter(e.target.value)}
          />
          <select
            value={filteredExercises.some((e) => e.id === activeExerciseId) ? activeExerciseId : ''}
            onChange={(e) => selectExercise(e.target.value)}
          >
            {!filteredExercises.some((e) => e.id === activeExerciseId) && (
              <option value="" disabled>
                Select an exercise
              </option>
            )}
            {filteredExercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>

        {suggestion && <SuggestionCard suggestion={suggestion} onShowPlates={onShowPlates} />}
        {activeExerciseId && <LastTimeSets sessions={sessions} exerciseId={activeExerciseId} targetUnit={weightUnit} />}
      </div>

      <RestTimer autoStartSignal={restSignal} />

      <div className="set-form">
        <label>
          Weight
          <NumberStepper
            value={setForm.weight}
            step={activeExercise?.weightIncrement ?? 2.5}
            min={0}
            onChange={(weight) => setSetForm({ ...setForm, weight })}
          />
        </label>
        <label>
          Reps
          <NumberStepper
            value={setForm.reps}
            step={1}
            min={0}
            inputMode="numeric"
            onChange={(reps) => setSetForm({ ...setForm, reps })}
          />
        </label>
        <label>
          RPE
          <NumberStepper
            value={setForm.rpe}
            step={1}
            min={1}
            max={10}
            inputMode="numeric"
            onChange={(rpe) => setSetForm({ ...setForm, rpe })}
          />
        </label>
        <button type="button" onClick={addSet}>
          Add Set
        </button>
      </div>

      {activeLog && activeLog.sets.length > 0 && (
        <table className="set-table">
          <thead>
            <tr>
              <th>Set</th>
              <th>Weight</th>
              <th>Reps</th>
              <th>RPE</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {activeLog.sets.map((s, i) => (
              <tr
                key={i}
                className={s.weight > priorBest ? 'set-table-logged-row set-table-logged-row-pr' : 'set-table-logged-row'}
              >
                <td>
                  <span className="set-logged-check">&#10003;</span> {i + 1}
                </td>
                <td>
                  {formatWeight(s.weight, weightUnit)}
                  {s.weight > priorBest && <span className="pr-badge">PR</span>}
                </td>
                <td>{s.reps}</td>
                <td>{s.rpe}</td>
                <td>
                  <button className="link-btn" onClick={() => removeSet(activeExerciseId, i)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <label className="session-notes-field">
        Notes (Optional)
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How did it feel? Anything to remember for next time?"
          rows={3}
        />
      </label>

      <div className="session-summary">
        <p className="meta-text">
          {logged.length} exercise{logged.length === 1 ? '' : 's'} logged this session.
        </p>
        <div className="wizard-actions">
          <button type="button" className="link-btn-danger" onClick={onCancel}>
            Cancel Workout
          </button>
          <button type="button" className="primary" onClick={finish} disabled={logged.length === 0}>
            Finish Workout
          </button>
        </div>
      </div>
    </div>
  )
}
