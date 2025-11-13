import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const initialFormState = {
  email: '',
  password: '',
}

const SignInModal = () => {
  const { isModalOpen, closeModal, signIn, status, error } = useAuth()
  const [form, setForm] = useState(initialFormState)

  useEffect(() => {
    if (!isModalOpen) {
      setForm(initialFormState)
    }
  }, [isModalOpen])

  if (!isModalOpen) {
    return null
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      await signIn(form)
    } catch (_ERROR) {
      // Error messaging handled inside the auth context
    }
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-semibold text-slate-800">Sign In</h2>
          <p className="text-sm text-slate-500">Enter your admin credentials to manage the bookstore</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-600">
            Email
            <input
              required
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-slate-700 focus:border-main focus:outline-none focus:ring-2 focus:ring-main/20"
              placeholder="admin@ovarc.io"
              autoComplete="email"
            />
          </label>
          <label className="block text-sm font-medium text-slate-600">
            Password
            <input
              required
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-slate-700 focus:border-main focus:outline-none focus:ring-2 focus:ring-main/20"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </label>
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full rounded-lg bg-main px-4 py-2 text-sm font-semibold text-white transition hover:bg-main/90 disabled:pointer-events-none disabled:opacity-70"
            >
              {status === 'loading' ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

export default SignInModal

