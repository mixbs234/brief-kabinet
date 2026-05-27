'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [msg, setMsg] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMsg('')

    if (isRegister) {
      // РЕГИСТРАЦИЯ
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: window.location.origin + '/auth/callback'
        }
      })
      
      if (error) {
        setMsg('Ошибка: ' + error.message)
      } else {
        setMsg('✅ Регистрация успешна! Проверьте почту для подтверждения.')
        // Создаём запись в таблице users
        if (data.user) {
          await supabase.from('users').insert({ 
            id: data.user.id, 
            email: email,
            status: 'trial',
            plan: 'trial',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          })
        }
      }
    } else {
      // ВХОД
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      })
      
      if (error) {
        setMsg('Ошибка: ' + error.message)
      } else {
        window.location.href = '/dashboard'
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {isRegister ? 'Регистрация' : 'Вход в кабинет'}
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Ваша почта"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
          
          <button 
            type="submit" 
            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition"
          >
            {isRegister ? 'Зарегистрироваться' : 'Войти'}
          </button>
          
          {msg && (
            <div className={`p-3 rounded text-sm ${msg.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {msg}
            </div>
          )}
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => { setIsRegister(!isRegister); setMsg('') }}
            className="text-green-600 hover:text-green-700 text-sm font-medium"
          >
            {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
          </button>
        </div>
      </div>
    </div>
  )
}