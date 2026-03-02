import { useState } from 'react'

function formatAsMarkdown(analysis) {
  const { paper_summary, relevance, suggestions } = analysis
  const lines = []

  lines.push(`# Paper Analysis: ${paper_summary.title || 'Untitled'}`)
  lines.push('')
  lines.push(`**Domain:** ${paper_summary.domain}  **Relevance Score:** ${relevance.relevance_score}/10`)
  lines.push('')
  lines.push('## Summary')
  lines.push(paper_summary.main_contribution)
  lines.push('')
  lines.push('### Methods Used')
  paper_summary.methods_used?.forEach((m) => lines.push(`- ${m}`))
  lines.push('')
  lines.push('### Key Findings')
  paper_summary.key_findings?.forEach((f) => lines.push(`- ${f}`))
  lines.push('')
  lines.push('## Relevance to Your Research')
  lines.push(relevance.relevance_reasoning)
  lines.push('')

  if (relevance.applicable_areas?.length) {
    lines.push('### Applicable Areas')
    relevance.applicable_areas.forEach((a) => lines.push(`- ${a}`))
    lines.push('')
  }

  if (relevance.concept_mappings?.length) {
    lines.push('### Concept Connections')
    lines.push('| Paper Concept | Your Pipeline |')
    lines.push('|---|---|')
    relevance.concept_mappings.forEach((m) =>
      lines.push(`| ${m.paper_concept} | ${m.user_pipeline_equivalent} |`)
    )
    lines.push('')
  }

  lines.push('## Suggested Applications')
  suggestions?.forEach((s, i) => {
    lines.push(`### ${i + 1}. ${s.title} *(${s.difficulty})*`)
    lines.push(s.description)
    if (s.caveats) lines.push(`\n> ⚠ ${s.caveats}`)
    lines.push('')
  })

  return lines.join('\n')
}

export default function ResultCard({ analysis }) {
  const { paper_summary, relevance, suggestions } = analysis
  const [copied, setCopied] = useState(false)

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

  function handleCopy() {
    navigator.clipboard.writeText(formatAsMarkdown(analysis))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    const md = formatAsMarkdown(analysis)
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(paper_summary.title || 'paper-analysis').replace(/\s+/g, '-').toLowerCase()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const isLowRelevance = relevance.relevance_score <= 3

  return (
    <div className="space-y-4">
      {/* Low relevance banner */}
      {isLowRelevance && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs text-gray-400">
          This paper has low relevance to your research context. Suggestions below are speculative — consider finding a closer match.
        </div>
      )}

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

      {/* Export */}
      <div className="flex gap-2 pt-1 pb-2">
        <button
          onClick={handleCopy}
          className="text-xs border border-gray-700 rounded px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors"
        >
          {copied ? '✓ Copied!' : 'Copy as Markdown'}
        </button>
        <button
          onClick={handleDownload}
          className="text-xs border border-gray-700 rounded px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors"
        >
          Download .md
        </button>
      </div>
    </div>
  )
}
