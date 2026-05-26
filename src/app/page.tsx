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

  // If no profile, auto-create it so the user isn't stuck in a redirect loop
  if (!profile) {
    const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
    const role = user.user_metadata?.role || 'sales_manager'
    const { data: newProfile } = await admin
      .from('users')
      .upsert({ auth_user_id: user.id, email: user.email!, full_name: fullName, role }, { onConflict: 'email' })
      .select('id, auth_user_id, full_name, email, role, created_at, updated_at, avatar_url, account_id, account_role')
      .maybeSingle()

    if (!newProfile) {
      // Still no profile — sign out and redirect to login cleanly
      await supabase.auth.signOut()
      redirect('/login')
    }

    return <AppShell profile={newProfile} />
  }

  return <AppShell profile={profile} />
}
