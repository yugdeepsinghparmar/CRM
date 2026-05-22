import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { auth_user_id, name, email, status, active_from, target_from } = await req.json()

  if (!auth_user_id || !name || !email) {
    return NextResponse.json({ error: 'auth_user_id, name and email are required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: userRow, error: userError } = await admin
    .from('users')
    .select('id')
    .eq('auth_user_id', auth_user_id)
    .maybeSingle()

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 })
  }

  if (!userRow) {
    return NextResponse.json({ error: 'User profile not found for invited account' }, { status: 404 })
  }

  const { data: manager, error: managerError } = await admin
    .from('sales_managers')
    .insert({
      user_id: userRow.id,
      name,
      email,
      status: status || 'Active',
      active_from: active_from || new Date().toISOString().slice(0, 10),
      target_from: target_from || new Date().toISOString().slice(0, 10),
    })
    .select()
    .single()

  if (managerError) {
    return NextResponse.json({ error: managerError.message }, { status: 500 })
  }

  return NextResponse.json({ data: manager })
}
