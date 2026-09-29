import { SPLIT_TEMPLATES } from './splitTemplates'

export interface CatalogExercise {
  name: string
  muscleGroup: string
  repRangeLow: number
  repRangeHigh: number
  weightIncrement: number
}

/** Every exercise used across the built-in split templates, deduped by name. Used to suggest
 * alternatives for a muscle group even when the user hasn't created other exercises for it yet. */
const ALL_CATALOG_EXERCISES: CatalogExercise[] = (() => {
  const seen = new Set<string>()
  const result: CatalogExercise[] = []
  for (const template of SPLIT_TEMPLATES) {
    for (const day of template.days) {
      for (const te of day.exercises) {
        const key = te.name.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        result.push({
          name: te.name,
          muscleGroup: te.muscleGroup,
          repRangeLow: te.repRangeLow,
          repRangeHigh: te.repRangeHigh,
          weightIncrement: te.weightIncrement,
        })
      }
    }
  }
  return result
})()

export function catalogExercisesForMuscleGroup(muscleGroup: string): CatalogExercise[] {
  const key = muscleGroup.trim().toLowerCase()
  return ALL_CATALOG_EXERCISES.filter((e) => e.muscleGroup.toLowerCase() === key)
}
