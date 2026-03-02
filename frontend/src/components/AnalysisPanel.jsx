import { useRef, useState } from 'react'
import ResultCard from './ResultCard'

export default function AnalysisPanel({
  sessionId,
  contextSaved,
  onAnalyze,
  analysis,
  loading,
  stageIndex,
  loadingStages,
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

      {/* Multi-step loading indicator */}
      {loading && (
        <div className="py-8">
          <div className="space-y-4 max-w-xs mx-auto">
            {loadingStages.map((label, i) => {
              const done = i < stageIndex
              const active = i === stageIndex
              return (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
                    done
                      ? 'bg-emerald-600 border-emerald-600'
                      : active
                        ? 'border-blue-500'
                        : 'border-gray-700'
                  }`}>
                    {done && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {active && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    )}
                  </div>
                  <span className={`text-sm ${
                    done ? 'text-gray-600 line-through' : active ? 'text-gray-100' : 'text-gray-600'
                  }`}>
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
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
