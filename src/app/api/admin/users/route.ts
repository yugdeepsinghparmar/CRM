import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// PATCH — update user role or full_name
export async function PATCH(req: NextRequest) {
  const { id, auth_user_id, ...fields } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const admin = createAdminClient()

  // Update public.users
  const { error } = await admin.from('users').update(fields).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If role changed, also update auth user metadata
  if (fields.role && auth_user_id) {
    await admin.auth.admin.updateUserById(auth_user_id, {
      user_metadata: { role: fields.role, full_name: fields.full_name },
    })
  }

  return NextResponse.json({ success: true })
}

// DELETE — remove user from public.users + auth
export async function DELETE(req: NextRequest) {
  const { id, auth_user_id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const admin = createAdminClient()

  // Delete from public.users (cascades to sales_managers via FK)
  await admin.from('users').delete().eq('id', id)

  // Delete from Supabase Auth
  if (auth_user_id) {
    await admin.auth.admin.deleteUser(auth_user_id)
  }

  return NextResponse.json({ success: true })
}
