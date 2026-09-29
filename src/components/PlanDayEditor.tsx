import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { Exercise, PlanDay } from '../types'
import { catalogExercisesForMuscleGroup, findCatalogExerciseByName, type CatalogExercise } from '../lib/exerciseCatalog'
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
  /** Lets exercises be dragged into a new order within this day. Omit to render a static list. */
  onReorderExercises?: (fromIndex: number, toIndex: number) => void
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
  onReorderExercises,
}: Props) {
  const [newName, setNewName] = useState('')
  const [swapSuggestion, setSwapSuggestion] = useState<SwapSuggestion | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragPointer, setDragPointer] = useState<{ x: number; y: number } | null>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // touch-action: none on the handle is usually enough, but some mobile browsers still let a
  // scroll gesture win partway through - which fires a pointercancel and silently drops the drag.
  // Blocking touchmove at the document level for the duration of the drag closes that gap.
  useEffect(() => {
    if (dragIndex === null) return
    function blockScroll(e: TouchEvent) {
      e.preventDefault()
    }
    document.addEventListener('touchmove', blockScroll, { passive: false })
    return () => document.removeEventListener('touchmove', blockScroll)
  }, [dragIndex])

  function handleDragHandlePointerDown(e: ReactPointerEvent<HTMLSpanElement>, index: number) {
    if (!onReorderExercises) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragIndex(index)
    setDragPointer({ x: e.clientX, y: e.clientY })
  }

  function handleDragPointerMove(e: ReactPointerEvent<HTMLSpanElement>) {
    if (dragIndex === null || !onReorderExercises || !listRef.current) return
    e.preventDefault()
    setDragPointer({ x: e.clientX, y: e.clientY })
    const y = e.clientY
    const rows = listRef.current.querySelectorAll<HTMLLIElement>('li[data-row-index]')
    rows.forEach((row) => {
      const i = Number(row.dataset.rowIndex)
      if (i === dragIndex) return
      const rect = row.getBoundingClientRect()
      if (y < rect.top || y > rect.bottom) return
      const midpoint = rect.top + rect.height / 2
      const crossedIntoRow = (i < dragIndex && y < midpoint) || (i > dragIndex && y > midpoint)
      if (crossedIntoRow) {
        onReorderExercises(dragIndex, i)
        setDragIndex(i)
      }
    })
  }

  function handleDragPointerUp() {
    setDragIndex(null)
    setDragPointer(null)
  }

  function exercise(id: string): Exercise | undefined {
    return exercises.find((e) => e.id === id)
  }

  function exerciseName(id: string): string {
    return exercise(id)?.name ?? 'Unknown exercise'
  }

  function submit() {
    const known = findCatalogExerciseByName(newName)
    onAddExercise(
      newName,
      known && {
        muscleGroup: known.muscleGroup,
        repRangeLow: known.repRangeLow,
        repRangeHigh: known.repRangeHigh,
        weightIncrement: known.weightIncrement,
      },
    )
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
      <ul className="exercise-list" ref={listRef}>
        {day.exercises.map((pe, index) => (
          <li
            key={pe.exerciseId}
            data-row-index={index}
            className={dragIndex === index ? 'exercise-row-dragging' : undefined}
          >
            {onReorderExercises && (
              <span
                className="drag-handle"
                onPointerDown={(e) => handleDragHandlePointerDown(e, index)}
                onPointerMove={handleDragPointerMove}
                onPointerUp={handleDragPointerUp}
                onPointerCancel={handleDragPointerUp}
                aria-hidden="true"
              >
                ⠿
              </span>
            )}
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

      {dragIndex !== null &&
        dragPointer &&
        (() => {
          const dragged = exercise(day.exercises[dragIndex]?.exerciseId)
          if (!dragged) return null
          return (
            <div className="exercise-drag-ghost" style={{ left: dragPointer.x, top: dragPointer.y }}>
              <span className="drag-handle" aria-hidden="true">
                ⠿
              </span>
              {dragged.name}
              <MuscleGroupTag muscleGroup={dragged.muscleGroup} />
            </div>
          )
        })()}

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
