/**
 * Which stages become scored tasks when the facilitator does not choose:
 * only the "challenge" stages. An introduction, a discussion or a reflection
 * is led by the facilitator and has no single right answer to score.
 * (Kept apart from convert.ts so the browser does not load the answer hasher.)
 */
export function defaultTaskStageIndexes(stages: readonly { activity_type?: string | null }[]): number[] {
  return stages.flatMap((stage, i) => (stage.activity_type === "challenge" ? [i] : []))
}
