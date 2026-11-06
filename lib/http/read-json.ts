import { UPLOAD_LIMIT_TEXT } from "@/lib/upload-limits"

/**
 * Reads a JSON answer from our API without ever showing the facilitator a
 * parser error ("Unexpected token…"): when the server or the hosting
 * platform answers with something else (an HTML error page, a too large
 * file), a Lithuanian message for that status comes back as `error`.
 */
export async function readJson<T extends object>(res: Response): Promise<T & { error?: string }> {
  try {
    return (await res.json()) as T & { error?: string }
  } catch {
    return { error: messageForStatus(res.status) } as T & { error?: string }
  }
}

export function messageForStatus(status: number): string {
  if (status === 413) return `Failas per didelis. Didžiausias dydis ${UPLOAD_LIMIT_TEXT}.`
  if (status === 401 || status === 403) return "Sesija baigėsi. Prisijunkite iš naujo."
  if (status === 429) return "Per daug užklausų. Palaukite minutę."
  if (status === 504) return "Serveris neatsakė laiku. Bandykite dar kartą."
  if (status >= 500) return "Serverio klaida. Bandykite dar kartą."
  return "Nepavyko. Bandykite dar kartą."
}
