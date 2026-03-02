import { useState } from 'react'
import ContextPanel from './components/ContextPanel'
import AnalysisPanel from './components/AnalysisPanel'
import { useAnalysis, LOADING_STAGES } from './hooks/useAnalysis'
import { DEMO_CONTEXT } from './demo'

// A fixed session ID is fine for a single-user portfolio project.
// For multi-user, you'd generate a UUID per browser session and store it in localStorage.
const SESSION_ID = 'user-session-1'

export default function App() {
  const [contextSaved, setContextSaved] = useState(false)
  const { analysis, loading, stageIndex, error, analyzePaper, saveContext, loadDemo } = useAnalysis()

  async function handleDemo() {
    await loadDemo(SESSION_ID)
    setContextSaved(true)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 px-6 py-4 flex items-baseline gap-3">
        <h1 className="text-base font-semibold tracking-tight">Research Paper Analyzer</h1>
        <span className="text-xs text-gray-500">Connect papers to your pipeline</span>
      </header>

      <main className="grid grid-cols-2 divide-x divide-gray-800" style={{ height: 'calc(100vh - 57px)' }}>
        <ContextPanel
          sessionId={SESSION_ID}
          saveContext={saveContext}
          onContextSaved={() => setContextSaved(true)}
          contextSaved={contextSaved}
          demoContext={DEMO_CONTEXT}
          onDemo={handleDemo}
        />
        <AnalysisPanel
          sessionId={SESSION_ID}
          contextSaved={contextSaved}
          onAnalyze={analyzePaper}
          analysis={analysis}
          loading={loading}
          stageIndex={stageIndex}
          loadingStages={LOADING_STAGES}
          error={error}
        />
      </main>
    </div>
  )
}
