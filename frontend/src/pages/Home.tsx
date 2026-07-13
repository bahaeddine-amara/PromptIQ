import { Link } from 'react-router-dom'

const FEATURES = [
  { icon: '🧠', title: 'Smart Classification', desc: 'DistilBERT classifies prompts into 6 categories with 92%+ accuracy in under 100ms.' },
  { icon: '📊', title: 'Quality Scoring',       desc: 'XGBoost scores prompts on 20 linguistic features with explainable results.' },
  { icon: '⚡', title: 'AI Optimization',        desc: 'Llama 3.3 70B via Groq rewrites your prompt for performance or economy mode.' },
  { icon: '🔢', title: 'Exact Token Count',      desc: 'Real tiktoken tokenizers — 100% accurate counts across all major models.' },
  { icon: '💰', title: 'Cost Estimation',        desc: 'Compare costs across GPT-4o, Claude, Gemini, and more before you send.' },
  { icon: '🌐', title: 'Browser Extension',      desc: 'Real-time analysis on ChatGPT, Claude.ai, and Gemini — right where you type.' },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100">
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <span className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold mb-6">
          Hybrid ML · DistilBERT + XGBoost + Groq
        </span>
        <h1 className="text-5xl font-bold text-indigo-900 mb-6 leading-tight">
          Write Better Prompts.<br/>Get Better Results.
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          PromptIQ combines fine-tuned ML models with real LLM APIs to give you instant,
          explainable feedback on every prompt you write.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link to="/analyze"  className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-semibold text-lg hover:bg-indigo-700 transition-colors shadow-lg">
            Try It Now →
          </Link>
          <Link to="/register" className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold text-lg hover:bg-indigo-50 border border-indigo-200 transition-colors">
            Sign Up Free
          </Link>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 pb-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        {FEATURES.map((f, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-3">{f.icon}</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">{f.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}