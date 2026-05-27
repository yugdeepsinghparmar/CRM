'use client'
import { useState } from 'react'
import { APP_NAME } from '@/lib/constants'
import { createBrowserClient } from '@supabase/ssr'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // createBrowserClient automatically handles cookie storage.
    // Full page navigation so the server middleware picks up the new session.
    window.location.href = '/'
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">{APP_NAME}</div>
        <div className="login-sub">Sign in to your account to continue.</div>
        {error && <div className="login-error">{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <div className="field">
            <label>Email address</label>
            <input
              type="email" required autoComplete="email"
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password" required autoComplete="current-password"
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button className="btn" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
