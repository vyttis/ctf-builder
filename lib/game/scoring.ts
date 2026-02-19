export function calculatePoints(
  basePoints: number,
  hintsUsed: number,
  hintPenalty: number = 20
): number {
  const penalty = hintsUsed * hintPenalty
  return Math.max(0, basePoints - penalty)
}
