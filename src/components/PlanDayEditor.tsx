import { useState } from 'react'
import type { Exercise, PlanDay } from '../types'
import { catalogExercisesForMuscleGroup, type CatalogExercise } from '../lib/exerciseCatalog'
import { MuscleGroupTag } from './MuscleGroupTag'

export interface NewExerciseDetails {
  muscleGroup: string
  repRangeLow: number
  repRangeHigh: number
  weightIncrement: number
}

interface Props {
  day: PlanDay
  exercises: Exercise[]
  onRemoveExercise: (exerciseId: string) => void
  onAddExercise: (name: string, details?: NewExerciseDetails) => void
  onUpdateTargetSets: (exerciseId: string, targetSets: number) => void
  /** Unit label and update handler for starting weights - only passed during initial plan setup, so
   * an already-saved plan being edited later doesn't show a weight field. */
  weightUnit?: string
  onUpdateStartingWeight?: (exerciseId: string, weight: number) => void
}

/** How many alternative exercises to suggest when one is removed from a day. */
const MAX_SWAP_CANDIDATES = 6

interface SwapSuggestion {
  muscleGroup: string
  candidates: CatalogExercise[]
}

export function PlanDayEditor({
  day,
  exercises,
  onRemoveExercise,
  onAddExercise,
  onUpdateTargetSets,
  weightUnit,
  onUpdateStartingWeight,
}: Props) {
  const [newName, setNewName] = useState('')
  const [swapSuggestion, setSwapSuggestion] = useState<SwapSuggestion | null>(null)

  function exercise(id: string): Exercise | undefined {
    return exercises.find((e) => e.id === id)
  }

  function exerciseName(id: string): string {
    return exercise(id)?.name ?? 'Unknown exercise'
  }

  function submit() {
    onAddExercise(newName)
    setNewName('')
  }

  function removeExercise(exerciseId: string) {
    const removed = exercises.find((e) => e.id === exerciseId)
    onRemoveExercise(exerciseId)
    if (!removed) {
      setSwapSuggestion(null)
      return
    }
    const remainingIds = new Set(
      day.exercises.filter((pe) => pe.exerciseId !== exerciseId).map((pe) => pe.exerciseId),
    )
    const usedNames = new Set(
      exercises.filter((e) => remainingIds.has(e.id)).map((e) => e.name.toLowerCase()),
    )
    usedNames.add(removed.name.toLowerCase())

    const ownCandidates = exercises.filter(
      (e) => e.muscleGroup === removed.muscleGroup && !usedNames.has(e.name.toLowerCase()),
    )
    for (const c of ownCandidates) usedNames.add(c.name.toLowerCase())

    const catalogCandidates = catalogExercisesForMuscleGroup(removed.muscleGroup).filter(
      (c) => !usedNames.has(c.name.toLowerCase()),
    )

    const candidates = [...ownCandidates, ...catalogCandidates].slice(0, MAX_SWAP_CANDIDATES)
    setSwapSuggestion(candidates.length > 0 ? { muscleGroup: removed.muscleGroup, candidates } : null)
  }

  function addSuggested(candidate: CatalogExercise) {
    onAddExercise(candidate.name, {
      muscleGroup: candidate.muscleGroup,
      repRangeLow: candidate.repRangeLow,
      repRangeHigh: candidate.repRangeHigh,
      weightIncrement: candidate.weightIncrement,
    })
    setSwapSuggestion(null)
  }

  return (
    <div className="plan-day-editor">
      <h3>{day.label}</h3>
      <ul className="exercise-list">
        {day.exercises.map((pe) => (
          <li key={pe.exerciseId}>
            <span className="plan-day-exercise-info">
              {exerciseName(pe.exerciseId)}{' '}
              {exercise(pe.exerciseId) && <MuscleGroupTag muscleGroup={exercise(pe.exerciseId)!.muscleGroup} />}
              <span className="plan-day-target-sets">
                <input
                  type="number"
                  min={1}
                  value={pe.targetSets}
                  onChange={(e) => onUpdateTargetSets(pe.exerciseId, Math.max(1, Number(e.target.value)))}
                />
                <span className="muted">sets</span>
              </span>
              {onUpdateStartingWeight && (
                <span className="plan-day-target-sets">
                  <input
                    type="number"
                    className="starting-weight-input"
                    min={0}
                    placeholder="0"
                    value={exercise(pe.exerciseId)?.startingWeight ?? ''}
                    onChange={(e) => onUpdateStartingWeight(pe.exerciseId, Number(e.target.value))}
                  />
                  <span className="muted">starting {weightUnit}</span>
                </span>
              )}
            </span>
            <button className="link-btn" onClick={() => removeExercise(pe.exerciseId)}>
              Remove
            </button>
          </li>
        ))}
        {day.exercises.length === 0 && <p className="muted">No exercises yet.</p>}
      </ul>

      {swapSuggestion && (
        <div className="exercise-swap-suggestion">
          <p className="muted">
            Swap in another <MuscleGroupTag muscleGroup={swapSuggestion.muscleGroup} /> exercise?
          </p>
          <div className="exercise-swap-options">
            {swapSuggestion.candidates.map((c) => (
              <button key={c.name} type="button" className="choice-btn" onClick={() => addSuggested(c)}>
                {c.name}
              </button>
            ))}
            <button type="button" className="link-btn" onClick={() => setSwapSuggestion(null)}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="add-exercise-inline">
        <input
          placeholder="Add exercise"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
        />
        <button type="button" onClick={submit}>
          Add
        </button>
      </div>
    </div>
  )
}
