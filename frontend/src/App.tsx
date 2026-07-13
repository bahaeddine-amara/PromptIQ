import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar   from './components/Navbar'
import Home     from './pages/Home'
import Dashboard from './pages/Dashboard'
import Login    from './pages/Login'
import Register from './pages/Register'
import History  from './pages/History'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem('token'))
  }, [])

  return (
    <Router>
      <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
      <Routes>
        <Route path="/"         element={<Home />} />
        <Route path="/analyze"  element={<Dashboard />} />
        <Route path="/login"    element={<Login    setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/register" element={<Register setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/history"  element={isAuthenticated ? <History /> : <Navigate to="/login" />} />
        <Route path="*"         element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}