import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

export const authAPI = {
  register: (username: string, email: string, password: string) =>
    api.post('/auth/register', { username, email, password }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
}

export const promptAPI = {
  analyze:  (prompt: string) =>
    api.post('/prompts/analyze', { prompt }),
  optimize: (prompt: string, mode: string) =>
    api.post('/prompts/optimize', { prompt, mode }),
  history:  () => api.get('/prompts/history'),
}

export const modelsAPI = {
  getAll: () => api.get('/models/'),
}

export default api