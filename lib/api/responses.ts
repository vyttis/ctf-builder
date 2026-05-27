import { NextResponse } from "next/server"

// Standard error responses used across API routes.
// Use these to keep status codes + Lithuanian messages consistent.

export const unauthorized = () =>
  NextResponse.json({ error: "Neautorizuota" }, { status: 401 })

export const forbidden = (message = "Prieiga uždrausta") =>
  NextResponse.json({ error: message }, { status: 403 })

export const notFound = (message = "Nerasta") =>
  NextResponse.json({ error: message }, { status: 404 })

export const badRequest = (message: string) =>
  NextResponse.json({ error: message }, { status: 400 })

export const rateLimited = (message = "Per daug užklausų. Palaukite minutę.") =>
  NextResponse.json({ error: message }, { status: 429 })

export const serverError = (message = "Serverio klaida. Bandykite dar kartą.") =>
  NextResponse.json({ error: message }, { status: 500 })

export const serviceUnavailable = (message: string) =>
  NextResponse.json({ error: message }, { status: 503 })
