import { describe, expect, it } from "vitest"
import { forParticipant, hideUnopenedHints, orderForTeam, waitsForStart } from "@/lib/game/player-hints"

const task = (id: string, hints: unknown) => ({ id, title: id, hints })

describe("hideUnopenedHints", () => {
  it("keeps only the hints the team opened", () => {
    const [a, b] = hideUnopenedHints(
      [task("a", ["first", "second", "third"]), task("b", ["only"])],
      [
        { challenge_id: "a", hint_index: 1 },
        { challenge_id: "b", hint_index: 3 },
      ]
    )
    expect(a.hints).toEqual([null, "second", null])
    expect(b.hints).toEqual([null])
  })

  it("does not match an opened hint of another task", () => {
    const [a] = hideUnopenedHints([task("a", ["x"])], [{ challenge_id: "b", hint_index: 0 }])
    expect(a.hints).toEqual([null])
  })

  it("treats missing hints as none", () => {
    const [a] = hideUnopenedHints([task("a", null)], [])
    expect(a.hints).toEqual([])
  })
})

describe("forParticipant", () => {
  const state = {
    game: { id: "g", status: "active" },
    challenges: [task("a", ["hint"])],
    team: { id: "t" },
    solved: [],
  }

  it("sends no tasks without a team", () => {
    const out = forParticipant({ ...state, team: null }, [], "1:x") as { challenges: unknown[]; tasks_version: string }
    expect(out.challenges).toEqual([])
    expect(out.tasks_version).toBe("1:x")
  })

  it("sends a team its tasks with only opened hints", () => {
    const closed = forParticipant(state, [], null) as { challenges: { hints: unknown[] }[] }
    expect(closed.challenges[0].hints).toEqual([null])
    const opened = forParticipant(state, [{ challenge_id: "a", hint_index: 0 }], null) as {
      challenges: { hints: unknown[] }[]
    }
    expect(opened.challenges[0].hints).toEqual(["hint"])
  })

  it("passes other answers through", () => {
    expect(forParticipant(null, [], null)).toBeNull()
  })
})

describe("tasks of a timed activity wait for the team's start", () => {
  const timed = (status = "active", limit: unknown = 20) => ({
    game: { id: "g", status, settings: { time_limit_minutes: limit } },
    challenges: [task("a", ["hint"]), task("b", null)],
    team: { id: "t" },
    solved: [],
  })
  const notStarted = { startedAt: null, pauseOffsetMs: 0 }
  const started = { startedAt: "2026-11-06T18:00:00.000Z", pauseOffsetMs: 1500 }

  it("holds the tasks back and tells how many there are", () => {
    const out = forParticipant(timed(), [], "2:x", notStarted) as {
      challenges: unknown[]
      challenge_count: number
      awaiting_start: boolean
      team_started_at: string | null
    }
    expect(out.challenges).toEqual([])
    expect(out.challenge_count).toBe(2)
    expect(out.awaiting_start).toBe(true)
    expect(out.team_started_at).toBeNull()
  })

  it("sends the tasks and the start once the team started", () => {
    const out = forParticipant(timed(), [], "2:x", started) as {
      challenges: unknown[]
      awaiting_start: boolean
      team_started_at: string
      team_pause_offset_ms: number
    }
    expect(out.challenges).toHaveLength(2)
    expect(out.awaiting_start).toBe(false)
    expect(out.team_started_at).toBe(started.startedAt)
    expect(out.team_pause_offset_ms).toBe(1500)
  })

  it("does not hold back without a limit, after the end, or without the start read", () => {
    expect(waitsForStart(timed("active", null), notStarted)).toBe(false)
    expect(waitsForStart(timed("active", 0), notStarted)).toBe(false)
    expect(waitsForStart(timed("finished"), notStarted)).toBe(false)
    expect(waitsForStart(timed("paused"), notStarted)).toBe(true)
    expect(waitsForStart(timed(), null)).toBe(false)
    expect(waitsForStart({ ...timed(), team: null }, notStarted)).toBe(false)
  })
})

describe("orderForTeam and shuffling", () => {
  const tasks = Array.from({ length: 8 }, (_, i) => ({ id: `00000000-0000-4000-8000-00000000000${i}`, hints: [] as string[] }))

  it("gives each team its own stable order", () => {
    const a1 = orderForTeam(tasks, "team-a").map((t) => t.id)
    const a2 = orderForTeam([...tasks].reverse(), "team-a").map((t) => t.id)
    const b = orderForTeam(tasks, "team-b").map((t) => t.id)
    expect(a1).toEqual(a2)
    expect(a1).not.toEqual(b)
    expect([...a1].sort()).toEqual(tasks.map((t) => t.id).sort())
  })

  it("adds a new task without moving the others", () => {
    const before = orderForTeam(tasks.slice(0, 7), "team-a").map((t) => t.id)
    const after = orderForTeam(tasks, "team-a").map((t) => t.id).filter((id) => id !== tasks[7].id)
    expect(after).toEqual(before)
  })

  it("shuffles only when the activity asks for it", () => {
    const state = (shuffle: boolean) => ({ game: { settings: { shuffle_challenges: shuffle } }, team: { id: "team-a" }, challenges: tasks })
    const ids = (s: unknown) => (s as { challenges: { id: string }[] }).challenges.map((c) => c.id)
    expect(ids(forParticipant(state(false), [], null))).toEqual(tasks.map((t) => t.id))
    expect(ids(forParticipant(state(true), [], null))).toEqual(orderForTeam(tasks, "team-a").map((t) => t.id))
  })
})
