// app/auth/callback/route.js
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    // Обмениваем код на сессию
    await supabase.auth.exchangeCodeForSession(code)
  }

  // После успешного входа кидаем в кабинет
  return NextResponse.redirect(`${origin}/dashboard`)
}