import type { Instrumentation } from "next"
import { installLithuanianValidation } from "@/lib/validation/zod-lt"

/** Runs once per server instance: API validation errors read in Lithuanian. */
export function register() {
  installLithuanianValidation()
}

/**
 * One structured log line per server error, so failures show up in Vercel's
 * runtime logs and error view with the route and digest needed to find them.
 * Request headers, query strings and bodies are deliberately not logged
 * (they can contain student names, tokens or answers).
 */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const error = err instanceof Error ? err : new Error(String(err))
  const digest =
    typeof err === "object" && err !== null && "digest" in err ? String(err.digest) : undefined

  console.error(
    JSON.stringify({
      event: "server_error",
      message: error.message.slice(0, 300),
      digest,
      method: request.method,
      path: request.path.split("?")[0],
      routePath: context.routePath,
      routeType: context.routeType,
      renderSource: "renderSource" in context ? context.renderSource : undefined,
    }),
  )
}
