'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setMsg('Входим...')
    
    // Пробуем войти по паролю
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    })
    
    if (error) {
      // Если не получилось — пробуем отправить ссылку
      const { error: linkError } = await supabase.auth.signInWithOtp({ email })
      if (linkError) setMsg('Ошибка: ' + linkError.message)
      else setMsg('Письмо отправлено (если лимит не исчерпан)')
    } else {
      // Успешный вход — сразу кидаем в кабинет
      window.location.href = '/dashboard'
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form onSubmit={handleLogin} className="w-full max-w-sm rounded-lg bg-white p-6 shadow">
        <h1 className="mb-4 text-xl font-bold">Вход в кабинет</h1>
        <input
          type="email"
          placeholder="Ваша почта"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-3 w-full rounded border p-2"
          required
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-3 w-full rounded border p-2"
          required
        />
        <button type="submit" className="w-full rounded bg-green-600 p-2 text-white hover:bg-green-700">
          Войти
        </button>
        {msg && <p className="mt-3 text-sm text-gray-600">{msg}</p>}
      </form>
    </div>
  )
}