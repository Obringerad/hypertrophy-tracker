import { useState, type FormEvent } from 'react'
import type { Exercise } from '../types'

interface Props {
  exercises: Exercise[]
  onAdd: (exercise: Exercise) => void
  onRemove: (id: string) => void
}

const emptyForm = {
  name: '',
  muscleGroup: '',
  repRangeLow: 8,
  repRangeHigh: 12,
  weightIncrement: 2.5,
}

export function ExerciseManager({ exercises, onAdd, onRemove }: Props) {
  const [form, setForm] = useState(emptyForm)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    onAdd({
      id: crypto.randomUUID(),
      name: form.name.trim(),
      muscleGroup: form.muscleGroup.trim() || 'General',
      repRangeLow: form.repRangeLow,
      repRangeHigh: form.repRangeHigh,
      weightIncrement: form.weightIncrement,
    })
    setForm(emptyForm)
  }

  return (
    <div className="panel">
      <h2>Exercises</h2>
      <form className="exercise-form" onSubmit={handleSubmit}>
        <input
          placeholder="Exercise name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Muscle group"
          value={form.muscleGroup}
          onChange={(e) => setForm({ ...form, muscleGroup: e.target.value })}
        />
        <label>
          Rep range
          <input
            type="number"
            min={1}
            value={form.repRangeLow}
            onChange={(e) => setForm({ ...form, repRangeLow: Number(e.target.value) })}
          />
          -
          <input
            type="number"
            min={1}
            value={form.repRangeHigh}
            onChange={(e) => setForm({ ...form, repRangeHigh: Number(e.target.value) })}
          />
        </label>
        <label>
          Smallest weight jump
          <input
            type="number"
            min={0}
            step={0.5}
            value={form.weightIncrement}
            onChange={(e) => setForm({ ...form, weightIncrement: Number(e.target.value) })}
          />
        </label>
        <button type="submit">Add exercise</button>
      </form>

      <ul className="exercise-list">
        {exercises.map((ex) => (
          <li key={ex.id}>
            <div>
              <strong>{ex.name}</strong>
              <span className="muted">
                {' '}
                &middot; {ex.muscleGroup} &middot; {ex.repRangeLow}-{ex.repRangeHigh} reps &middot; +
                {ex.weightIncrement}
              </span>
            </div>
            <button className="link-btn" onClick={() => onRemove(ex.id)}>
              Remove
            </button>
          </li>
        ))}
        {exercises.length === 0 && <p className="muted">No exercises yet. Add one above.</p>}
      </ul>
    </div>
  )
}
