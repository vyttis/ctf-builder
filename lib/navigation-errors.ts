// notFound(), redirect() and similar navigation helpers work by throwing an
// error with a reserved digest. A user-level boundary must let those through,
// otherwise a missing game renders "Klaida" instead of the 404 page and a
// server-side redirect never happens.
const NEXT_NAVIGATION_DIGESTS = [
  "NEXT_NOT_FOUND",
  "NEXT_REDIRECT",
  "NEXT_HTTP_ERROR_FALLBACK",
  "DYNAMIC_SERVER_USAGE",
  "BAILOUT_TO_CLIENT_SIDE_RENDERING",
]

export function isNextNavigationError(error: unknown): boolean {
  const digest = (error as { digest?: unknown } | null)?.digest
  return (
    typeof digest === "string" &&
    NEXT_NAVIGATION_DIGESTS.some((prefix) => digest.startsWith(prefix))
  )
}
