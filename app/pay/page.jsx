'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function PayPage() {
  const [file, setFile] = useState(null)
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState('')

  const handlePay = async (e) => {
    e.preventDefault()
    if (!file || !amount) return alert('Прикрепите чек и укажите сумму')
    
    setStatus('Загружаем...')
    const fileName = `${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage.from('receipts').upload(fileName, file)
    
    if (uploadError) { setStatus('Ошибка загрузки'); return }

    const { data: { session } } = await supabase.auth.getSession()
    const { error: dbError } = await supabase.from('receipts').insert({
      user_id: session?.user?.id,
      amount: parseFloat(amount),
      file_url: fileName,
      status: 'pending'
    })

    if (dbError) { setStatus('Ошибка сохранения'); return }
    setStatus('success')
  }

  if (status === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">✅ Чек отправлен</h1>
          <p className="text-gray-600">Проверим вручную в течение часа. Доступ откроется автоматически.</p>
          <button onClick={() => window.location.href = '/dashboard'} className="mt-4 text-green-600 underline">Вернуться в кабинет</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Оплата подписки</h1>
        <div className="bg-gray-50 p-4 rounded mb-4 text-sm space-y-2">
          <p>📱 СБП: <b>+7 915 907 08 98</b> (по номеру телефона)</p>
          <p>💳 Карта: <b>2200 0000 0000 0000</b></p>
          <p className="text-gray-500">Получатель: ИП Иванов И.И.</p>
        </div>
        <form onSubmit={handlePay} className="space-y-4">
          <input type="number" placeholder="Сумма (490 или 990)" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-3 border rounded" required />
          <input type="file" accept="image/*,.pdf" onChange={e => setFile(e.target.files[0])} className="w-full p-2 border rounded" required />
          <button type="submit" disabled={status === 'Загружаем...'} className="w-full bg-green-600 text-white py-3 rounded hover:bg-green-700 disabled:opacity-50">
            {status === 'Загружаем...' ? 'Отправляем...' : 'Отправить чек'}
          </button>
          {status && status !== 'Загружаем...' && <p className="text-red-500 text-sm">{status}</p>}
        </form>
      </div>
    </div>
  )
}