import { useState, useEffect } from 'react'
import { promptAPI } from '../services/api'
import { Link } from 'react-router-dom'

interface HistoryItem {
  id: number; original_prompt: string; optimized_prompt: string | null
  category: string | null; quality_score: number | null; created_at: string
}

export default function History() {
  const [items,   setItems]   = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    promptAPI.history().then(r => setItems(r.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-400 text-lg">Loading history…</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Optimization History</h1>
        {items.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-xl">No optimizations yet.</p>
            <Link to="/analyze" className="mt-4 inline-block text-indigo-600 font-semibold hover:underline">
              Go optimize a prompt →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map(it => (
              <div key={it.id} className="bg-white rounded-2xl shadow-md p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {it.category && (
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                        {it.category}
                      </span>
                    )}
                    {it.quality_score != null && (
                      <span className="text-xs text-gray-500 font-medium">
                        Score: {it.quality_score.toFixed(0)}/100
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(it.created_at).toLocaleDateString('en-GB')}
                  </span>
                </div>
                <p className="text-sm font-mono text-gray-700 bg-gray-50 rounded-lg p-3 mb-3 line-clamp-2">
                  {it.original_prompt}
                </p>
                {it.optimized_prompt && (
                  <p className="text-sm font-mono text-gray-700 bg-green-50 border border-green-200 rounded-lg p-3 line-clamp-2">
                    <span className="text-green-600 font-bold text-xs mr-1">OPTIMIZED:</span>
                    {it.optimized_prompt}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}