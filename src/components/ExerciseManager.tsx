import { useState, type FormEvent } from 'react'
import type { Exercise } from '../types'

interface Props {
  exercises: Exercise[]
  onAdd: (exercise: Exercise) => void
  onRemove: (id: string) => void
  onUpdate: (exercise: Exercise) => void
}

const emptyForm = {
  name: '',
  muscleGroup: '',
  repRangeLow: 8,
  repRangeHigh: 12,
  weightIncrement: 2.5,
}

export function ExerciseManager({ exercises, onAdd, onRemove, onUpdate }: Props) {
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(emptyForm)

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

  function startEdit(exercise: Exercise) {
    setEditingId(exercise.id)
    setEditForm({
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      repRangeLow: exercise.repRangeLow,
      repRangeHigh: exercise.repRangeHigh,
      weightIncrement: exercise.weightIncrement,
    })
  }

  function cancelEdit() {
    setEditingId(null)
  }

  function saveEdit(id: string) {
    if (!editForm.name.trim()) return
    onUpdate({
      id,
      name: editForm.name.trim(),
      muscleGroup: editForm.muscleGroup.trim() || 'General',
      repRangeLow: editForm.repRangeLow,
      repRangeHigh: editForm.repRangeHigh,
      weightIncrement: editForm.weightIncrement,
    })
    setEditingId(null)
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
          <div className="rep-range-inputs">
            <input
              type="number"
              min={1}
              value={form.repRangeLow}
              onChange={(e) => setForm({ ...form, repRangeLow: Number(e.target.value) })}
            />
            <span>-</span>
            <input
              type="number"
              min={1}
              value={form.repRangeHigh}
              onChange={(e) => setForm({ ...form, repRangeHigh: Number(e.target.value) })}
            />
          </div>
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
        {exercises.map((ex) =>
          editingId === ex.id ? (
            <li key={ex.id} className="exercise-list-item-editing">
              <div className="exercise-form">
                <input
                  placeholder="Exercise name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
                <input
                  placeholder="Muscle group"
                  value={editForm.muscleGroup}
                  onChange={(e) => setEditForm({ ...editForm, muscleGroup: e.target.value })}
                />
                <label>
                  Rep range
                  <div className="rep-range-inputs">
                    <input
                      type="number"
                      min={1}
                      value={editForm.repRangeLow}
                      onChange={(e) => setEditForm({ ...editForm, repRangeLow: Number(e.target.value) })}
                    />
                    <span>-</span>
                    <input
                      type="number"
                      min={1}
                      value={editForm.repRangeHigh}
                      onChange={(e) => setEditForm({ ...editForm, repRangeHigh: Number(e.target.value) })}
                    />
                  </div>
                </label>
                <label>
                  Smallest weight jump
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={editForm.weightIncrement}
                    onChange={(e) => setEditForm({ ...editForm, weightIncrement: Number(e.target.value) })}
                  />
                </label>
                <button type="button" className="link-btn" onClick={cancelEdit}>
                  Cancel
                </button>
                <button type="button" onClick={() => saveEdit(ex.id)}>
                  Save
                </button>
              </div>
            </li>
          ) : (
            <li key={ex.id}>
              <div>
                <strong>{ex.name}</strong>
                <span className="muted">
                  {' '}
                  &middot; {ex.muscleGroup} &middot; {ex.repRangeLow}-{ex.repRangeHigh} reps &middot; +
                  {ex.weightIncrement}
                </span>
              </div>
              <div className="exercise-list-actions">
                <button className="link-btn" onClick={() => startEdit(ex)}>
                  Edit
                </button>
                <button className="link-btn" onClick={() => onRemove(ex.id)}>
                  Remove
                </button>
              </div>
            </li>
          ),
        )}
        {exercises.length === 0 && <p className="muted">No exercises yet. Add one above.</p>}
      </ul>
    </div>
  )
}
