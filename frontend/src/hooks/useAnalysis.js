import { useState } from 'react'
import { DEMO_CONTEXT, DEMO_ANALYSIS } from '../demo'

const API_BASE = '/api'

export const LOADING_STAGES = [
  'Parsing PDF',
  'Extracting key methods',
  'Mapping to your context',
  'Generating suggestions',
]

export function useAnalysis() {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [stageIndex, setStageIndex] = useState(0)
  const [error, setError] = useState(null)

  async function analyzePaper(sessionId, file) {
    setLoading(true)
    setError(null)
    setAnalysis(null)
    setStageIndex(0)

    let idx = 0
    const stageTimer = setInterval(() => {
      idx = Math.min(idx + 1, LOADING_STAGES.length - 1)
      setStageIndex(idx)
    }, 3500)

    try {
      // FormData is how you send a file upload over fetch — the browser handles
      // setting the correct multipart/form-data Content-Type header automatically.
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`${API_BASE}/analyze-paper?session_id=${sessionId}`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Analysis failed')
      }

      const data = await res.json()
      setAnalysis(data)
    } catch (e) {
      setError(e.message)
    } finally {
      clearInterval(stageTimer)
      setLoading(false)
      setStageIndex(0)
    }
  }

  async function saveContext(sessionId, context) {
    const res = await fetch(`${API_BASE}/set-context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, context }),
    })
    if (!res.ok) throw new Error('Failed to save context')
  }

  async function loadDemo(sessionId) {
    // Save demo context to backend so follow-up real paper uploads work correctly.
    await saveContext(sessionId, DEMO_CONTEXT)
    setAnalysis(DEMO_ANALYSIS)
    setError(null)
  }

  return { analysis, loading, stageIndex, error, analyzePaper, saveContext, loadDemo }
}
