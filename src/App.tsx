import { useState } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
import type { Exercise, WorkoutPlan, WorkoutSession } from './types'
import { ExerciseManager } from './components/ExerciseManager'
import { WorkoutLogger } from './components/WorkoutLogger'
import { HistoryView } from './components/HistoryView'
import { PlanSetup } from './components/PlanSetup'
import { PlanOverview } from './components/PlanOverview'
import { advancePlanRotation, resolveTodaysPlanDay } from './lib/planEngine'
import './App.css'

type Tab = 'log' | 'history' | 'exercises' | 'plan'

export default function App() {
  const [exercises, setExercises] = useLocalStorage<Exercise[]>('hypertrophy.exercises', [])
  const [sessions, setSessions] = useLocalStorage<WorkoutSession[]>('hypertrophy.sessions', [])
  const [plan, setPlan] = useLocalStorage<WorkoutPlan | null>('hypertrophy.plan', null)
  const [tab, setTab] = useState<Tab>(plan ? 'log' : 'plan')
  const [editingPlan, setEditingPlan] = useState(plan === null)

  function addExercise(exercise: Exercise) {
    setExercises((prev) => [...prev, exercise])
  }

  function removeExercise(id: string) {
    setExercises((prev) => prev.filter((e) => e.id !== id))
  }

  function saveSession(session: WorkoutSession) {
    setSessions((prev) => [...prev, session])
    if (plan) setPlan(advancePlanRotation(plan))
  }

  function savePlan(newPlan: WorkoutPlan, newExercises: Exercise[]) {
    if (newExercises.length > 0) setExercises((prev) => [...prev, ...newExercises])
    setPlan(newPlan)
    setEditingPlan(false)
    setTab('log')
  }

  const todaysPlanDay = plan ? resolveTodaysPlanDay(plan) : null

  return (
    <div className="app">
      <header className="app-header">
        <h1>Hypertrophy Tracker</h1>
        <nav className="tabs">
          <button className={tab === 'log' ? 'active' : ''} onClick={() => setTab('log')}>
            Log Workout
          </button>
          <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>
            History
          </button>
          <button className={tab === 'plan' ? 'active' : ''} onClick={() => setTab('plan')}>
            Plan
          </button>
          <button className={tab === 'exercises' ? 'active' : ''} onClick={() => setTab('exercises')}>
            Exercises
          </button>
        </nav>
      </header>

      <main>
        {tab === 'log' && (
          <WorkoutLogger exercises={exercises} sessions={sessions} onSave={saveSession} planDay={todaysPlanDay} />
        )}
        {tab === 'history' && <HistoryView exercises={exercises} sessions={sessions} />}
        {tab === 'plan' &&
          (editingPlan || !plan ? (
            <PlanSetup
              existingExercises={exercises}
              onSave={savePlan}
              onCancel={plan ? () => setEditingPlan(false) : undefined}
            />
          ) : (
            <PlanOverview plan={plan} exercises={exercises} onRedoSetup={() => setEditingPlan(true)} />
          ))}
        {tab === 'exercises' && (
          <ExerciseManager exercises={exercises} onAdd={addExercise} onRemove={removeExercise} />
        )}
      </main>
    </div>
  )
}
