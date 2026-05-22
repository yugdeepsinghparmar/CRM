import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import AppShell from '@/components/AppShell'

export default async function Home() {
  const supabase = createClient()
  const admin = createAdminClient()

  // Try standard SSR session
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {}

  // Fallback: verify manually-set access token cookie
  if (!user) {
    const cookieStore = cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value
    if (accessToken) {
      try {
        const { data } = await admin.auth.getUser(accessToken)
        user = data.user
      } catch {}
    }
  }

  if (!user) redirect('/login')

  // Fetch profile using admin client (bypasses RLS)
  const { data: profile } = await admin
    .from('users')
    .select('id, auth_user_id, full_name, email, role, created_at, updated_at, avatar_url, account_id, account_role')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (!profile) redirect('/login')

  return <AppShell profile={profile} />
}
