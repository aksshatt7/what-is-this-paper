import { useRef, useState } from 'react'
import ResultCard from './ResultCard'

export default function AnalysisPanel({
  sessionId,
  contextSaved,
  onAnalyze,
  analysis,
  loading,
  stage,
  error,
}) {
  const fileInputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    if (!contextSaved) return
    const file = e.dataTransfer.files[0]
    if (file?.type === 'application/pdf') {
      onAnalyze(sessionId, file)
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files[0]
    if (file) onAnalyze(sessionId, file)
  }

  return (
    <div className="flex flex-col p-6 overflow-y-auto">
      <div className="mb-4">
        <h2 className="font-medium text-gray-200">Paper Analysis</h2>
        <p className="text-xs text-gray-400 mt-1">
          Upload a PDF to analyze it against your research context.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => contextSaved && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-10 text-center mb-6 transition-colors ${
          !contextSaved
            ? 'border-gray-800 opacity-40 cursor-not-allowed'
            : dragOver
              ? 'border-blue-500 bg-blue-950/20 cursor-pointer'
              : 'border-gray-600 hover:border-gray-400 cursor-pointer'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleFileSelect}
        />
        <p className="text-sm text-gray-400">
          {contextSaved ? 'Drop a PDF here or click to browse' : 'Set your research context first'}
        </p>
        {contextSaved && (
          <p className="text-xs text-gray-600 mt-1">.pdf files only</p>
        )}
      </div>

      {/* Loading state with stage label */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-400">{stage}</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-950 border border-red-800 rounded p-4 text-sm text-red-300 mb-4">
          {error}
        </div>
      )}

      {/* Results */}
      {analysis && !loading && <ResultCard analysis={analysis} />}
    </div>
  )
}
