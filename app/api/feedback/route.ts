import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { raw_prompt, upgraded_prompt, highlighted_text, note, feedback_type } = body

    if (!raw_prompt || !upgraded_prompt || !note || !feedback_type) {
      return NextResponse.json(
        { error: 'raw_prompt, upgraded_prompt, note, and feedback_type are required' },
        { status: 400 }
      )
    }

    if (!['inline', 'general'].includes(feedback_type)) {
      return NextResponse.json(
        { error: 'feedback_type must be "inline" or "general"' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('upgrade_feedback')
      .insert({
        raw_prompt,
        upgraded_prompt,
        highlighted_text: highlighted_text ?? null,
        note,
        feedback_type,
      })
      .select('id, created_at')
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
