import type { ProgressionSuggestion } from '../types'

const ACTION_LABEL: Record<ProgressionSuggestion['action'], string> = {
  increase_weight: 'Add weight',
  increase_reps: 'Add a rep',
  hold: 'Repeat',
  decrease: 'Reduce load',
  deload: 'Deload',
}

export function SuggestionCard({ suggestion }: { suggestion: ProgressionSuggestion }) {
  return (
    <div className={`suggestion suggestion-${suggestion.action}`}>
      <div className="suggestion-header">
        <span className="suggestion-badge">{ACTION_LABEL[suggestion.action]}</span>
        <span>
          Next: {suggestion.suggestedWeight} x {suggestion.suggestedReps}
        </span>
      </div>
      <p className="muted">{suggestion.reason}</p>
    </div>
  )
}
