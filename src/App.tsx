import { useState } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
import type { Exercise, WorkoutPlan, WorkoutSession } from './types'
import { ExerciseManager } from './components/ExerciseManager'
import { WorkoutLogger } from './components/WorkoutLogger'
import { HistoryView } from './components/HistoryView'
import { PlanSetup } from './components/PlanSetup'
import { PlansList } from './components/PlansList'
import { PlanDetail } from './components/PlanDetail'
import { advancePlanRotation, resolveTodaysPlanDay } from './lib/planEngine'
import './App.css'

type Tab = 'log' | 'history' | 'plans' | 'exercises'

export default function App() {
  const [exercises, setExercises] = useLocalStorage<Exercise[]>('hypertrophy.exercises', [])
  const [sessions, setSessions] = useLocalStorage<WorkoutSession[]>('hypertrophy.sessions', [])
  const [plans, setPlans] = useLocalStorage<WorkoutPlan[]>('hypertrophy.plans', [])
  const [activePlanId, setActivePlanId] = useLocalStorage<string | null>('hypertrophy.activePlanId', null)
  const [tab, setTab] = useState<Tab>(plans.length > 0 ? 'log' : 'plans')
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [creatingPlan, setCreatingPlan] = useState(plans.length === 0)

  const activePlan = plans.find((p) => p.id === activePlanId) ?? null
  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? null

  function addExercise(exercise: Exercise) {
    setExercises((prev) => [...prev, exercise])
  }

  function removeExercise(id: string) {
    setExercises((prev) => prev.filter((e) => e.id !== id))
  }

  function saveSession(session: WorkoutSession) {
    setSessions((prev) => [...prev, session])
    if (activePlan) {
      setPlans((prev) => prev.map((p) => (p.id === activePlan.id ? advancePlanRotation(p) : p)))
    }
  }

  function savePlan(newPlan: WorkoutPlan, newExercises: Exercise[]) {
    if (newExercises.length > 0) setExercises((prev) => [...prev, ...newExercises])
    setPlans((prev) => [...prev, newPlan])
    setActivePlanId(newPlan.id)
    setCreatingPlan(false)
    setSelectedPlanId(newPlan.id)
    setTab('log')
  }

  function updatePlan(updated: WorkoutPlan, newExercises?: Exercise[]) {
    if (newExercises && newExercises.length > 0) setExercises((prev) => [...prev, ...newExercises])
    setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }

  function deletePlan(planId: string) {
    setPlans((prev) => prev.filter((p) => p.id !== planId))
    if (activePlanId === planId) setActivePlanId(null)
    setSelectedPlanId(null)
  }

  const todaysPlanDay = activePlan ? resolveTodaysPlanDay(activePlan) : null

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
          <button
            className={tab === 'plans' ? 'active' : ''}
            onClick={() => {
              setTab('plans')
              setSelectedPlanId(null)
              setCreatingPlan(false)
            }}
          >
            Plans
          </button>
          <button className={tab === 'exercises' ? 'active' : ''} onClick={() => setTab('exercises')}>
            Exercises
          </button>
        </nav>
      </header>

      <main>
        {tab === 'log' && (
          <WorkoutLogger
            exercises={exercises}
            sessions={sessions}
            onSave={saveSession}
            planDay={todaysPlanDay}
            activePlanId={activePlan?.id}
          />
        )}
        {tab === 'history' && <HistoryView exercises={exercises} sessions={sessions} />}
        {tab === 'plans' &&
          (creatingPlan ? (
            <PlanSetup
              existingExercises={exercises}
              onSave={savePlan}
              onCancel={plans.length > 0 ? () => setCreatingPlan(false) : undefined}
            />
          ) : selectedPlan ? (
            <PlanDetail
              plan={selectedPlan}
              exercises={exercises}
              sessions={sessions}
              isActive={selectedPlan.id === activePlanId}
              onSetActive={() => setActivePlanId(selectedPlan.id)}
              onDelete={() => deletePlan(selectedPlan.id)}
              onUpdatePlan={updatePlan}
              onBack={() => setSelectedPlanId(null)}
            />
          ) : (
            <PlansList
              plans={plans}
              sessions={sessions}
              activePlanId={activePlanId}
              onOpen={setSelectedPlanId}
              onNew={() => setCreatingPlan(true)}
            />
          ))}
        {tab === 'exercises' && (
          <ExerciseManager exercises={exercises} onAdd={addExercise} onRemove={removeExercise} />
        )}
      </main>
    </div>
  )
}
