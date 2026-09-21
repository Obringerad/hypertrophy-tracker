import { useState } from 'react'
import type { Exercise, WorkoutSession } from '../types'
import { exerciseProgressPoints, exercisesWithHistory } from '../lib/progressStats'
import { formatShortDate } from '../lib/dates'
import { LineChart } from './LineChart'

interface Props {
  exercises: Exercise[]
  sessions: WorkoutSession[]
}

export function ProgressGraphs({ exercises, sessions }: Props) {
  const trainedExercises = exercisesWithHistory(exercises, sessions)
  const [exerciseId, setExerciseId] = useState<string | null>(null)

  if (trainedExercises.length === 0) {
    return <p className="muted home-graphs-note">Log a few workouts to start seeing progress graphs here.</p>
  }

  const selectedId = trainedExercises.some((e) => e.id === exerciseId) ? exerciseId! : trainedExercises[0].id
  const points = exerciseProgressPoints(sessions, selectedId)

  return (
    <div className="progress-graphs">
      <h3>Progress</h3>
      <div className="exercise-picker">
        <select value={selectedId} onChange={(e) => setExerciseId(e.target.value)}>
          {trainedExercises.map((exercise) => (
            <option key={exercise.id} value={exercise.id}>
              {exercise.name}
            </option>
          ))}
        </select>
      </div>

      {points.length < 2 ? (
        <p className="muted">Log this exercise a couple more times to see a trend.</p>
      ) : (
        <>
          <div className="progress-graph">
            <span className="muted progress-graph-label">Top set weight</span>
            <LineChart points={points.map((p) => ({ label: formatShortDate(p.date), value: p.topWeight }))} />
          </div>
          <div className="progress-graph">
            <span className="muted progress-graph-label">Total volume</span>
            <LineChart
              points={points.map((p) => ({ label: formatShortDate(p.date), value: Math.round(p.volume) }))}
            />
          </div>
        </>
      )}
    </div>
  )
}
