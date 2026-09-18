import { useState } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
import type { Exercise, WorkoutSession } from './types'
import { ExerciseManager } from './components/ExerciseManager'
import { WorkoutLogger } from './components/WorkoutLogger'
import { HistoryView } from './components/HistoryView'
import './App.css'

type Tab = 'log' | 'history' | 'exercises'

export default function App() {
  const [exercises, setExercises] = useLocalStorage<Exercise[]>('hypertrophy.exercises', [])
  const [sessions, setSessions] = useLocalStorage<WorkoutSession[]>('hypertrophy.sessions', [])
  const [tab, setTab] = useState<Tab>('log')

  function addExercise(exercise: Exercise) {
    setExercises((prev) => [...prev, exercise])
  }

  function removeExercise(id: string) {
    setExercises((prev) => prev.filter((e) => e.id !== id))
  }

  function saveSession(session: WorkoutSession) {
    setSessions((prev) => [...prev, session])
  }

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
          <button className={tab === 'exercises' ? 'active' : ''} onClick={() => setTab('exercises')}>
            Exercises
          </button>
        </nav>
      </header>

      <main>
        {tab === 'log' && <WorkoutLogger exercises={exercises} sessions={sessions} onSave={saveSession} />}
        {tab === 'history' && <HistoryView exercises={exercises} sessions={sessions} />}
        {tab === 'exercises' && (
          <ExerciseManager exercises={exercises} onAdd={addExercise} onRemove={removeExercise} />
        )}
      </main>
    </div>
  )
}
