import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { embed } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { source, question, answer, tags } = body

    if (!source || !question || !answer) {
      return NextResponse.json(
        { error: 'source, question, and answer are required' },
        { status: 400 }
      )
    }

    // Embed the question text for future similarity retrieval
    const embedding = await embed(question)

    const { data, error } = await supabase
      .from('qa_items')
      .insert({
        source,
        question,
        answer,
        tags: tags ?? [],
        embedding,
      })
      .select('id, source, question, answer, tags, created_at')
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
