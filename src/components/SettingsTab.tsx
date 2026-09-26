import { useRef, type ChangeEvent } from 'react'
import type { Exercise, WorkoutPlan, WorkoutSession } from '../types'
import { useSettings } from '../context/SettingsContext'

interface BackupData {
  version: 1
  exercises: Exercise[]
  sessions: WorkoutSession[]
  plans: WorkoutPlan[]
  activePlanId: string | null
  weightUnit: string
}

interface ImportedData {
  exercises: Exercise[]
  sessions: WorkoutSession[]
  plans: WorkoutPlan[]
  activePlanId: string | null
}

interface Props {
  exercises: Exercise[]
  sessions: WorkoutSession[]
  plans: WorkoutPlan[]
  activePlanId: string | null
  onImport: (data: ImportedData) => void
}

export function SettingsTab({ exercises, sessions, plans, activePlanId, onImport }: Props) {
  const { weightUnit, setWeightUnit } = useSettings()
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleExport() {
    const data: BackupData = { version: 1, exercises, sessions, plans, activePlanId, weightUnit }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hypertrophy-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as Partial<BackupData>
        if (!window.confirm('Import this backup? It will replace all current data on this device.')) return
        onImport({
          exercises: data.exercises ?? [],
          sessions: data.sessions ?? [],
          plans: data.plans ?? [],
          activePlanId: data.activePlanId ?? null,
        })
        if (data.weightUnit === 'lb' || data.weightUnit === 'kg') setWeightUnit(data.weightUnit)
      } catch {
        window.alert('That file could not be read as a valid backup.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="panel">
      <h2>Settings</h2>

      <div className="settings-section">
        <h3>Weight unit</h3>
        <div className="schedule-type-picker">
          <button
            type="button"
            className={weightUnit === 'lb' ? 'choice-btn active' : 'choice-btn'}
            onClick={() => setWeightUnit('lb')}
          >
            Pounds (lb)
          </button>
          <button
            type="button"
            className={weightUnit === 'kg' ? 'choice-btn active' : 'choice-btn'}
            onClick={() => setWeightUnit('kg')}
          >
            Kilograms (kg)
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h3>Backup</h3>
        <p className="muted">
          Your data lives only in this browser. Export a backup periodically, or before clearing site data or
          switching devices, and you can restore it here.
        </p>
        <div className="settings-actions">
          <button type="button" className="primary" onClick={handleExport}>
            Export backup
          </button>
          <button type="button" className="choice-btn" onClick={() => fileInputRef.current?.click()}>
            Import backup
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
      </div>
    </div>
  )
}
