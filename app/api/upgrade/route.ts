import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { embed } from '@/lib/gemini'
import type { QAMatch } from '@/lib/gemini'
import { upgradePromptWithClaude } from '@/lib/claude'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prompt } = body

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        { error: 'prompt is required' },
        { status: 400 }
      )
    }

    // Embed the raw prompt to find semantically similar Q&A items
    const embedding = await embed(prompt)

    // Retrieve top-3 relevant Q&A items via Supabase RPC
    const { data: matches, error } = await supabase.rpc('match_qa_items', {
      query_embedding: embedding,
      match_count: 3,
    })

    if (error) {
      throw new Error(`Supabase RPC error: ${error.message}`)
    }

    // Rewrite the prompt using Claude Opus 4.6 with the rubric + retrieved context
    const result = await upgradePromptWithClaude(prompt, (matches ?? []) as QAMatch[])

    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
