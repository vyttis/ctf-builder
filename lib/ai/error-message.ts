/**
 * Maps an AI SDK error to a fixed Lithuanian message for the teacher UI.
 * Raw SDK errors (English, with provider names and request ids) must never
 * reach the browser; details stay in the server log.
 */
export function friendlyAiError(error: unknown, fallback: string): string {
  const errMsg = (error instanceof Error ? error.message : String(error)).toLowerCase()

  if (
    errMsg.includes("credit balance") ||
    errMsg.includes("billing") ||
    errMsg.includes("authentication") ||
    errMsg.includes("api key") ||
    errMsg.includes("401") ||
    errMsg.includes("403")
  ) {
    return "DI paslauga laikinai nepasiekiama. Užduotis galite kurti rankiniu būdu, o apie gedimą praneškite administratoriui."
  }
  if (errMsg.includes("rate") || errMsg.includes("429")) {
    return "DI paslauga šiuo metu perkrauta. Bandykite po minutės."
  }
  if (errMsg.includes("overloaded") || errMsg.includes("529")) {
    return "DI paslauga laikinai perkrauta. Bandykite po minutės."
  }
  if (errMsg.includes("model")) {
    return "DI modelis šiuo metu neprieinamas. Bandykite vėliau."
  }
  return fallback
}
