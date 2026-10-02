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
  /** One-line version for tight layouts - the reason text moves into a tooltip. */
  compact?: boolean
}

export function SuggestionCard({ suggestion, weightUnit, onShowPlates, compact }: Props) {
  if (compact) {
    return (
      <div className={`suggestion suggestion-compact suggestion-${suggestion.action}`} title={suggestion.reason}>
        <span className="suggestion-badge">{ACTION_LABEL[suggestion.action]}</span>
        <span>Next: {formatWeight(suggestion.suggestedWeight, weightUnit)} x {suggestion.suggestedReps}</span>
        {onShowPlates && (
          <button type="button" className="link-btn" onClick={() => onShowPlates(suggestion.suggestedWeight)}>
            Plates
          </button>
        )}
      </div>
    )
  }
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
