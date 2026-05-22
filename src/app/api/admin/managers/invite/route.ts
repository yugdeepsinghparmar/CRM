import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST — create a new Supabase auth user + public.users profile + sales_manager row
// Body: { email, full_name, role, password? }
export async function POST(req: NextRequest) {
  const { email, full_name, role, password } = await req.json()

  if (!email || !full_name) {
    return NextResponse.json({ error: 'Email and full name are required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 1. Create the Supabase Auth user with a known password
  //    If no password provided, generate a strong random one
  const userPassword = password || generatePassword()

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: userPassword,
    email_confirm: true, // auto-confirm so they can log in immediately
    user_metadata: { full_name, role: role || 'sales_manager' },
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  const authUser = authData.user

  // 2. Upsert into public.users (trigger may have already created it)
  const { error: profileError } = await admin
    .from('users')
    .upsert({
      auth_user_id: authUser.id,
      email,
      full_name,
      role: role || 'sales_manager',
    }, { onConflict: 'email' })

  if (profileError) {
    return NextResponse.json({ error: `Auth user created but profile failed: ${profileError.message}` }, { status: 500 })
  }

  // 3. If sales_manager role, also create a sales_managers row
  if (role === 'sales_manager' || !role) {
    const today = new Date().toISOString().slice(0, 10)

    // Get the users.id for the foreign key
    const { data: userRow } = await admin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    const { error: mgrError } = await admin
      .from('sales_managers')
      .insert({
        user_id: userRow?.id || null,
        name: full_name,
        email,
        active_from: today,
        target_from: today,
        status: 'Active',
      })

    if (mgrError) {
      return NextResponse.json({
        error: `User created but sales_manager row failed: ${mgrError.message}`,
      }, { status: 500 })
    }
  }

  return NextResponse.json({
    success: true,
    message: `User ${email} created successfully. They can log in immediately.`,
    credentials: {
      email,
      password: userPassword,
    },
  })
}

// Generate a readable random password
function generatePassword(): string {
  const words = ['Sales', 'Petpooja', 'Tower', 'Control', 'Manager']
  const word = words[Math.floor(Math.random() * words.length)]
  const num = Math.floor(1000 + Math.random() * 9000)
  const sym = ['@', '#', '!'][Math.floor(Math.random() * 3)]
  return `${word}${num}${sym}`
}
