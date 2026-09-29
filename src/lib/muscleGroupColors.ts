const FIXED_COLORS: Record<string, string> = {
  chest: '#4f8fe8',
  back: '#3ba55d',
  shoulders: '#e0a030',
  legs: '#b566e0',
  arms: '#e0616e',
  core: '#4fc3c9',
  glutes: '#e08ab0',
}

const FALLBACK_PALETTE = ['#4f8fe8', '#3ba55d', '#e0a030', '#b566e0', '#e0616e', '#4fc3c9', '#e08ab0', '#8a95a5']

/** A stable color per muscle group name - hand-picked for the common ones, hashed for anything
 * else (e.g. a custom group a user typed in), so the same name always renders the same color. */
export function muscleGroupColor(muscleGroup: string): string {
  const key = muscleGroup.trim().toLowerCase()
  const fixed = FIXED_COLORS[key]
  if (fixed) return fixed

  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  return FALLBACK_PALETTE[hash % FALLBACK_PALETTE.length]
}
