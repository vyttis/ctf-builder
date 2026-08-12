import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Lithuanian pluralization: pluralizeLt(1, "taškas", "taškai", "taškų").
 *
 * one:  n % 10 === 1 && n % 100 !== 11        (1, 21, 31 … taškas)
 * few:  n % 10 in 2..9 && n % 100 not 11..19  (2-9, 22-29 … taškai)
 * many: everything else                       (0, 10-19, 20, 30 … taškų)
 */
export function pluralizeLt(
  n: number,
  one: string,
  few: string,
  many: string
): string {
  const mod10 = Math.abs(n) % 10
  const mod100 = Math.abs(n) % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 9 && (mod100 < 11 || mod100 > 19)) return few
  return many
}
