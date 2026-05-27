import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AppShell from '@/components/AppShell'

export default async function Home() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const admin = createAdminClient()

  // Fetch profile using admin client (bypasses RLS)
  let { data: profile } = await admin
    .from('users')
    .select('id, auth_user_id, full_name, email, role, created_at, updated_at, avatar_url, account_id, account_role')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  // Auto-create profile if missing
  if (!profile) {
    const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
    const role = user.user_metadata?.role || 'sales_manager'
    const { data: newProfile } = await admin
      .from('users')
      .upsert(
        { auth_user_id: user.id, email: user.email!, full_name: fullName, role },
        { onConflict: 'email' }
      )
      .select('id, auth_user_id, full_name, email, role, created_at, updated_at, avatar_url, account_id, account_role')
      .maybeSingle()
    profile = newProfile
  }

  if (!profile) redirect('/login')

  return <AppShell profile={profile} />
}
