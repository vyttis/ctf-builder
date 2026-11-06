import { describe, expect, it } from "vitest"
import { defaultTaskStageIndexes, reviewTask, safeIssues, stageToTask } from "@/lib/lesson-plans/convert"
import { lessonPlanContentSchema, lessonStageSchema } from "@/lib/lesson-plans/schema"

const stage = (overrides: Record<string, unknown> = {}) => ({
  activity_type: "challenge",
  title: "Vidurkis",
  description: "Apskaičiuok vidurkį.",
  type: "number",
  correct_answer: "143",
  options: null,
  hints: ["Sudėk", "Padalink"],
  explanation: "715 / 5 = 143",
  points: 150,
  difficulty: "medium",
  ...overrides,
})

describe("defaultTaskStageIndexes", () => {
  it("picks only the task stages", () => {
    const stages = [
      stage({ activity_type: "intro" }),
      stage(),
      stage({ activity_type: "discussion" }),
      stage(),
      stage({ activity_type: "reflection" }),
    ]
    expect(defaultTaskStageIndexes(stages)).toEqual([1, 3])
  })

  it("is empty for a plan without task stages", () => {
    expect(defaultTaskStageIndexes([stage({ activity_type: "intro" })])).toEqual([])
  })
})

describe("stageToTask", () => {
  it("keeps a usable answer and cleans the fields", () => {
    const task = stageToTask(stage({ title: "  Vidurkis  ", hints: ["Sudėk", " ", "sudėk", "Padalink"], points: 5000 }))
    expect(task.answer).toBe("143")
    expect(task.problem).toBeNull()
    expect(task.title).toBe("Vidurkis")
    expect(task.hints).toEqual(["Sudėk", "Padalink"])
    expect(task.points).toBe(1000)
    expect(task.options).toBeNull()
  })

  it("accepts Lithuanian number spellings", () => {
    expect(stageToTask(stage({ correct_answer: "2,5" })).answer).toBe("2,5")
    expect(stageToTask(stage({ correct_answer: 42 })).answer).toBe("42")
  })

  it("leaves out an answer a number task cannot match", () => {
    const task = stageToTask(stage({ correct_answer: "apie 143 cm" }))
    expect(task.answer).toBeNull()
    expect(task.problem).toMatch(/nėra skaičius/)
  })

  it("leaves out a missing or too long answer", () => {
    expect(stageToTask(stage({ correct_answer: "  " })).answer).toBeNull()
    expect(stageToTask(stage({ type: "text", correct_answer: "x".repeat(501) })).answer).toBeNull()
  })

  it("takes the exact spelling of the matching choice", () => {
    const task = stageToTask(
      stage({ type: "multiple_choice", correct_answer: " personifikacija", options: ["Hiperbolė", "Personifikacija", "Anafora"] })
    )
    expect(task.answer).toBe("Personifikacija")
  })

  it("leaves out a choice answer that is not among the options", () => {
    const task = stageToTask(stage({ type: "multiple_choice", correct_answer: "Metafora", options: ["Hiperbolė", "Anafora"] }))
    expect(task.answer).toBeNull()
    expect(task.problem).toMatch(/nėra tarp variantų/)
    expect(task.problem).not.toContain("Metafora")
  })

  it("needs two distinct options for a choice task", () => {
    const task = stageToTask(stage({ type: "multiple_choice", correct_answer: "Taip", options: ["Taip", "taip", ""] }))
    expect(task.options).toEqual(["Taip"])
    expect(task.answer).toBeNull()
  })

  it("treats an unknown type as text", () => {
    expect(stageToTask(stage({ type: "essay", correct_answer: "Vilnius" })).type).toBe("text")
  })
})

describe("safeIssues", () => {
  it("hides notes that quote the answer", () => {
    expect(safeIssues(["Atsakymas 143 gali būti netikslus", "Aprašymas neaiškus"], "143")).toEqual([
      "DI abejoja atsakymu. Patikrinkite jį.",
      "Aprašymas neaiškus",
    ])
  })

  it("keeps notes as they are without an answer to hide, and at most five", () => {
    const issues = Array.from({ length: 8 }, (_, i) => `Pastaba ${i}`)
    expect(safeIssues(issues, null)).toHaveLength(5)
  })
})

describe("reviewTask", () => {
  const usable = stageToTask(stage())

  it("passes a checked task with its answer", () => {
    expect(reviewTask(usable, { verdict: "pass", issues: [], confidence: 0.9 })).toEqual({
      keepAnswer: true,
      verdict: "pass",
      issues: [],
      confidence: 0.9,
    })
  })

  it("keeps a doubtful answer and marks it for review", () => {
    const review = reviewTask(usable, { verdict: "uncertain", issues: ["Gal 143 cm?"], confidence: 0.4 })
    expect(review.keepAnswer).toBe(true)
    expect(review.verdict).toBe("uncertain")
    expect(review.issues.join(" ")).not.toContain("143")
  })

  it("keeps the answer when the check faults the task, and marks it for review", () => {
    const review = reviewTask(usable, { verdict: "fail", issues: ["Užuomina atskleidžia atsakymą"], confidence: 0.8 })
    expect(review).toMatchObject({ keepAnswer: true, verdict: "fail", issues: ["Užuomina atskleidžia atsakymą"] })
  })

  it("gives a faulted task a note even when the check gave none", () => {
    expect(reviewTask(usable, { verdict: "fail", issues: [], confidence: 0.6 }).issues).toEqual([
      "DI patikra rado galimą klaidą.",
    ])
  })

  it("marks an unchecked task for review", () => {
    expect(reviewTask(usable, null)).toMatchObject({ keepAnswer: true, verdict: "uncertain" })
  })

  it("fails a task without a usable answer whatever the check says", () => {
    const broken = stageToTask(stage({ correct_answer: "" }))
    expect(reviewTask(broken, { verdict: "pass", issues: [], confidence: 1 })).toMatchObject({
      keepAnswer: false,
      verdict: "fail",
    })
  })
})

describe("lesson plan schemas", () => {
  it("brings points and minutes into range instead of refusing", () => {
    const parsed = lessonStageSchema.parse(stage({ points: -5, duration_minutes: 500 }))
    expect(parsed.points).toBe(1)
    expect(parsed.duration_minutes).toBe(90)
  })

  it("limits the title the same way for new and edited plans", () => {
    expect(lessonPlanContentSchema.safeParse({ title: "x".repeat(201), stages: [stage()] }).success).toBe(false)
  })

  it("refuses a plan without stages", () => {
    const result = lessonPlanContentSchema.safeParse({ title: "Planas", stages: [] })
    expect(result.success).toBe(false)
  })

  it("does not let an edit change who owns the plan or its status", () => {
    const parsed = lessonPlanContentSchema.parse({
      title: "Planas",
      stages: [stage()],
      teacher_id: "someone-else",
      status: "draft",
      source_game_id: null,
    })
    expect(parsed).not.toHaveProperty("teacher_id")
    expect(parsed).not.toHaveProperty("status")
    expect(parsed).not.toHaveProperty("source_game_id")
  })
})
