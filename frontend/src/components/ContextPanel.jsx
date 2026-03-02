import { useState } from 'react'

export default function ContextPanel({ sessionId, onContextSaved, contextSaved, saveContext, demoContext, onDemo }) {
  const [context, setContext] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [fileLoaded, setFileLoaded] = useState(null)
  const [demoing, setDemoing] = useState(false)

  // FileReader API: reads a local file as text without uploading it to a server.
  // We use this to let users load their .py or .ipynb files directly into the textarea.
  function handleFileLoad(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      setContext(event.target.result)
      setFileLoaded(file.name)
    }
    reader.readAsText(file)
  }

  async function handleSave() {
    if (!context.trim()) return
    setSaving(true)
    setSaveError(null)
    try {
      await saveContext(sessionId, context)
      onContextSaved()
    } catch (e) {
      setSaveError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDemo() {
    setDemoing(true)
    setContext(demoContext)
    try {
      await onDemo()
    } finally {
      setDemoing(false)
    }
  }

  return (
    <div className="flex flex-col p-6 overflow-y-auto">
      <div className="mb-4">
        <h2 className="font-medium text-gray-200">Your Research Context</h2>
        <p className="text-xs text-gray-400 mt-1">
          Describe your pipeline, paste code, or upload a script or notebook.
        </p>
      </div>

      {/* Demo + file loader row */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <button
          onClick={handleDemo}
          disabled={demoing}
          className="text-xs border border-blue-700 rounded px-3 py-1.5 bg-blue-950 hover:bg-blue-900 text-blue-300 hover:text-blue-100 transition-colors disabled:opacity-50"
        >
          {demoing ? 'Loading demo...' : 'Try a demo'}
        </button>

        <label className="cursor-pointer">
          <span className="text-xs border border-gray-700 rounded px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors">
            Upload file (.py, .ipynb, .txt)
          </span>
          <input
            type="file"
            accept=".py,.ipynb,.txt,.md"
            className="hidden"
            onChange={handleFileLoad}
          />
        </label>
        {fileLoaded && (
          <p className="text-xs text-emerald-400">Loaded: {fileLoaded}</p>
        )}
      </div>

      <textarea
        className="flex-1 min-h-96 bg-gray-900 border border-gray-700 rounded p-3 text-sm text-gray-200 font-mono resize-none focus:outline-none focus:border-gray-500 placeholder-gray-600"
        placeholder="Describe your research pipeline or paste your code here..."
        value={context}
        onChange={(e) => setContext(e.target.value)}
      />

      {saveError && (
        <p className="text-xs text-red-400 mt-2">{saveError}</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving || !context.trim()}
        className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-500 rounded text-sm font-medium transition-colors"
      >
        {saving ? 'Saving...' : contextSaved ? '✓ Context Saved' : 'Set Context'}
      </button>
    </div>
  )
}
