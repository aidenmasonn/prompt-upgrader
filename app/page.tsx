'use client'

import { useState } from 'react'

interface QAResponse {
  id: string
  source: string
  question: string
  answer: string
  tags: string[]
}

interface UpgradeResponse {
  upgraded: string
  rationale: string[]
  usedMemory: Array<{ id: string; question: string }>
}

interface FeedbackNote {
  id: string
  highlighted_text?: string
  note: string
  feedback_type: 'inline' | 'general'
  created_at: string
}

export default function Home() {
  // ── Add Q&A state ──────────────────────────────────────────────────────────
  const [source, setSource] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [tags, setTags] = useState('')
  const [qaResult, setQAResult] = useState<QAResponse | null>(null)
  const [qaLoading, setQALoading] = useState(false)
  const [qaError, setQAError] = useState('')

  // ── Upgrade Prompt state ───────────────────────────────────────────────────
  const [rawPrompt, setRawPrompt] = useState('')
  const [upgradeResult, setUpgradeResult] = useState<UpgradeResponse | null>(null)
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const [upgradeError, setUpgradeError] = useState('')

  // ── Feedback state ─────────────────────────────────────────────────────────
  const [feedbackNotes, setFeedbackNotes] = useState<FeedbackNote[]>([])
  const [pendingHighlight, setPendingHighlight] = useState('')  // captured selected text
  const [pendingNote, setPendingNote] = useState('')            // note for current highlight
  const [generalNote, setGeneralNote] = useState('')           // general note textarea
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackError, setFeedbackError] = useState('')

  async function handleSaveQA() {
    setQALoading(true)
    setQAError('')
    setQAResult(null)
    try {
      const res = await fetch('/api/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source,
          question,
          answer,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save Q&A')
      }
      const data: QAResponse = await res.json()
      setQAResult(data)
      setSource('')
      setQuestion('')
      setAnswer('')
      setTags('')
    } catch (e: unknown) {
      setQAError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setQALoading(false)
    }
  }

  async function handleUpgrade() {
    setUpgradeLoading(true)
    setUpgradeError('')
    setUpgradeResult(null)
    // Reset feedback for the new upgrade run
    setFeedbackNotes([])
    setPendingHighlight('')
    setPendingNote('')
    setGeneralNote('')
    setFeedbackError('')
    try {
      const res = await fetch('/api/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: rawPrompt }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to upgrade prompt')
      }
      const data: UpgradeResponse = await res.json()
      setUpgradeResult(data)
    } catch (e: unknown) {
      setUpgradeError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setUpgradeLoading(false)
    }
  }

  async function saveFeedback(
    type: 'inline' | 'general',
    highlightedText?: string,
    noteText?: string
  ) {
    if (!upgradeResult) return
    const noteToSave = noteText ?? (type === 'general' ? generalNote : pendingNote)
    if (!noteToSave.trim()) return

    setFeedbackLoading(true)
    setFeedbackError('')
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_prompt: rawPrompt,
          upgraded_prompt: upgradeResult.upgraded,
          highlighted_text: highlightedText ?? null,
          note: noteToSave.trim(),
          feedback_type: type,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save feedback')
      }
      const data: { id: string; created_at: string } = await res.json()
      setFeedbackNotes((prev) => [
        ...prev,
        {
          id: data.id,
          highlighted_text: highlightedText,
          note: noteToSave.trim(),
          feedback_type: type,
          created_at: data.created_at,
        },
      ])
      if (type === 'inline') {
        setPendingHighlight('')
        setPendingNote('')
      } else {
        setGeneralNote('')
      }
    } catch (e: unknown) {
      setFeedbackError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setFeedbackLoading(false)
    }
  }

  function handleTextSelection() {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return
    const selectedText = selection.toString().trim()
    if (selectedText.length === 0) return
    // Only capture selections inside the upgraded prompt container
    const container = document.getElementById('upgraded-prompt')
    if (!container) return
    const range = selection.getRangeAt(0)
    if (!container.contains(range.commonAncestorContainer)) return
    setPendingHighlight(selectedText)
    setPendingNote('')
  }

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-10">
      <h1 className="text-2xl font-bold text-gray-900">Prompt Memory + Upgrader</h1>

      {/* ── Section 1: Add Q&A ─────────────────────────────────────────────── */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Add Q&amp;A to Memory</h2>

        <div className="space-y-3">
          <Field label="Source">
            <input
              className="input"
              placeholder="e.g. Claude docs, blog post, experiment..."
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </Field>

          <Field label="Question">
            <textarea
              className="input"
              rows={2}
              placeholder="What is the question or prompt pattern?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </Field>

          <Field label="Answer">
            <textarea
              className="input"
              rows={4}
              placeholder="What is the answer, insight, or technique?"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
          </Field>

          <Field label="Tags (comma-separated, optional)">
            <input
              className="input"
              placeholder="e.g. RAG, embeddings, few-shot"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </Field>
        </div>

        <button
          onClick={handleSaveQA}
          disabled={qaLoading || !source || !question || !answer}
          className="btn-blue"
        >
          {qaLoading ? 'Saving...' : 'Save to Memory'}
        </button>

        {qaError && <p className="text-red-600 text-sm">{qaError}</p>}

        {qaResult && (
          <div className="bg-green-50 border border-green-200 rounded p-3 text-sm">
            <p className="font-medium text-green-800">
              Saved! ID:{' '}
              <code className="font-mono text-green-700">{qaResult.id}</code>
            </p>
          </div>
        )}
      </section>

      {/* ── Section 2: Upgrade Prompt ──────────────────────────────────────── */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Upgrade a Prompt</h2>

        <Field label="Raw Prompt">
          <textarea
            className="input"
            rows={5}
            placeholder="Paste your draft prompt here..."
            value={rawPrompt}
            onChange={(e) => setRawPrompt(e.target.value)}
          />
        </Field>

        <button
          onClick={handleUpgrade}
          disabled={upgradeLoading || !rawPrompt.trim()}
          className="btn-purple"
        >
          {upgradeLoading ? 'Upgrading...' : 'Upgrade Prompt ▶'}
        </button>

        {upgradeError && <p className="text-red-600 text-sm">{upgradeError}</p>}

        {upgradeResult && (
          <div className="space-y-5 mt-2">

            {/* Two-column grid: Section A (left) + Feedback Panel (right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

              {/* ── Left: Section A — Upgraded Prompt ── */}
              <div>
                <SectionLabel>A) Upgraded Prompt</SectionLabel>
                {/* div instead of pre — enables reliable getSelection() containment check */}
                <div
                  id="upgraded-prompt"
                  onMouseUp={handleTextSelection}
                  className="bg-gray-900 text-green-300 rounded p-4 text-sm whitespace-pre-wrap font-mono leading-relaxed select-text cursor-text"
                >
                  {upgradeResult.upgraded}
                </div>
              </div>

              {/* ── Right: Feedback Panel ── */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">Feedback</h3>
                <p className="text-xs text-gray-400">Select text in the upgraded prompt to annotate it, or write a general note below.</p>

                {/* Saved notes list */}
                {feedbackNotes.length > 0 && (
                  <ul className="space-y-2">
                    {feedbackNotes.map((fn) => (
                      <li key={fn.id} className="text-xs bg-gray-50 border border-gray-100 rounded p-2 space-y-1">
                        {fn.highlighted_text && (
                          <p className="font-mono text-gray-500 truncate">
                            &ldquo;{fn.highlighted_text}&rdquo;
                          </p>
                        )}
                        <p className="text-gray-700">{fn.note}</p>
                        <p className="text-gray-400">{fn.feedback_type === 'inline' ? 'Highlight note' : 'General note'}</p>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Inline highlight note entry — shown when text is selected */}
                {pendingHighlight && (
                  <div className="space-y-2 border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-500">
                      Selected:{' '}
                      <span className="font-mono bg-yellow-100 px-1 rounded block mt-1 truncate">
                        &ldquo;{pendingHighlight.slice(0, 80)}{pendingHighlight.length > 80 ? '…' : ''}&rdquo;
                      </span>
                    </p>
                    <textarea
                      className="input text-xs"
                      rows={2}
                      placeholder="Add a note about this selection..."
                      value={pendingNote}
                      onChange={(e) => setPendingNote(e.target.value)}
                    />
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => saveFeedback('inline', pendingHighlight)}
                        disabled={feedbackLoading || !pendingNote.trim()}
                        className="btn-blue text-xs px-3 py-1"
                      >
                        {feedbackLoading ? 'Saving…' : 'Save Note'}
                      </button>
                      <button
                        onClick={() => { setPendingHighlight(''); setPendingNote('') }}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* General note — always visible */}
                <div className="space-y-2 border-t border-gray-100 pt-3">
                  <p className="text-xs font-medium text-gray-600">General note</p>
                  <textarea
                    className="input text-xs"
                    rows={3}
                    placeholder="Overall feedback about this upgrade..."
                    value={generalNote}
                    onChange={(e) => setGeneralNote(e.target.value)}
                  />
                  <button
                    onClick={() => saveFeedback('general')}
                    disabled={feedbackLoading || !generalNote.trim()}
                    className="btn-purple text-xs px-3 py-1"
                  >
                    {feedbackLoading ? 'Saving…' : 'Save General Note'}
                  </button>
                </div>

                {feedbackError && (
                  <p className="text-red-600 text-xs">{feedbackError}</p>
                )}
              </div>
            </div>

            {/* ── Section B: Rationale (full width) ── */}
            <div>
              <SectionLabel>B) Rationale</SectionLabel>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                {upgradeResult.rationale.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            {/* ── Section C: Used Memory (full width) ── */}
            <div>
              <SectionLabel>C) Used Memory</SectionLabel>
              {upgradeResult.usedMemory.length === 0 ? (
                <p className="text-sm text-gray-500">No memory items incorporated.</p>
              ) : (
                <ul className="space-y-1 text-sm text-gray-700">
                  {upgradeResult.usedMemory.map((m) => (
                    <li key={m.id} className="flex gap-2 items-start">
                      <code className="text-xs font-mono text-gray-400 mt-0.5 shrink-0">
                        {m.id.slice(0, 8)}…
                      </code>
                      <span>{m.question}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

// ── Small helper components ────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
      {children}
    </p>
  )
}
