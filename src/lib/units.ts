export type WeightUnit = 'lb' | 'kg'

export function formatWeight(weight: number, unit: WeightUnit): string {
  return `${weight} ${unit}`
}
