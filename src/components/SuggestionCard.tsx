import type { ProgressionSuggestion } from '../types'
import { formatWeight } from '../lib/units'
import { useSettings } from '../context/SettingsContext'

const ACTION_LABEL: Record<ProgressionSuggestion['action'], string> = {
  increase_weight: 'Add weight',
  increase_reps: 'Add a rep',
  hold: 'Repeat',
  decrease: 'Reduce load',
  deload: 'Deload',
}

export function SuggestionCard({ suggestion }: { suggestion: ProgressionSuggestion }) {
  const { weightUnit } = useSettings()
  return (
    <div className={`suggestion suggestion-${suggestion.action}`}>
      <div className="suggestion-header">
        <span className="suggestion-badge">{ACTION_LABEL[suggestion.action]}</span>
        <span>
          Next: {formatWeight(suggestion.suggestedWeight, weightUnit)} x {suggestion.suggestedReps}
        </span>
      </div>
      <p className="muted">{suggestion.reason}</p>
    </div>
  )
}
