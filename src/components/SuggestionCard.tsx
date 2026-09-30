import type { ProgressionSuggestion } from '../types'
import { formatWeight, type WeightUnit } from '../lib/units'

const ACTION_LABEL: Record<ProgressionSuggestion['action'], string> = {
  increase_weight: 'Add Weight',
  increase_reps: 'Add a Rep',
  hold: 'Repeat',
  decrease: 'Reduce Load',
  deload: 'Deload',
}

interface Props {
  suggestion: ProgressionSuggestion
  weightUnit: WeightUnit
  onShowPlates?: (weight: number) => void
}

export function SuggestionCard({ suggestion, weightUnit, onShowPlates }: Props) {
  return (
    <div className={`suggestion suggestion-${suggestion.action}`}>
      <div className="suggestion-header">
        <span className="suggestion-badge">{ACTION_LABEL[suggestion.action]}</span>
        <span>
          Next: {formatWeight(suggestion.suggestedWeight, weightUnit)} x {suggestion.suggestedReps}
        </span>
      </div>
      <p className="muted">{suggestion.reason}</p>
      {onShowPlates && (
        <button type="button" className="link-btn" onClick={() => onShowPlates(suggestion.suggestedWeight)}>
          Plates for This Weight
        </button>
      )}
    </div>
  )
}
