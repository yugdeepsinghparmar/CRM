'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { APP_NAME } from '@/lib/constants'

export default function LoginPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Explicitly write the access token into a cookie so the middleware can read it
    if (data.session) {
      const maxAge = data.session.expires_in ?? 3600
      document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${maxAge}; SameSite=Lax`
      document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
    }

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
