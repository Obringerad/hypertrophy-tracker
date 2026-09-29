import type { CSSProperties } from 'react'
import { muscleGroupColor } from '../lib/muscleGroupColors'

export function MuscleGroupTag({ muscleGroup }: { muscleGroup: string }) {
  const style = { '--tag-color': muscleGroupColor(muscleGroup) } as CSSProperties
  return (
    <span className="muscle-group-tag" style={style}>
      {muscleGroup}
    </span>
  )
}
