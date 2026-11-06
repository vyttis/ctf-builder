import { describe, expect, it } from "vitest"
import {
  clockFromRow,
  deadlineMs,
  pauseOffsetAtStart,
  secondsLeft,
  secondsRunning,
  type GameClock,
} from "@/lib/game/clock"

const MIN = 60_000
const T0 = Date.parse("2026-11-06T10:00:00Z")

describe("game clock", () => {
  it("reads the row and treats a zero limit as none", () => {
    expect(clockFromRow({ settings: { time_limit_minutes: 30 }, paused_ms: "120000", paused_at: null })).toEqual({
      limitMinutes: 30,
      pausedMs: 120000,
      pausedAt: null,
    })
    expect(clockFromRow({ settings: { time_limit_minutes: 0 } }).limitMinutes).toBeNull()
    expect(clockFromRow({ settings: null }).limitMinutes).toBeNull()
  })

  it("gives back a finished pause", () => {
    const clock: GameClock = { limitMinutes: 30, pausedMs: 5 * MIN, pausedAt: null }
    expect(deadlineMs(clock, T0, 0, T0 + 20 * MIN)).toBe(T0 + 35 * MIN)
  })

  it("stands still while paused", () => {
    const clock: GameClock = { limitMinutes: 30, pausedMs: 0, pausedAt: new Date(T0 + 10 * MIN).toISOString() }
    const at12 = secondsLeft(clock, T0, 0, T0 + 12 * MIN)
    const at15 = secondsLeft(clock, T0, 0, T0 + 15 * MIN)
    expect(at12).toBe(20 * 60)
    expect(at15).toBe(20 * 60)
  })

  it("does not give a late team the pauses before it started", () => {
    // 5 minutes of pause happened before the team joined.
    const clock: GameClock = { limitMinutes: 30, pausedMs: 5 * MIN, pausedAt: null }
    const offset = pauseOffsetAtStart(clock, T0)
    expect(offset).toBe(5 * MIN)
    expect(deadlineMs(clock, T0, offset, T0 + MIN)).toBe(T0 + 30 * MIN)
  })

  it("credits the rest of a pause a team started in", () => {
    // Paused at 10:00; the team starts at 10:02; resumed at 10:05.
    const paused: GameClock = { limitMinutes: 30, pausedMs: 0, pausedAt: new Date(T0).toISOString() }
    const offset = pauseOffsetAtStart(paused, T0 + 2 * MIN)
    const resumed: GameClock = { limitMinutes: 30, pausedMs: 5 * MIN, pausedAt: null }
    expect(deadlineMs(resumed, T0 + 2 * MIN, offset, T0 + 10 * MIN)).toBe(T0 + 2 * MIN + 30 * MIN + 3 * MIN)
  })

  it("has no deadline without a limit and counts running time without pauses", () => {
    const clock: GameClock = { limitMinutes: null, pausedMs: 2 * MIN, pausedAt: null }
    expect(deadlineMs(clock, T0, 0, T0)).toBeNull()
    expect(secondsLeft(clock, T0, 0, T0)).toBeNull()
    expect(secondsRunning(clock, T0, T0 + 10 * MIN)).toBe(8 * 60)
  })
})
