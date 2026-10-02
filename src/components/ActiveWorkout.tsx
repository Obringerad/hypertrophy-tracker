import { useEffect, useMemo, useState } from 'react'
import type { Exercise, LoggedExercise, PlanDay, SetEntry, WorkoutSession } from '../types'
import { suggestNextSession } from '../lib/progression'
import { maxWeightEver, isFirstAtWeightAndReps } from '../lib/records'
import { formatWeight, type WeightUnit } from '../lib/units'
import { SuggestionCard } from './SuggestionCard'
import { RestTimer } from './RestTimer'
import { NumberStepper } from './NumberStepper'
import { LastTimeSets } from './LastTimeSets'
import { useSettings } from '../context/SettingsContext'

export interface QueueItem {
  exerciseId: string
  setNumber: number
  targetSets: number
}

export interface ActiveWorkoutProgress {
  queue: QueueItem[]
  stepIndex: number
  logged: LoggedExercise[]
  notes: string
}

interface Props {
  planDay: PlanDay
  exercises: Exercise[]
  sessions: WorkoutSession[]
  recovery: number
  date: string
  /** Pinned to whatever was active when this workout started, not the live setting - so switching
   * units in Settings mid-workout can't mislabel sets already logged under a different one. */
  weightUnit: WeightUnit
  activePlanId?: string
  onFinish: (session: WorkoutSession) => void
  onCancel: () => void
  /** Queue/stepIndex are omitted when there's no compatible resumable queue to restore. */
  initialProgress?: Partial<Pick<ActiveWorkoutProgress, 'queue' | 'stepIndex'>> &
    Pick<ActiveWorkoutProgress, 'logged' | 'notes'>
  onProgressChange: (progress: ActiveWorkoutProgress) => void
  onShowPlates?: (weight: number) => void
}

function buildQueue(planDay: PlanDay): QueueItem[] {
  const queue: QueueItem[] = []
  for (const pe of planDay.exercises) {
    for (let i = 1; i <= pe.targetSets; i++) {
      queue.push({ exerciseId: pe.exerciseId, setNumber: i, targetSets: pe.targetSets })
    }
  }
  return queue
}

