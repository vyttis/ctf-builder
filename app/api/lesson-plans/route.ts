import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

const createSchema = z.object({
  title: z.string().min(1),
  subject: z.string().min(1),
  grade: z.number().min(1).max(12),
  topic: z.string().min(1),
  lesson_type: z.enum(["nauja_tema", "kartojimas", "vertinimas", "projektine_veikla"]),
  duration: z.number().min(25).max(90),
  goal: z.string().default(""),
  curriculum_link: z.string().default(""),
  stages: z.array(z.object({
    activity_type: z.enum(["intro", "challenge", "discussion", "reflection"]),
    title: z.string().min(1),
    description: z.string().min(1),
    type: z.enum(["text", "number", "multiple_choice"]),
    correct_answer: z.string().min(1),
    options: z.array(z.string()).nullable().default(null),
    hints: z.array(z.string()).default([]),
    explanation: z.string().default(""),
    points: z.number().default(100),
    duration_minutes: z.number().default(5),
    difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  })).min(1),
  reflection_prompt: z.string().default(""),
  teacher_methodical_note: z.string().default(""),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Neautorizuota" }, { status: 401 })
    }

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Netinkamas užklausos formatas" }, { status: 400 })
    }
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Neteisingi duomenys" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("lesson_plans")
      .insert({
        teacher_id: user.id,
        ...parsed.data,
        status: "saved",
      })
      .select()
      .single()

    if (error) {
      console.error("Lesson plan insert error:", error)
      return NextResponse.json({ error: "Nepavyko išsaugoti" }, { status: 500 })
    }

    return NextResponse.json({ lesson_plan: data }, { status: 201 })
  } catch (error) {
    console.error("Lesson plan API error:", error)
    return NextResponse.json({ error: "Serverio klaida" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Neautorizuota" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("lesson_plans")
      .select("*")
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: "Nepavyko gauti duomenų" }, { status: 500 })
    }

    return NextResponse.json({ lesson_plans: data })
  } catch (error) {
    console.error("Lesson plans GET error:", error)
    return NextResponse.json({ error: "Serverio klaida" }, { status: 500 })
  }
}
