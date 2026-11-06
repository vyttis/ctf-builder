/**
 * Hints can take at most half of a task's points: a team that solved a task
 * with every hint still earns something for it (a 50-point task with three
 * 20-point hints used to give 0, as if unsolved).
 */
export function hintPenaltyCap(basePoints: number): number {
  return Math.floor(Math.max(0, basePoints) / 2)
}

/** Points taken for the hints a team opened on a task. */
export function hintDeduction(basePoints: number, hintsUsed: number, hintPenalty: number = 20): number {
  return Math.min(Math.max(0, hintsUsed) * Math.max(0, hintPenalty), hintPenaltyCap(basePoints))
}

export function calculatePoints(basePoints: number, hintsUsed: number, hintPenalty: number = 20): number {
  return Math.max(0, basePoints - hintDeduction(basePoints, hintsUsed, hintPenalty))
}

/** What opening one more hint costs now (0 once the cap is reached). */
export function nextHintCost(basePoints: number, opened: number, hintPenalty: number): number {
  return hintDeduction(basePoints, opened + 1, hintPenalty) - hintDeduction(basePoints, opened, hintPenalty)
}
