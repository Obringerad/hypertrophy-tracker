export interface TemplateExercise {
  name: string
  muscleGroup: string
  repRangeLow: number
  repRangeHigh: number
  weightIncrement: number
  targetSets: number
}

export interface TemplateDay {
  label: string
  exercises: TemplateExercise[]
}

export interface SplitTemplate {
  id: string
  name: string
  description: string
  days: TemplateDay[]
}

function ex(
  name: string,
  muscleGroup: string,
  targetSets = 3,
  repRangeLow = 8,
  repRangeHigh = 12,
  weightIncrement = 2.5,
): TemplateExercise {
  return { name, muscleGroup, repRangeLow, repRangeHigh, weightIncrement, targetSets }
}

export const SPLIT_TEMPLATES: SplitTemplate[] = [
  {
    id: 'full-body',
    name: 'Full Body',
    description: 'Two alternating full-body days. Good for 2-3 sessions a week.',
    days: [
      {
        label: 'Full Body A',
        exercises: [
          ex('Squat', 'Legs', 3, 6, 10, 5),
          ex('Bench Press', 'Chest', 3, 6, 10, 2.5),
          ex('Barbell Row', 'Back'),
          ex('Overhead Press', 'Shoulders'),
          ex('Plank', 'Core', 3, 30, 60, 0),
        ],
      },
      {
        label: 'Full Body B',
        exercises: [
          ex('Deadlift', 'Back', 3, 5, 8, 5),
          ex('Incline Dumbbell Press', 'Chest'),
          ex('Lat Pulldown', 'Back'),
          ex('Dumbbell Lunge', 'Legs'),
          ex('Cable Crunch', 'Core'),
        ],
      },
    ],
  },
  {
    id: 'upper-lower',
    name: 'Upper / Lower',
    description: 'Alternating upper and lower body days. Good for 4 sessions a week.',
    days: [
      {
        label: 'Upper',
        exercises: [
          ex('Bench Press', 'Chest', 3, 6, 10, 2.5),
          ex('Barbell Row', 'Back'),
          ex('Overhead Press', 'Shoulders'),
          ex('Lat Pulldown', 'Back'),
          ex('Dumbbell Curl', 'Arms'),
          ex('Triceps Pushdown', 'Arms'),
        ],
      },
      {
        label: 'Lower',
        exercises: [
          ex('Squat', 'Legs', 3, 6, 10, 5),
          ex('Romanian Deadlift', 'Legs', 3, 6, 10, 5),
          ex('Leg Press', 'Legs'),
          ex('Leg Curl', 'Legs'),
          ex('Standing Calf Raise', 'Legs', 4, 10, 15, 5),
        ],
      },
    ],
  },
  {
    id: 'push-pull-legs',
    name: 'Push / Pull / Legs',
    description: 'Classic 3-day rotation. Repeats automatically on 6-day schedules.',
    days: [
      {
        label: 'Push',
        exercises: [
          ex('Bench Press', 'Chest', 3, 6, 10, 2.5),
          ex('Overhead Press', 'Shoulders'),
          ex('Incline Dumbbell Press', 'Chest'),
          ex('Lateral Raise', 'Shoulders', 3, 12, 15, 1),
          ex('Triceps Pushdown', 'Arms'),
        ],
      },
      {
        label: 'Pull',
        exercises: [
          ex('Deadlift', 'Back', 3, 5, 8, 5),
          ex('Barbell Row', 'Back'),
          ex('Lat Pulldown', 'Back'),
          ex('Face Pull', 'Shoulders', 3, 12, 15, 2.5),
          ex('Dumbbell Curl', 'Arms'),
        ],
      },
      {
        label: 'Legs',
        exercises: [
          ex('Squat', 'Legs', 3, 6, 10, 5),
          ex('Romanian Deadlift', 'Legs', 3, 6, 10, 5),
          ex('Leg Press', 'Legs'),
          ex('Leg Curl', 'Legs'),
          ex('Standing Calf Raise', 'Legs', 4, 10, 15, 5),
        ],
      },
    ],
  },
  {
    id: 'bro-split',
    name: 'Bro Split',
    description: 'One muscle group focus per day. Good for 5 sessions a week.',
    days: [
      {
        label: 'Chest',
        exercises: [
          ex('Bench Press', 'Chest', 4, 6, 10, 2.5),
          ex('Incline Dumbbell Press', 'Chest'),
          ex('Cable Fly', 'Chest', 3, 12, 15, 2.5),
        ],
      },
      {
        label: 'Back',
        exercises: [
          ex('Deadlift', 'Back', 3, 5, 8, 5),
          ex('Barbell Row', 'Back'),
          ex('Lat Pulldown', 'Back'),
        ],
      },
      {
        label: 'Shoulders',
        exercises: [
          ex('Overhead Press', 'Shoulders'),
          ex('Lateral Raise', 'Shoulders', 4, 12, 15, 1),
          ex('Face Pull', 'Shoulders', 3, 12, 15, 2.5),
        ],
      },
      {
        label: 'Legs',
        exercises: [
          ex('Squat', 'Legs', 4, 6, 10, 5),
          ex('Leg Press', 'Legs'),
          ex('Leg Curl', 'Legs'),
          ex('Standing Calf Raise', 'Legs', 4, 10, 15, 5),
        ],
      },
      {
        label: 'Arms',
        exercises: [
          ex('Dumbbell Curl', 'Arms'),
          ex('Triceps Pushdown', 'Arms'),
          ex('Hammer Curl', 'Arms'),
          ex('Overhead Triceps Extension', 'Arms'),
        ],
      },
    ],
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Start from blank days and build your own split.',
    days: [],
  },
]
