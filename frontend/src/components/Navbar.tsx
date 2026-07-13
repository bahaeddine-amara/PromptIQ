import { Link, useNavigate } from 'react-router-dom'

interface Props { isAuthenticated: boolean; setIsAuthenticated: (v: boolean) => void }

export default function Navbar({ isAuthenticated, setIsAuthenticated }: Props) {
  const navigate = useNavigate()
  const logout = () => { localStorage.removeItem('token'); setIsAuthenticated(false); navigate('/') }

  return (
    <nav className="bg-indigo-700 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tight flex items-center gap-2">
          🧠 PromptIQ
        </Link>
        <div className="flex items-center gap-5 text-sm font-medium">
          <Link to="/analyze" className="hover:text-indigo-200 transition-colors">Analyzer</Link>
          {isAuthenticated ? (
            <>
              <Link to="/history" className="hover:text-indigo-200 transition-colors">History</Link>
              <button onClick={logout}
                className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login"    className="hover:text-indigo-200 transition-colors">Login</Link>
              <Link to="/register" className="bg-white text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}