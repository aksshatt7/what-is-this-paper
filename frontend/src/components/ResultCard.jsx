export default function ResultCard({ analysis }) {
  const { paper_summary, relevance, suggestions } = analysis

  const scoreColor =
    relevance.relevance_score >= 7
      ? 'text-emerald-400'
      : relevance.relevance_score >= 4
        ? 'text-yellow-400'
        : 'text-red-400'

  const difficultyStyles = {
    easy: 'bg-emerald-900 text-emerald-300',
    medium: 'bg-yellow-900 text-yellow-300',
    hard: 'bg-red-900 text-red-300',
  }

  return (
    <div className="space-y-4">
      {/* Relevance score */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-200">Relevance</h3>
          <span className={`text-2xl font-bold ${scoreColor}`}>
            {relevance.relevance_score}/10
          </span>
        </div>
        <p className="text-xs text-gray-400">{relevance.relevance_reasoning}</p>
      </div>

      {/* Paper summary */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <h3 className="text-sm font-medium text-gray-200 mb-1">
          {paper_summary.title || 'Paper Summary'}
        </h3>
        <p className="text-xs text-gray-400 mb-3">{paper_summary.main_contribution}</p>
        <div className="flex flex-wrap gap-1">
          {paper_summary.methods_used?.map((method) => (
            <span
              key={method}
              className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded"
            >
              {method}
            </span>
          ))}
        </div>
      </div>

      {/* Concept mappings */}
      {relevance.concept_mappings?.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <h3 className="text-sm font-medium text-gray-200 mb-3">Concept Connections</h3>
          <div className="space-y-2">
            {relevance.concept_mappings.map((mapping, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="text-blue-400 font-mono bg-blue-950 px-2 py-0.5 rounded">
                  {mapping.paper_concept}
                </span>
                <span className="text-gray-500">→</span>
                <span className="text-gray-300">{mapping.user_pipeline_equivalent}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      <div>
        <h3 className="text-sm font-medium text-gray-200 mb-3">Suggested Applications</h3>
        <div className="space-y-3">
          {suggestions?.map((suggestion, i) => (
            <div key={i} className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-200">{suggestion.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${difficultyStyles[suggestion.difficulty] ?? ''}`}>
                  {suggestion.difficulty}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-2">{suggestion.description}</p>
              {suggestion.caveats && (
                <p className="text-xs text-gray-500 italic">⚠ {suggestion.caveats}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
