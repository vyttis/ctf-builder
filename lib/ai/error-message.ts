/**
 * Maps an AI SDK error to a fixed Lithuanian message for the teacher UI.
 * Raw SDK errors (English, with provider names and request ids) must never
 * reach the browser; details stay in the server log.
 */
export function friendlyAiError(error: unknown, fallback: string): string {
  const errMsg = (error instanceof Error ? error.message : String(error)).toLowerCase()
  // SDK messages start with the HTTP status ("401 {...}"): match the code only
  // there (request ids contain digits too) and error types by their exact
  // names, never loose words like "rate" (in "generate") or "model" (in
  // "Model returned no text block").
  const status = (code: number) => new RegExp(`^\\s*${code}(\\D|$)`).test(errMsg)

  if (
    errMsg.includes("credit balance") ||
    errMsg.includes("billing") ||
    errMsg.includes("authentication_error") ||
    errMsg.includes("permission_error") ||
    errMsg.includes("api key") ||
    status(401) ||
    status(403)
  ) {
    return "DI paslauga laikinai nepasiekiama. Užduotis galite kurti rankiniu būdu, o apie gedimą praneškite administratoriui."
  }
  if (errMsg.includes("rate_limit") || status(429)) {
    return "DI paslauga šiuo metu perkrauta. Bandykite po minutės."
  }
  if (errMsg.includes("overloaded") || status(529)) {
    return "DI paslauga laikinai perkrauta. Bandykite po minutės."
  }
  if (errMsg.includes("not_found_error") || errMsg.includes("model_not_found")) {
    return "DI modelis šiuo metu neprieinamas. Bandykite vėliau."
  }
  return fallback
}
