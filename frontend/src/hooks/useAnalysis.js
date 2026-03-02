import { useState } from 'react'

const API_BASE = '/api'

export function useAnalysis() {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState('')
  const [error, setError] = useState(null)

  async function analyzePaper(sessionId, file) {
    setLoading(true)
    setError(null)
    setAnalysis(null)

    try {
      // FormData is how you send a file upload over fetch — the browser handles
      // setting the correct multipart/form-data Content-Type header automatically.
      const formData = new FormData()
      formData.append('file', file)

      setStage('Extracting paper text...')

      const res = await fetch(`${API_BASE}/analyze-paper?session_id=${sessionId}`, {
        method: 'POST',
        body: formData,
      })

      setStage('Running AI analysis...')

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Analysis failed')
      }

      setStage('Processing results...')
      const data = await res.json()
      setAnalysis(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
      setStage('')
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

  return { analysis, loading, stage, error, analyzePaper, saveContext }
}
