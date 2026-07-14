import { useState } from 'react'
import { promptAPI } from '../services/api'
import { Link } from 'react-router-dom'

interface TokenCount { model: string; tokens: number; cost: number }
interface Analysis {
  category: string; quality_score: number; grade: string
  features: Record<string, number>; token_counts: TokenCount[]
  recommendations: string[]; recommended_model: string
}
interface Optimization {
  original_prompt: string; optimized_prompt: string; mode: string
  tokens_before: number; tokens_after: number
  cost_before: number; cost_after: number; savings_percent: number
}

function gradeColor(g: string) {
  if (g.startsWith('A')) return 'text-green-600'
  if (g.startsWith('B')) return 'text-blue-600'
  if (g.startsWith('C')) return 'text-yellow-600'
  return 'text-red-500'
}
function scoreBar(s: number) {
  if (s >= 80) return 'bg-green-500'
  if (s >= 60) return 'bg-blue-500'
  if (s >= 40) return 'bg-yellow-500'
  return 'bg-red-500'
}

export default function Dashboard() {
  const [prompt,   setPrompt]   = useState('')
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [optResult,setOptResult]= useState<Optimization | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [optMode,  setOptMode]  = useState<string | null>(null)
  const [error,    setError]    = useState('')
  const isAuth = !!localStorage.getItem('token')

  const analyze = async () => {
    if (!prompt.trim()) return
    setLoading(true); setError(''); setAnalysis(null); setOptResult(null)
    try {
      const r = await promptAPI.analyze(prompt)
      setAnalysis(r.data)
    } catch { setError('Analysis failed — is the backend running on port 8000?') }
    finally  { setLoading(false) }
  }

  const optimize = async (mode: string) => {
    if (!prompt.trim()) return
    setOptMode(mode); setOptResult(null); setError('')
    try {
      const r = await promptAPI.optimize(prompt, mode)
      setOptResult(r.data)
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } };
      if (error.response?.status === 401) setError('Login required to use optimization.')  
      else setError('Optimization failed — check your GROQ_API_KEY in .env')
    } finally { setOptMode(null) }
  }

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => alert('Clipboard unavailable'))
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-1">Prompt Analyzer</h1>
        <p className="text-gray-500 mb-8 text-sm">Classify, score, and optimize your prompts with hybrid ML</p>

        {/* Input */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Your Prompt</label>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
            placeholder='e.g. "You are a senior Python developer. I am building a REST API. Write a FastAPI authentication endpoint using JWT. Return JSON with access_token field."'
            className="w-full h-40 p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm bg-gray-50" />
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-gray-400">{prompt.split(/\s+/).filter(Boolean).length} words</span>
            <button onClick={analyze} disabled={loading || !prompt.trim()}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm">
              {loading ? '⏳ Analyzing…' : '🔍 Analyze Prompt'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">⚠️ {error}</div>
        )}

        {/* Results */}
        {analysis && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Score Card */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Quality Score</h2>
              <div className="flex items-center gap-6 mb-4">
                <span className={`text-7xl font-black leading-none ${gradeColor(analysis.grade)}`}>
                  {analysis.grade}
                </span>
                <div>
                  <div className="text-4xl font-bold text-gray-700">{analysis.quality_score}</div>
                  <div className="text-xs text-gray-400">out of 100</div>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 mb-4">
                <div className={`h-2.5 rounded-full transition-all ${scoreBar(analysis.quality_score)}`}
                     style={{ width: `${analysis.quality_score}%` }} />
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div>📁 <span className="font-medium">{analysis.category}</span></div>
                <div>⭐ Recommended: <span className="font-medium text-indigo-600">{analysis.recommended_model}</span></div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Recommendations</h2>
              {analysis.recommendations.length > 0 ? (
                <ul className="space-y-3">
                  {analysis.recommendations.map((r, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-700 bg-yellow-50 border border-yellow-100 rounded-lg p-3">
                      <span className="text-yellow-500 shrink-0">💡</span>{r}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 font-medium text-sm text-center">
                  ✅ Excellent prompt! No major improvements needed.
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Optimize Prompt {!isAuth && '(login required)'}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => optimize('PERFORMANCE')} disabled={!!optMode || !isAuth}
                    title={!isAuth ? 'Login to use optimization' : ''}
                    className="flex-1 py-2 px-3 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed font-semibold">
                    {optMode === 'PERFORMANCE' ? '⏳ Rewriting…' : '⚡ Performance'}
                  </button>
                  <button onClick={() => optimize('ECONOMY')} disabled={!!optMode || !isAuth}
                    title={!isAuth ? 'Login to use optimization' : ''}
                    className="flex-1 py-2 px-3 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed font-semibold">
                    {optMode === 'ECONOMY' ? '⏳ Compressing…' : '💰 Economy'}
                  </button>
                </div>
                {!isAuth && (
                  <p className="text-xs text-gray-400 mt-1.5 text-center">
                    <Link to="/login" className="text-indigo-500 hover:underline">Login</Link> or{' '}
                    <Link to="/register" className="text-indigo-500 hover:underline">register</Link> to optimize
                  </p>
                )}
              </div>
            </div>

            {/* Token Counts */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Token Counts & Costs</h2>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500">
                    <th className="text-left pb-2">Model</th>
                    <th className="text-right pb-2">Tokens</th>
                    <th className="text-right pb-2">Input Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.token_counts.map(tc => (
                    <tr key={tc.model}
                        className={`border-b border-gray-50 ${tc.model === analysis.recommended_model ? 'bg-indigo-50' : ''}`}>
                      <td className="py-1.5 font-medium text-gray-700">
                        {tc.model === analysis.recommended_model && <span className="text-indigo-500 mr-1">★</span>}
                        {tc.model}
                      </td>
                      <td className="py-1.5 text-right text-gray-600 tabular-nums">{tc.tokens.toLocaleString()}</td>
                      <td className="py-1.5 text-right text-gray-500 tabular-nums">${tc.cost.toFixed(6)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Feature Breakdown */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Feature Breakdown</h2>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(analysis.features)
                  .filter(([k]) => k.startsWith('has_'))
                  .map(([k, v]) => (
                    <div key={k} className={`flex items-center gap-2 p-2 rounded-lg text-xs
                      ${Number(v) > 0 ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-400'}`}>
                      <span>{Number(v) > 0 ? '✅' : '○'}</span>
                      <span className="capitalize">{k.replace('has_','').replace(/_/g,' ')}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Optimization Result */}
        {optResult && (
          <div className="bg-white rounded-2xl shadow-md p-6 mt-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {optResult.mode === 'ECONOMY' ? '💰 Economy' : '⚡ Performance'} Optimization
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-5">
              {[
                { label:'Tokens Before', val: optResult.tokens_before.toLocaleString(), color:'text-red-500',   bg:'bg-red-50'   },
                { label:'Tokens After',  val: optResult.tokens_after.toLocaleString(),  color:'text-green-600', bg:'bg-green-50' },
                { label:'Change',        val: `${optResult.savings_percent > 0 ? '-' : '+'}${Math.abs(optResult.savings_percent)}%`,
                                                                                         color: optResult.savings_percent > 0 ? 'text-green-600' : 'text-orange-500',
                                                                                         bg:'bg-blue-50' },
              ].map(s => (
                <div key={s.label} className={`text-center p-3 rounded-xl ${s.bg}`}>
                  <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="bg-gray-900 text-gray-100 rounded-xl p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap">
              {optResult.optimized_prompt}
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => copy(optResult.optimized_prompt)}
                className="px-4 py-2 bg-gray-800 text-white text-xs rounded-lg hover:bg-gray-700 font-semibold">
                📋 Copy Optimized Prompt
              </button>
              <button onClick={() => setPrompt(optResult.optimized_prompt)}
                className="px-4 py-2 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 font-semibold">
                ↺ Use As New Prompt
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}