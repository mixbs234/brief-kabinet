'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useParams } from 'next/navigation'

export default function BriefPage() {
  const params = useParams()
  const slug = params.slug
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    client_name: '',
    client_contact: '',
    answers: {}
  })

  // Универсальные блоки вопросов
  const blocks = {
    goal: {
      title: 'Цель и аудитория',
      questions: [
        { key: 'goal', label: 'Что должно получиться в итоге?', type: 'textarea', placeholder: 'Например: лендинг для кофейни, посты для соцсетей на месяц' },
        { key: 'audience', label: 'Для кого делаем?', type: 'text', placeholder: 'Возраст, профессия, интересы' },
        { key: 'action', label: 'Какое действие должен совершить человек?', type: 'text', placeholder: 'Оставить заявку, купить, подписаться' }
      ]
    },
    refs: {
      title: 'Референсы и стиль',
      questions: [
        { key: 'likes', label: 'Что нравится из готового?', type: 'textarea', placeholder: 'Ссылки, скриншоты, названия аккаунтов' },
        { key: 'dislikes', label: 'Что точно НЕ нужно?', type: 'textarea', placeholder: 'Цвета, шрифты, тон, клише' },
        { key: 'tone', label: 'Какой тон общения?', type: 'text', placeholder: 'На ты / на вы, дружелюбно / строго' }
      ]
    },
    materials: {
      title: 'Материалы и доступы',
      questions: [
        { key: 'materials', label: 'Кто предоставляет материалы?', type: 'text', placeholder: 'Тексты, фото, логотипы, исходники' },
        { key: 'brandbook', label: 'Есть ли брендбук или гайдлайны?', type: 'text', placeholder: 'Фирменные цвета, шрифты' },
        { key: 'storage', label: 'Куда выкладывать файлы?', type: 'text', placeholder: 'Google Disk, Figma, облако' }
      ]
    },
    tech: {
      title: 'Технические требования',
      questions: [
        { key: 'platform', label: 'Где будет жить результат?', type: 'text', placeholder: 'Сайт, приложение, телеграм, печать' },
        { key: 'mobile', label: 'Нужна адаптация под мобильные?', type: 'text', placeholder: 'Да / нет / не знаю' },
        { key: 'cms', label: 'Есть ли готовая платформа?', type: 'text', placeholder: 'Tilda, WordPress, с нуля' }
      ]
    },
    budget: {
      title: 'Сроки и бюджет',
      questions: [
        { key: 'deadline', label: 'Крайняя дата сдачи', type: 'date' },
        { key: 'budget_range', label: 'Вилка бюджета', type: 'select', options: ['До 30к', '30-70к', '70-150к', 'Обсуждаем отдельно'] },
        { key: 'payment', label: 'Как делим оплату?', type: 'text', placeholder: '50% предоплата, поэтапно, 100% после ТЗ' }
      ]
    },
    revisions: {
      title: 'Правки и приёмка',
      questions: [
        { key: 'revisions_count', label: 'Сколько раундов правок?', type: 'text', placeholder: 'Обычно 2' },
        { key: 'approver', label: 'Кто принимает финальную версию?', type: 'text', placeholder: 'Один человек или отдел' },
        { key: 'definition_done', label: 'Что считаем «сделано»?', type: 'text', placeholder: 'Файлы переданы, код залит, тексты опубликованы' }
      ]
    }
  }

  // Какие блоки показывать для каждой категории
  const categoryBlocks = {
    visual: ['refs', 'materials', 'tech', 'budget', 'revisions'],
    text: ['goal', 'refs', 'budget', 'revisions'],
    code: ['goal', 'materials', 'tech', 'budget'],
    other: ['goal', 'budget', 'revisions']
  }

  useEffect(() => {
    const loadProject = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('client_slug', slug)
        .single()

      if (error || !data) {
        alert('Проект не найден')
      } else {
        setProject(data)
      }
      setLoading(false)
    }
    loadProject()
  }, [slug])

  const handleInputChange = (blockKey, questionKey, value) => {
    setFormData(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [blockKey + '_' + questionKey]: value
      }
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const { error } = await supabase
      .from('responses')
      .insert({
        project_id: project.id,
        client_name: formData.client_name,
        client_contact: formData.client_contact,
        answers: formData.answers,
        submitted_at: new Date().toISOString()
      })

    if (error) {
      alert('Ошибка: ' + error.message)
    } else {
      setSubmitted(true)
      // Обновляем статус проекта
      await supabase
        .from('projects')
        .update({ status: 'active' })
        .eq('id', project.id)
    }
  }

  if (loading) return <div className="p-8 text-center">Загружаем...</div>
  if (!project) return <div className="p-8 text-center">Проект не найден</div>
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold mb-2">Спасибо!</h1>
          <p className="text-gray-600 mb-4">Ваши ответы отправлены.</p>
          <p className="text-sm text-gray-500">Фрилансер получит уведомление и свяжется с вами.</p>
        </div>
      </div>
    )
  }

  const activeBlocks = categoryBlocks[project.category] || ['goal', 'budget']

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">{project.title}</h1>
          <p className="text-gray-600">Заполните бриф — это займёт 5 минут</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Контактные данные */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Ваши контакты</h2>
            <input
              type="text"
              placeholder="Ваше имя"
              value={formData.client_name}
              onChange={(e) => setFormData({...formData, client_name: e.target.value})}
              className="w-full mb-3 p-3 border rounded"
              required
            />
            <input
              type="text"
              placeholder="Телефон или Telegram"
              value={formData.client_contact}
              onChange={(e) => setFormData({...formData, client_contact: e.target.value})}
              className="w-full p-3 border rounded"
              required
            />
          </div>

          {/* Динамические блоки вопросов */}
          {activeBlocks.map((blockKey) => (
            <div key={blockKey} className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">{blocks[blockKey].title}</h2>
              <div className="space-y-4">
                {blocks[blockKey].questions.map((q) => (
                  <div key={q.key}>
                    <label className="block text-sm font-medium mb-1">{q.label}</label>
                    {q.type === 'textarea' && (
                      <textarea
                        placeholder={q.placeholder}
                        rows={3}
                        value={formData.answers[blockKey + '_' + q.key] || ''}
                        onChange={(e) => handleInputChange(blockKey, q.key, e.target.value)}
                        className="w-full p-3 border rounded"
                      />
                    )}
                    {q.type === 'select' && (
                      <select
                        value={formData.answers[blockKey + '_' + q.key] || ''}
                        onChange={(e) => handleInputChange(blockKey, q.key, e.target.value)}
                        className="w-full p-3 border rounded"
                      >
                        <option value="">Выберите...</option>
                        {q.options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}
                    {q.type === 'date' && (
                      <input
                        type="date"
                        value={formData.answers[blockKey + '_' + q.key] || ''}
                        onChange={(e) => handleInputChange(blockKey, q.key, e.target.value)}
                        className="w-full p-3 border rounded"
                      />
                    )}
                    {q.type === 'text' && (
                      <input
                        type="text"
                        placeholder={q.placeholder}
                        value={formData.answers[blockKey + '_' + q.key] || ''}
                        onChange={(e) => handleInputChange(blockKey, q.key, e.target.value)}
                        className="w-full p-3 border rounded"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button 
            type="submit"
            className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition"
          >
            Отправить ответы
          </button>
        </form>
      </div>
    </div>
  )
}