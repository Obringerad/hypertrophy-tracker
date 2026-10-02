import { useState, type CSSProperties } from 'react'
import type { Exercise, PlanDay } from '../types'
import { catalogExercisesForMuscleGroup, findCatalogExerciseByName, type CatalogExercise } from '../lib/exerciseCatalog'
import { useSettings } from '../context/SettingsContext'
import { MAX_SETS_PER_EXERCISE } from '../lib/limits'
import { MuscleGroupTag } from './MuscleGroupTag'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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

interface ExerciseRowContentProps {
  exerciseId: string
  targetSets: number
  info: Exercise | undefined
  weightUnit?: string
  onUpdateTargetSets: (exerciseId: string, targetSets: number) => void
  onUpdateStartingWeight?: (exerciseId: string, weight: number) => void
}

function ExerciseRowContent({
  exerciseId,
  targetSets,
  info,
  weightUnit,
  onUpdateTargetSets,
  onUpdateStartingWeight,
}: ExerciseRowContentProps) {
  return (
    <span className="plan-day-exercise-info">
      <span className="plan-day-exercise-name">
        {info?.name ?? 'Unknown exercise'} {info && <MuscleGroupTag muscleGroup={info.muscleGroup} />}
      </span>
      <span className="plan-day-exercise-controls">
        <span className="plan-day-target-sets">
          <input
            type="number"
            min={1}
            max={MAX_SETS_PER_EXERCISE}
            value={targetSets}
            onChange={(e) =>
              onUpdateTargetSets(exerciseId, Math.min(MAX_SETS_PER_EXERCISE, Math.max(1, Number(e.target.value))))
            }
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
              value={info?.startingWeight ?? ''}
              onChange={(e) => onUpdateStartingWeight(exerciseId, Number(e.target.value))}
            />
            <span className="muted">starting {weightUnit}</span>
          </span>
        )}
      </span>
    </span>
  )
}

interface SortableExerciseRowProps extends ExerciseRowContentProps {
  reorderable: boolean
  onRemove: (exerciseId: string) => void
}

function SortableExerciseRow({ exerciseId, reorderable, onRemove, ...rest }: SortableExerciseRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: exerciseId,
    disabled: !reorderable,
  })
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
  }

  return (
    <li ref={setNodeRef} style={style} className={isDragging ? 'exercise-row-dragging' : undefined}>
      {reorderable && (
        <span className="drag-handle" {...attributes} {...listeners} aria-hidden="true">
          ⠿
        </span>
      )}
      <ExerciseRowContent exerciseId={exerciseId} {...rest} />
      <button className="link-btn" onClick={() => onRemove(exerciseId)}>
        Remove
      </button>
    </li>
  )
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
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))
  // Always read the live setting here (rather than relying on the `weightUnit` prop, which is only
  // passed during initial plan setup) so the databank's lb-authored increments get converted whenever
  // an exercise is auto-filled or suggested, whether that's during setup or editing a saved plan later.
  const { weightUnit: activeWeightUnit } = useSettings()

  function exercise(id: string): Exercise | undefined {
    return exercises.find((e) => e.id === id)
  }

  function submit() {
    const known = findCatalogExerciseByName(newName, activeWeightUnit)
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

    const catalogCandidates = catalogExercisesForMuscleGroup(removed.muscleGroup, activeWeightUnit).filter(
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

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id || !onReorderExercises) return
    const fromIndex = day.exercises.findIndex((pe) => pe.exerciseId === active.id)
    const toIndex = day.exercises.findIndex((pe) => pe.exerciseId === over.id)
    if (fromIndex === -1 || toIndex === -1) return
    onReorderExercises(fromIndex, toIndex)
  }

  const activeExercise = activeId ? exercise(activeId) : undefined

  return (
    <div className="plan-day-editor">
      <h3>{day.label}</h3>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <SortableContext items={day.exercises.map((pe) => pe.exerciseId)} strategy={verticalListSortingStrategy}>
          <ul className="exercise-list">
            {day.exercises.map((pe) => (
              <SortableExerciseRow
                key={pe.exerciseId}
                exerciseId={pe.exerciseId}
                targetSets={pe.targetSets}
                info={exercise(pe.exerciseId)}
                weightUnit={weightUnit}
                onUpdateTargetSets={onUpdateTargetSets}
                onUpdateStartingWeight={onUpdateStartingWeight}
                reorderable={!!onReorderExercises}
                onRemove={removeExercise}
              />
            ))}
            {day.exercises.length === 0 && <p className="muted">No exercises yet.</p>}
          </ul>
        </SortableContext>

        <DragOverlay>
          {activeExercise && (
            <div className="exercise-drag-ghost">
              <span className="drag-handle" aria-hidden="true">
                ⠿
              </span>
              {activeExercise.name}
              <MuscleGroupTag muscleGroup={activeExercise.muscleGroup} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

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
