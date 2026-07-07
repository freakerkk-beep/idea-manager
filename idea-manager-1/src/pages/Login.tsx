import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const res = await login(password)
    setSubmitting(false)
    if (res.ok) {
      navigate('/', { replace: true })
    } else {
      setError(res.error ?? 'Sai mật khẩu')
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#f6f7f5] px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl bg-white p-8 shadow-md">
        <h1 className="text-xl font-semibold text-slate-900">Idea Manager</h1>
        <p className="mt-1 text-sm text-slate-500">Nhập mật khẩu chung để tiếp tục.</p>

        <label className="mt-6 block text-sm font-medium text-slate-700" htmlFor="password">
          Mật khẩu
        </label>
        <input
          id="password"
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          placeholder="••••••••"
        />

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !password}
          className="mt-5 w-full rounded-md bg-emerald-700 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {submitting ? 'Đang kiểm tra...' : 'Đăng nhập'}
        </button>
      </form>
    </div>
  )
}
