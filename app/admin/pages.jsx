'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const [receipts, setReceipts] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || session.user.email !== 'ваш_админ@email.ru') {
        router.push('/login')
        return
      }
      loadReceipts()
    }
    check()
  }, [router])

  const loadReceipts = async () => {
    const { data } = await supabase.from('receipts').select('*, users(email)').order('created_at', { ascending: false })
    setReceipts(data || [])
    setLoading(false)
  }

  const approve = async (id, userId) => {
    await supabase.from('receipts').update({ status: 'approved' }).eq('id', id)
    const newDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    await supabase.from('users').update({ status: 'active', expires_at: newDate }).eq('id', userId)
    loadReceipts()
  }

  const reject = async (id) => {
    await supabase.from('receipts').update({ status: 'rejected' }).eq('id', id)
    loadReceipts()
  }

  if (loading) return <p className="p-8">Загружаем...</p>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Проверка оплат</h1>
      {receipts.length === 0 ? <p className="text-gray-500">Пока нет заявок.</p> : (
        <div className="space-y-4">
          {receipts.map(r => (
            <div key={r.id} className="bg-white border rounded p-4 flex flex-col md:flex-row gap-4 items-start">
              <div className="w-full md:w-48 h-32 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                <img src={`https://ВАШ_ID.supabase.co/storage/v1/object/public/receipts/${r.file_url}`} alt="Чек" className="object-contain h-full" />
              </div>
              <div className="flex-1">
                <p className="font-bold">{r.users?.email || 'Неизвестно'}</p>
                <p className="text-sm text-gray-500">Сумма: {r.amount} ₽ | Статус: {r.status}</p>
                <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleString('ru')}</p>
              </div>
              <div className="flex gap-2">
                {r.status === 'pending' && (
                  <>
                    <button onClick={() => approve(r.id, r.user_id)} className="bg-green-600 text-white px-3 py-1 rounded text-sm">✅ ОК</button>
                    <button onClick={() => reject(r.id)} className="bg-gray-300 px-3 py-1 rounded text-sm">❌ Отклонить</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}