export function ActiveWorkout({
  planDay,
  exercises,
  sessions,
  recovery,
  date,
  weightUnit,
  activePlanId,
  onFinish,
  onCancel,
  initialProgress,
  onProgressChange,
  onShowPlates,
}: Props) {
  const { restTimerAutoStart } = useSettings()
  const [queue, setQueue] = useState<QueueItem[]>(() => initialProgress?.queue ?? buildQueue(planDay))
  const [stepIndex, setStepIndex] = useState(() => initialProgress?.stepIndex ?? 0)
  const [logged, setLogged] = useState<LoggedExercise[]>(() => initialProgress?.logged ?? [])
  const [form, setForm] = useState({ weight: 0, reps: 0, rpe: 8 })
  const [notes, setNotes] = useState(() => initialProgress?.notes ?? '')
  const [notesOpen, setNotesOpen] = useState(() => !!initialProgress?.notes)
  const [restSignal, setRestSignal] = useState(0)

  // Persist progress on every change so a backgrounded/reloaded tab can resume mid-workout.
  useEffect(() => {
    onProgressChange({ queue, stepIndex, logged, notes })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue, stepIndex, logged, notes])

  const current = queue[stepIndex]
  const currentExercise = current ? exercises.find((e) => e.id === current.exerciseId) : undefined
  const suggestion = useMemo(
    () => (currentExercise ? suggestNextSession(currentExercise, sessions, weightUnit) : null),
    [currentExercise, sessions, weightUnit],
  )

  // Prefill weight/reps from the suggestion whenever a new exercise starts.
  useEffect(() => {
    if (suggestion) {
      setForm({ weight: suggestion.suggestedWeight, reps: suggestion.suggestedReps, rpe: 8 })
    } else {
      setForm({ weight: currentExercise?.startingWeight ?? 0, reps: 0, rpe: 8 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.exerciseId])

  function logSet() {
    if (!current) return
    const isLastSetOfExercise = current.setNumber >= current.targetSets
    const exerciseNumberForCurrent = planDay.exercises.findIndex((pe) => pe.exerciseId === current.exerciseId) + 1
    const isLastExerciseForCurrent = exerciseNumberForCurrent >= planDay.exercises.length
    setLogged((prev) => {
      const existing = prev.find((l) => l.exerciseId === current.exerciseId)
      const newSet: SetEntry = { ...form }
      if (existing) {
        return prev.map((l) => (l.exerciseId === current.exerciseId ? { ...l, sets: [...l.sets, newSet] } : l))
      }
      return [...prev, { exerciseId: current.exerciseId, sets: [newSet] }]
    })
    // Logging the last set of an exercise (that isn't the workout's last) doesn't advance the
    // queue on its own - it waits for an explicit "Start Next Exercise" click, so moving on takes
    // a deliberate second tap instead of being one click away from skipping the set entirely.
    if (!(isLastSetOfExercise && !isLastExerciseForCurrent)) {
      setStepIndex((i) => i + 1)
    }
    // Only auto-start the rest timer between sets of the same exercise, and only when the setting
    // is on - finishing an exercise (or the whole workout) moves on to something else, not a rest
    // interval to count down on its own. A countdown that's already running (started manually, or
    // from a prior set) is left alone either way - moving between sets or exercises isn't a reason
    // to cut a rest period short.
    if (!isLastSetOfExercise && restTimerAutoStart) {
      setRestSignal((n) => n + 1)
    }
  }

  function advanceToNextExercise() {
    setStepIndex((i) => i + 1)
  }

  function skipRestOfExercise() {
    if (!current) return
    const nextIndex = queue.findIndex((q, i) => i > stepIndex && q.exerciseId !== current.exerciseId)
    setStepIndex(nextIndex === -1 ? queue.length : nextIndex)
  }

  /** Steps back one set at a time, including into a prior exercise - for undoing a misclick like
   * an accidental skip or a bad log. If the set being stepped back onto was already logged, that
   * log is removed too, so it's ready to be redone rather than left as a stale duplicate. */
  function goToPreviousStep() {
    if (stepIndex === 0) return
    const newIndex = stepIndex - 1
    const target = queue[newIndex]
    setLogged((prev) => {
      const entry = prev.find((l) => l.exerciseId === target.exerciseId)
      if (!entry || entry.sets.length < target.setNumber) return prev
      const trimmedSets = entry.sets.slice(0, target.setNumber - 1)
      if (trimmedSets.length === 0) return prev.filter((l) => l.exerciseId !== target.exerciseId)
      return prev.map((l) => (l.exerciseId === target.exerciseId ? { ...l, sets: trimmedSets } : l))
    })
    setStepIndex(newIndex)
  }

  function addPlannedSet() {
    if (!current) return
    const exerciseId = current.exerciseId
    setQueue((prev) => {
      const lastIdx = prev.map((q) => q.exerciseId).lastIndexOf(exerciseId)
      const newTotal = prev.filter((q) => q.exerciseId === exerciseId).length + 1
      const updated = prev.map((q) => (q.exerciseId === exerciseId ? { ...q, targetSets: newTotal } : q))
      const newItem: QueueItem = { exerciseId, setNumber: newTotal, targetSets: newTotal }
      return [...updated.slice(0, lastIdx + 1), newItem, ...updated.slice(lastIdx + 1)]
    })
  }

  function removePlannedSet() {
    if (!current) return
    const exerciseId = current.exerciseId
    setQueue((prev) => {
      const lastIdx = prev.map((q) => q.exerciseId).lastIndexOf(exerciseId)
      if (lastIdx <= stepIndex) return prev
      const newTotal = prev.filter((q) => q.exerciseId === exerciseId).length - 1
      const next = prev.filter((_, i) => i !== lastIdx)
      return next.map((q) => (q.exerciseId === exerciseId ? { ...q, targetSets: newTotal } : q))
    })
  }

  function removeSet(exerciseId: string, index: number) {
    setLogged((prev) =>
      prev
        .map((l) => (l.exerciseId === exerciseId ? { ...l, sets: l.sets.filter((_, i) => i !== index) } : l))
        .filter((l) => l.sets.length > 0),
    )
  }

  function finish() {
    onFinish({
      id: crypto.randomUUID(),
      date,
      recovery,
      exercises: logged,
      notes: notes.trim() || undefined,
      planId: activePlanId,
      planDayId: planDay.id,
      unit: weightUnit,
    })
  }

  if (!current) {
    return (
      <div className="panel">
        <h2>{planDay.label}: Workout Complete</h2>
        {logged.length === 0 && <p className="muted">Nothing logged yet.</p>}
        {logged.map((l) => {
          const ex = exercises.find((e) => e.id === l.exerciseId)
          const priorBest = maxWeightEver(sessions, l.exerciseId, weightUnit)
          return (
            <div key={l.exerciseId} className="plan-day-editor">
              <h3>{ex?.name ?? 'Unknown exercise'}</h3>
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
                  {l.sets.map((s, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>
                        {formatWeight(s.weight, weightUnit)}
                        {s.weight > priorBest && isFirstAtWeightAndReps(l.sets, i) && (
                          <span className="pr-badge">PR</span>
                        )}
                      </td>
                      <td>{s.reps}</td>
                      <td>{s.rpe}</td>
                      <td>
                        <button className="link-btn" onClick={() => removeSet(l.exerciseId, i)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })}

        <label className="session-notes-field">
          Notes (Optional)
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did it feel? Anything to remember for next time?"
            rows={3}
          />
        </label>

        <div className="wizard-actions">
          <button type="button" className="link-btn-danger" onClick={onCancel}>
            Discard Workout
          </button>
          <button type="button" className="primary" onClick={finish} disabled={logged.length === 0}>
            Finish Workout
          </button>
        </div>
      </div>
    )
  }

  const exerciseNumber = planDay.exercises.findIndex((pe) => pe.exerciseId === current.exerciseId) + 1
  const progressPercent = queue.length > 0 ? Math.round((stepIndex / queue.length) * 100) : 0
  const currentExerciseLog = logged.find((l) => l.exerciseId === current.exerciseId)
  const priorBest = maxWeightEver(sessions, current.exerciseId, weightUnit)
  const lastQueueIndexForExercise = queue.map((q) => q.exerciseId).lastIndexOf(current.exerciseId)
  const canRemovePlannedSet = lastQueueIndexForExercise > stepIndex
  const isLastSetOfExercise = current.setNumber >= current.targetSets
  const isLastExercise = exerciseNumber >= planDay.exercises.length
  const logSetLabel = isLastSetOfExercise && isLastExercise ? 'Log Set and Finish Workout' : 'Log Set'
  // True right after logging an exercise's final set (when it isn't the workout's last exercise) -
  // the queue hasn't advanced yet, so the form below is swapped for a "Start Next Exercise" prompt.
  const pendingAdvance =
    isLastSetOfExercise && !isLastExercise && (currentExerciseLog?.sets.length ?? 0) >= current.targetSets

  const lastLoggedSet = currentExerciseLog?.sets[currentExerciseLog.sets.length - 1]
  const repeatSource: SetEntry | undefined =
    lastLoggedSet ??
    (suggestion ? { weight: suggestion.suggestedWeight, reps: suggestion.suggestedReps, rpe: form.rpe } : undefined)
  const repeatLabel = lastLoggedSet ? 'Same as last' : suggestion ? 'Use suggested' : 'No history yet'

  return (
    <div className="panel active-workout">
      <div className="logger-screen">
        <div className="logger-topbar">
          <button type="button" className="link-btn-danger" onClick={onCancel}>
            Cancel Workout
          </button>
          <span className="meta-text">
            Exercise {exerciseNumber} of {planDay.exercises.length}
          </span>
          <span className="meta-text logger-topbar-set">
            Set {current.setNumber} of {current.targetSets}
          </span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
        </div>

        <div className="logger-context">
          <div className="logger-title-row">
            <h2>{currentExercise?.name ?? 'Unknown exercise'}</h2>
            <div className="set-count-buttons">
              <button
                type="button"
                className="link-btn"
                onClick={removePlannedSet}
                disabled={!canRemovePlannedSet}
                title="Remove a set from this exercise"
              >
                − Set
              </button>
              <button type="button" className="link-btn" onClick={addPlannedSet} title="Add a set to this exercise">
                + Set
              </button>
            </div>
          </div>
          {suggestion && (
            <SuggestionCard suggestion={suggestion} weightUnit={weightUnit} onShowPlates={onShowPlates} compact />
          )}
          <LastTimeSets sessions={sessions} exerciseId={current.exerciseId} targetUnit={weightUnit} />
          <RestTimer autoStartSignal={restSignal} variant="ring" />
        </div>

        {pendingAdvance ? (
          <div className="logger-done">
            <span className="logger-done-icon">&#10003;</span>
            <p>{currentExercise?.name ?? 'Exercise'} complete</p>
          </div>
        ) : (
          <div className="logger-grid">
            <div className="logger-tile">
              <span className="logger-tile-label">Weight ({weightUnit})</span>
              <NumberStepper
                value={form.weight}
                step={currentExercise?.weightIncrement ?? 2.5}
                min={0}
                onChange={(weight) => setForm({ ...form, weight })}
              />
            </div>
            <div className="logger-tile">
              <span className="logger-tile-label">Reps</span>
              <NumberStepper
                value={form.reps}
                step={1}
                min={0}
                inputMode="numeric"
                onChange={(reps) => setForm({ ...form, reps })}
              />
            </div>
            <div className="logger-tile">
              <span className="logger-tile-label">RPE</span>
              <NumberStepper
                value={form.rpe}
                step={1}
                min={1}
                max={10}
                inputMode="numeric"
                onChange={(rpe) => setForm({ ...form, rpe })}
              />
            </div>
            <button
              type="button"
              className="logger-tile logger-tile-repeat"
              onClick={() => repeatSource && setForm({ ...repeatSource })}
            >
              <span className="logger-tile-label">{repeatLabel}</span>
              <span className="logger-repeat-icon">&#8635;</span>
              <span className="logger-tile-label">
                {repeatSource ? `${repeatSource.weight} x ${repeatSource.reps}` : '-'}
              </span>
            </button>
          </div>
        )}

        <div className="logger-actions">
          {pendingAdvance ? (
            <>
              <button type="button" className="primary logger-cta" onClick={advanceToNextExercise}>
                Start Next Exercise
              </button>
              <div className="logger-secondary-row">
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => removeSet(current.exerciseId, current.setNumber - 1)}
                  title="Remove that last set so you can redo it"
                >
                  &#8592; Undo Last Set
                </button>
              </div>
            </>
          ) : (
            <>
              <button type="button" className="primary logger-cta" onClick={logSet}>
                {logSetLabel}
              </button>
              <div className="logger-secondary-row">
                {stepIndex > 0 ? (
                  <button
                    type="button"
                    className="link-btn"
                    onClick={goToPreviousStep}
                    title="Go back a set - if it was already logged, that log is removed so you can redo it"
                  >
                    &#8592; Back
                  </button>
                ) : (
                  <span />
                )}
                {!isLastExercise && (
                  <button type="button" className="link-btn" onClick={skipRestOfExercise}>
                    Skip to Next Exercise
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {currentExerciseLog && currentExerciseLog.sets.length > 0 && (
        <table className="set-table">
          <thead>
            <tr>
              <th>Set</th>
              <th>Weight</th>
              <th>Reps</th>
              <th>RPE</th>
            </tr>
          </thead>
          <tbody>
            {currentExerciseLog.sets.map((s, i) => (
              <tr
                key={i}
                className={s.weight > priorBest ? 'set-table-logged-row set-table-logged-row-pr' : 'set-table-logged-row'}
              >
                <td>
                  <span className="set-logged-check">&#10003;</span> {i + 1}
                </td>
                <td>
                  {formatWeight(s.weight, weightUnit)}
                  {s.weight > priorBest && isFirstAtWeightAndReps(currentExerciseLog.sets, i) && (
                    <span className="pr-badge">PR</span>
                  )}
                </td>
                <td>{s.reps}</td>
                <td>{s.rpe}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {notesOpen || notes ? (
        <label className="session-notes-field">
          Notes (Optional)
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did it feel? Anything to remember for next time?"
            rows={2}
          />
        </label>
      ) : (
        <button type="button" className="link-btn add-note-btn" onClick={() => setNotesOpen(true)}>
          + Add a Note
        </button>
      )}
    </div>
  )
}
