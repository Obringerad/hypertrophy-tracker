import { SPLIT_TEMPLATES } from './splitTemplates'

export interface CatalogExercise {
  name: string
  muscleGroup: string
  repRangeLow: number
  repRangeHigh: number
  weightIncrement: number
}

function ex(
  name: string,
  muscleGroup: string,
  repRangeLow = 8,
  repRangeHigh = 12,
  weightIncrement = 2.5,
): CatalogExercise {
  return { name, muscleGroup, repRangeLow, repRangeHigh, weightIncrement }
}

/** A hand-maintained databank of common exercises so a name typed into "add exercise" can be
 * recognized and assigned a sensible muscle group, rep range, and weight increment automatically,
 * without requiring the user to have trained it (or anything like it) before. */
const KNOWN_EXERCISES: CatalogExercise[] = [
  // Chest
  ex('Bench Press', 'Chest', 6, 10, 2.5),
  ex('Incline Bench Press', 'Chest', 6, 10, 2.5),
  ex('Decline Bench Press', 'Chest', 6, 10, 2.5),
  ex('Close-Grip Bench Press', 'Chest', 6, 10, 2.5),
  ex('Dumbbell Bench Press', 'Chest', 8, 12, 2.5),
  ex('Incline Dumbbell Press', 'Chest', 8, 12, 2.5),
  ex('Decline Dumbbell Press', 'Chest', 8, 12, 2.5),
  ex('Cable Fly', 'Chest', 12, 15, 2.5),
  ex('Dumbbell Fly', 'Chest', 10, 15, 1),
  ex('Pec Deck', 'Chest', 10, 15, 2.5),
  ex('Push-Up', 'Chest', 10, 20, 0),
  ex('Chest Dip', 'Chest', 8, 12, 5),
  ex('Chest Press Machine', 'Chest', 8, 12, 2.5),

  // Back
  ex('Deadlift', 'Back', 5, 8, 5),
  ex('Sumo Deadlift', 'Back', 5, 8, 5),
  ex('Romanian Deadlift', 'Back', 6, 10, 5),
  ex('Rack Pull', 'Back', 5, 8, 5),
  ex('Barbell Row', 'Back', 8, 12, 2.5),
  ex('Pendlay Row', 'Back', 6, 10, 2.5),
  ex('T-Bar Row', 'Back', 8, 12, 2.5),
  ex('Seated Cable Row', 'Back', 10, 15, 2.5),
  ex('Single-Arm Dumbbell Row', 'Back', 8, 12, 2.5),
  ex('Chest-Supported Row', 'Back', 8, 12, 2.5),
  ex('Lat Pulldown', 'Back', 8, 12, 2.5),
  ex('Pull-Up', 'Back', 5, 12, 0),
  ex('Chin-Up', 'Back', 5, 12, 0),
  ex('Straight-Arm Pulldown', 'Back', 10, 15, 2.5),
  ex('Hyperextension', 'Back', 10, 15, 0),

  // Shoulders
  ex('Overhead Press', 'Shoulders', 6, 10, 2.5),
  ex('Seated Dumbbell Press', 'Shoulders', 8, 12, 2.5),
  ex('Arnold Press', 'Shoulders', 8, 12, 2.5),
  ex('Push Press', 'Shoulders', 5, 8, 5),
  ex('Lateral Raise', 'Shoulders', 12, 15, 1),
  ex('Cable Lateral Raise', 'Shoulders', 12, 15, 1),
  ex('Front Raise', 'Shoulders', 10, 15, 1),
  ex('Rear Delt Fly', 'Shoulders', 12, 15, 1),
  ex('Face Pull', 'Shoulders', 12, 15, 2.5),
  ex('Upright Row', 'Shoulders', 8, 12, 2.5),
  ex('Shrug', 'Shoulders', 10, 15, 5),

  // Legs
  ex('Squat', 'Legs', 6, 10, 5),
  ex('Front Squat', 'Legs', 6, 10, 5),
  ex('Goblet Squat', 'Legs', 8, 12, 2.5),
  ex('Hack Squat', 'Legs', 8, 12, 5),
  ex('Leg Press', 'Legs', 8, 12, 5),
  ex('Bulgarian Split Squat', 'Legs', 8, 12, 2.5),
  ex('Walking Lunge', 'Legs', 8, 12, 2.5),
  ex('Dumbbell Lunge', 'Legs', 8, 12, 2.5),
  ex('Leg Curl', 'Legs', 10, 15, 2.5),
  ex('Leg Extension', 'Legs', 10, 15, 2.5),
  ex('Standing Calf Raise', 'Legs', 10, 15, 5),
  ex('Seated Calf Raise', 'Legs', 12, 15, 2.5),

  // Glutes
  ex('Hip Thrust', 'Glutes', 8, 12, 5),
  ex('Glute Bridge', 'Glutes', 10, 15, 5),
  ex('Cable Kickback', 'Glutes', 12, 15, 2.5),
  ex('Hip Abduction Machine', 'Glutes', 12, 15, 2.5),

  // Arms
  ex('Dumbbell Curl', 'Arms', 8, 12, 2.5),
  ex('Barbell Curl', 'Arms', 8, 12, 2.5),
  ex('Hammer Curl', 'Arms', 8, 12, 2.5),
  ex('Preacher Curl', 'Arms', 8, 12, 2.5),
  ex('Cable Curl', 'Arms', 10, 15, 2.5),
  ex('Concentration Curl', 'Arms', 10, 15, 1),
  ex('Triceps Pushdown', 'Arms', 10, 15, 2.5),
  ex('Overhead Triceps Extension', 'Arms', 10, 15, 2.5),
  ex('Skull Crusher', 'Arms', 8, 12, 2.5),
  ex('Triceps Dip', 'Arms', 8, 12, 5),

  // Core
  ex('Plank', 'Core', 30, 60, 0),
  ex('Cable Crunch', 'Core', 12, 15, 2.5),
  ex('Hanging Leg Raise', 'Core', 8, 15, 0),
  ex('Sit-Up', 'Core', 12, 20, 0),
  ex('Russian Twist', 'Core', 12, 20, 2.5),
  ex('Ab Wheel Rollout', 'Core', 8, 15, 0),
  ex('Bicycle Crunch', 'Core', 15, 25, 0),
]

/** Every exercise used across the built-in split templates, merged with the hand-maintained
 * KNOWN_EXERCISES databank above and deduped by name (the databank wins on a name collision, since
 * it carries more deliberately-chosen metadata). */
const ALL_CATALOG_EXERCISES: CatalogExercise[] = (() => {
  const seen = new Set<string>()
  const result: CatalogExercise[] = []
  const add = (e: CatalogExercise) => {
    const key = e.name.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    result.push(e)
  }
  for (const e of KNOWN_EXERCISES) add(e)
  for (const template of SPLIT_TEMPLATES) {
    for (const day of template.days) {
      for (const te of day.exercises) {
        add({
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

/** Looks up a typed exercise name against the databank (exact match, case-insensitive) so its
 * muscle group and other details can be filled in automatically instead of defaulting to blank. */
export function findCatalogExerciseByName(name: string): CatalogExercise | undefined {
  const key = name.trim().toLowerCase()
  if (!key) return undefined
  return ALL_CATALOG_EXERCISES.find((e) => e.name.toLowerCase() === key)
}

/** Every distinct muscle group name in the databank, for autocomplete suggestions. */
export const KNOWN_MUSCLE_GROUPS: string[] = Array.from(new Set(ALL_CATALOG_EXERCISES.map((e) => e.muscleGroup))).sort()
