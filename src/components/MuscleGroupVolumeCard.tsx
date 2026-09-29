import type { Exercise, WorkoutSession } from '../types'
import { weeklyMuscleGroupVolume } from '../lib/muscleVolume'

interface Props {
  sessions: WorkoutSession[]
  exercises: Exercise[]
}

export function MuscleGroupVolumeCard({ sessions, exercises }: Props) {
  const volume = weeklyMuscleGroupVolume(sessions, exercises)
  if (volume.length === 0) return null
  const max = Math.max(...volume.map((v) => v.sets))

  return (
    <div className="muscle-volume-card">
      <p className="meta-text muscle-volume-label">This Week's Volume</p>
      <div className="muscle-volume-list">
        {volume.map((v) => (
          <div key={v.muscleGroup} className="muscle-volume-row">
            <span className="muscle-volume-name">{v.muscleGroup}</span>
            <div className="progress-bar muscle-volume-bar">
              <div className="progress-bar-fill" style={{ width: `${(v.sets / max) * 100}%` }} />
            </div>
            <span className="muted muscle-volume-count">
              {v.sets} set{v.sets === 1 ? '' : 's'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
