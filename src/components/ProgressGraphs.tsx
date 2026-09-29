import { useState } from 'react'
import type { Exercise, WorkoutSession } from '../types'
import { exerciseProgressPoints, exercisesWithHistory, sessionVolumePoints } from '../lib/progressStats'
import { formatShortDate } from '../lib/dates'
import { useSettings } from '../context/SettingsContext'
import { LineChart } from './LineChart'

interface Props {
  exercises: Exercise[]
  sessions: WorkoutSession[]
}

interface ChartPoint {
  label: string
  value: number
}

function StatHeader({ title, points, unit }: { title: string; points: ChartPoint[]; unit: string }) {
  const current = points[points.length - 1].value
  const previous = points[points.length - 2].value
  const delta = current - previous

  return (
    <>
      <p className="progress-card-title meta-text">{title}</p>
      <div className="progress-card-value-row">
        <span className="progress-card-value">
          {current} {unit}
        </span>
        {delta !== 0 && (
          <span className={delta > 0 ? 'progress-card-delta up' : 'progress-card-delta down'}>
            {delta > 0 ? '+' : ''}
            {delta} {unit}
          </span>
        )}
      </div>
    </>
  )
}

type Metric = 'weight' | 'volume'

export function ProgressGraphs({ exercises, sessions }: Props) {
  const { weightUnit } = useSettings()
  const trainedExercises = exercisesWithHistory(exercises, sessions)
  const [exerciseId, setExerciseId] = useState<string | null>(null)
  const [metric, setMetric] = useState<Metric>('weight')

  if (trainedExercises.length === 0) {
    return <p className="muted home-graphs-note">Log a few workouts to start seeing progress graphs here.</p>
  }

  const selectedId = trainedExercises.some((e) => e.id === exerciseId) ? exerciseId! : trainedExercises[0].id
  const points = exerciseProgressPoints(sessions, selectedId, weightUnit)
  const volumePoints = sessionVolumePoints(sessions, weightUnit)

  const volumeChartPoints: ChartPoint[] = volumePoints.map((p) => ({
    label: formatShortDate(p.date),
    value: Math.round(p.volume),
  }))
  const exerciseChartPoints: ChartPoint[] = points.map((p) => ({
    label: formatShortDate(p.date),
    value: metric === 'weight' ? p.topWeight : Math.round(p.volume),
  }))

  return (
    <div className="progress-graphs">
      <h3>Progress</h3>

      <div className="progress-card-grid">
        {volumeChartPoints.length >= 2 && (
          <div className="progress-card">
            <StatHeader title="Total volume (all exercises)" points={volumeChartPoints} unit={weightUnit} />
            <LineChart points={volumeChartPoints} valueSuffix={` ${weightUnit}`} />
          </div>
        )}

        <div className="progress-card">
          <div className="progress-exercise-controls">
            <div className="exercise-picker">
              <select value={selectedId} onChange={(e) => setExerciseId(e.target.value)}>
                {trainedExercises.map((exercise) => (
                  <option key={exercise.id} value={exercise.id}>
                    {exercise.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="metric-toggle">
              <button
                type="button"
                className={metric === 'weight' ? 'choice-btn active' : 'choice-btn'}
                onClick={() => setMetric('weight')}
              >
                Weight
              </button>
              <button
                type="button"
                className={metric === 'volume' ? 'choice-btn active' : 'choice-btn'}
                onClick={() => setMetric('volume')}
              >
                Volume
              </button>
            </div>
          </div>

          {exerciseChartPoints.length < 2 ? (
            <p className="muted">Log this exercise a couple more times to see a trend.</p>
          ) : (
            <>
              <StatHeader
                title={metric === 'weight' ? 'Top set weight' : 'Volume'}
                points={exerciseChartPoints}
                unit={weightUnit}
              />
              <LineChart points={exerciseChartPoints} valueSuffix={` ${weightUnit}`} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
