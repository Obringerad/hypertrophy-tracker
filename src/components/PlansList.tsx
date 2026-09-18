import type { WorkoutPlan, WorkoutSession } from '../types'
import { planProgress } from '../lib/planProgress'

interface Props {
  plans: WorkoutPlan[]
  sessions: WorkoutSession[]
  activePlanId: string | null
  onOpen: (planId: string) => void
  onNew: () => void
}

export function PlansList({ plans, sessions, activePlanId, onOpen, onNew }: Props) {
  return (
    <div className="panel">
      <h2>Your plans</h2>
      <div className="plans-list">
        {plans.map((plan) => {
          const progress = planProgress(plan, sessions)
          return (
            <button key={plan.id} className="plan-card" onClick={() => onOpen(plan.id)}>
              <div className="plan-card-header">
                <strong>{plan.name}</strong>
                {plan.id === activePlanId && <span className="active-badge">Active</span>}
              </div>
              <span className="muted">{plan.splitName}</span>
              <span className="muted">
                {progress.totalWeeks
                  ? `Week ${progress.week} of ${progress.totalWeeks}`
                  : `Week ${progress.week}`}{' '}
                &middot; {progress.completedSessions} sessions logged
              </span>
            </button>
          )
        })}
        {plans.length === 0 && <p className="muted">No plans yet. Create one to get started.</p>}
      </div>
      <button type="button" className="primary" onClick={onNew}>
        New plan
      </button>
    </div>
  )
}
