'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const [receipts, setReceipts] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadReceipts()
  }, [])

  const loadReceipts = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('receipts')
      .select('*, users(email)')
      .order('created_at', { ascending: false })
    
    if (error) console.error('Ошибка загрузки:', error)
    else setReceipts(data || [])
    setLoading(false)
  }

  const approve = async (id, userId) => {
    await supabase.from('receipts').update({ status: 'approved' }).eq('id', id)
    const newDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    await supabase.from('users').update({ 
      status: 'active', 
      expires_at: newDate 
    }).eq('id', userId)
    alert('✅ Одобрено! Пользователю продлена подписка на 30 дней.')
    loadReceipts()
  }

  const reject = async (id) => {
    await supabase.from('receipts').update({ status: 'rejected' }).eq('id', id)
    alert('❌ Отклонено')
    loadReceipts()
  }

  if (loading) return <div className="p-8 text-center text-gray-600">Загрузка...</div>

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Проверка оплат</h1>
      
      {receipts.length === 0 ? (
        <div className="text-center text-gray-500 py-12 bg-white rounded-lg shadow">
          Пока нет заявок на оплату
        </div>
      ) : (
        <div className="space-y-4">
          {receipts.map(r => (
            <div key={r.id} className="bg-white border rounded-lg p-6 shadow-sm">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Чек */}
                <div className="w-full md:w-64 h-48 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border">
                  {r.file_url ? (
                    <img 
                      src={`https://${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').split('.')[0]}.supabase.co/storage/v1/object/public/receipts/${r.file_url}`} 
                      alt="Чек" 
                      className="object-contain h-full"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="gray"%3EНет фото%3C/text%3E%3C/svg%3E'
                      }}
                    />
                  ) : (
                    <span className="text-gray-400">Нет файла</span>
                  )}
                </div>

                {/* Инфо */}
                <div className="flex-1">
                  <div className="mb-3">
                    <p className="font-semibold text-lg">{r.users?.email || 'Неизвестно'}</p>
                    <p className="text-sm text-gray-600">
                      Сумма: <span className="font-medium text-gray-900">{r.amount} ₽</span>
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(r.created_at).toLocaleString('ru-RU')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      r.status === 'approved' ? 'bg-green-100 text-green-800' :
                      r.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {r.status === 'pending' ? '⏳ На проверке' : 
                       r.status === 'approved' ? '✅ Одобрено' : '❌ Отклонено'}
                    </span>
                  </div>

                  {r.status === 'pending' && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => approve(r.id, r.user_id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium"
                      >
                        ✅ Подтвердить оплату
                      </button>
                      <button 
                        onClick={() => reject(r.id)}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition text-sm font-medium"
                      >
                        ❌ Отклонить
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}