import type { WeeklyGoalStatus } from '../lib/planProgress'

interface Props {
  status: WeeklyGoalStatus
}

export function WeeklyGoalFlag({ status }: Props) {
  const { daysRemainingInWeek, sessionsRemaining, met, atRisk } = status
  const className = ['weekly-goal-flag', met ? 'met' : atRisk ? 'at-risk' : 'on-track'].join(' ')
  const sessionWord = sessionsRemaining === 1 ? 'session' : 'sessions'

  return (
    <div className={className}>
      {sessionsRemaining}/{daysRemainingInWeek} {sessionWord} remaining this week
    </div>
  )
}
