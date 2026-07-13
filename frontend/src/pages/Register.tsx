import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'

interface Props { setIsAuthenticated: (v: boolean) => void }

export default function Register({ setIsAuthenticated }: Props) {
  const [username, setUsername] = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const navigate = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      await authAPI.register(username, email, password)
      const r = await authAPI.login(email, password)
      localStorage.setItem('token', r.data.access_token)
      setIsAuthenticated(true)
      navigate('/analyze')
    } catch (err: unknown) {
    const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Login failed. Check your credentials.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-1">Create account</h2>
        <p className="text-gray-500 text-sm mb-8">Start optimizing your prompts today — it's free</p>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-5 text-sm">{error}</div>}
        <form onSubmit={submit} className="space-y-5">
          {[
            { label:'Username', type:'text',     val:username, set:setUsername, ph:'johndoe',        min:3  },
            { label:'Email',    type:'email',    val:email,    set:setEmail,    ph:'you@example.com', min:5  },
            { label:'Password', type:'password', val:password, set:setPassword, ph:'Min 8 chars',    min:8  },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)}
                required minLength={f.min} placeholder={f.ph}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
            </div>
          ))}
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="text-center text-gray-500 mt-6 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}