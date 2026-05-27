'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('visual')
  const [newSlug, setNewSlug] = useState('')
  const [selectedProject, setSelectedProject] = useState(null)
  const [responses, setResponses] = useState(null)
  
  // Онбординг
  const [showTour, setShowTour] = useState(false)
  const [tourStep, setTourStep] = useState(0)
  
  const router = useRouter()

  useEffect(() => { 
    loadProjects()
  }, [router])

  useEffect(() => {
    const seen = localStorage.getItem('onboarding_done')
    if (!seen && projects.length === 0) {
      setShowTour(true)
    }
  }, [projects])

  const loadProjects = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }

    const { data: profile } = await supabase.from('users').select('id').eq('id', session.user.id).single()
    if (!profile) {
      await supabase.from('users').insert({ 
        id: session.user.id, 
        email: session.user.email,
        status: 'active',
        plan: 'trial',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
    }

    const { data, error } = await supabase.from('projects').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
    if (!error) setProjects(data || [])
    setLoading(false)
  }

  const createProject = async (e) => {
    e.preventDefault()
    const { data: { session } } = await supabase.auth.getSession()
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substr(2, 5)
    
    const { data, error } = await supabase.from('projects').insert({
      user_id: session.user.id, title, category, client_slug: slug, status: 'draft'
    }).select().single()

    if (error) alert('Ошибка: ' + error.message)
    else {
      setNewSlug(slug)
      setProjects([data, ...projects])
      setShowForm(false)
      setTitle('')
    }
  }

  const viewResponses = async (project) => {
    setSelectedProject(project)
    const { data, error } = await supabase.from('responses').select('*').eq('project_id', project.id).single()
    if (error || !data) { alert('Ответов пока нет. Клиент ещё не заполнил форму.'); setSelectedProject(null) }
    else setResponses(data)
  }

  const copyLink = (slug) => {
    const link = window.location.origin + '/brief/' + slug
    navigator.clipboard.writeText(link)
    alert('Ссылка скопирована!')
  }

  const completeTour = () => {
    setShowTour(false)
    localStorage.setItem('onboarding_done', '1')
  }

  if (loading) return <p className="p-8">Загружаем проекты...</p>

  // Просмотр ответов
  if (selectedProject && responses) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <button onClick={() => { setSelectedProject(null); setResponses(null) }} className="mb-4 text-green-600 hover:underline">← Назад к проектам</button>
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold">{selectedProject.title}</h1>
          <p className="text-gray-600">Клиент: {responses.client_name} | {responses.client_contact}</p>
        </div>
        <div className="space-y-4">
          {Object.entries(responses.answers || {}).map(([key, val]) => (
            <div key={key} className="bg-white p-4 rounded shadow">
              <span className="text-sm font-bold text-gray-700 capitalize">{key.replace(/_/g, ' ')}</span>
              <p className="mt-1 text-gray-900">{val || '—'}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Онбординг-тур (оверлей)
  if (showTour) {
    const steps = [
      { title: 'Добро пожаловать!', text: 'Давайте создадим ваш первый бриф за 3 шага.' },
      { title: 'Шаг 1: Создайте проект', text: 'Нажмите зелёную кнопку «+ Создать бриф», чтобы начать.' },
      { title: 'Шаг 2: Отправьте ссылку', text: 'Скопируйте ссылку и отправьте клиенту — он заполнит форму.' },
      { title: 'Шаг 3: Получите ответы', text: 'Когда клиент ответит, нажмите кнопку «Ответы», чтобы увидеть бриф.' }
    ]
    
    const currentStep = steps[tourStep] || steps[0]

    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 relative">
            <button onClick={completeTour} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            
            <div className="mb-6">
              <div className="flex gap-2 mb-4">
                {steps.map((_, i) => (
                  <div key={i} className={`h-2 flex-1 rounded-full ${i <= tourStep ? 'bg-green-600' : 'bg-gray-200'}`}></div>
                ))}
              </div>
              <h3 className="text-xl font-bold mb-2">{currentStep.title}</h3>
              <p className="text-gray-600">{currentStep.text}</p>
            </div>

            <div className="flex gap-3">
              {tourStep > 0 ? (
                <button onClick={() => setTourStep(tourStep - 1)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">
                  Назад
                </button>
              ) : <div className="flex-1"></div>}
              
              <button 
                onClick={() => tourStep < steps.length - 1 ? setTourStep(tourStep + 1) : completeTour()} 
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium"
              >
                {tourStep < steps.length - 1 ? 'Дальше →' : 'Понятно!'}
              </button>
            </div>
            
            <button onClick={completeTour} className="mt-4 text-sm text-gray-400 hover:text-gray-600 w-full">
              Пропустить тур
            </button>
          </div>
        </div>

        {/* Фоновый контент (размытый) */}
        <div className="opacity-30 pointer-events-none">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Мои проекты</h1>
            <button className="bg-green-600 text-white px-4 py-2 rounded">+ Создать бриф</button>
          </div>
          <p className="text-gray-500">Пока пусто.</p>
        </div>
      </div>
    )
  }

  // Основной интерфейс
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Мои проекты</h1>
        <button 
          onClick={() => setShowForm(true)} 
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 create-btn"
        >
          + Создать бриф
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 border rounded bg-white shadow">
          <form onSubmit={createProject}>
            <input placeholder="Название проекта" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full mb-3 p-2 border rounded" required />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full mb-3 p-2 border rounded">
              <option value="visual">Визуал</option><option value="text">Текст</option><option value="code">Код</option><option value="other">Другое</option>
            </select>
            <div className="flex gap-2">
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Создать</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-300 px-4 py-2 rounded">Отмена</button>
            </div>
          </form>
        </div>
      )}

      {newSlug && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded">
          <p className="font-bold text-green-800">✅ Проект создан!</p>
          <div className="flex gap-2 mt-2">
            <code className="flex-1 p-2 bg-white rounded text-sm break-all">{window.location.origin}/brief/{newSlug}</code>
            <button onClick={() => copyLink(newSlug)} className="bg-green-600 text-white px-3 py-1 rounded text-sm copy-btn">
              Копировать
            </button>
          </div>
          <button onClick={() => setNewSlug('')} className="mt-2 text-sm text-green-700 underline">Закрыть</button>
        </div>
      )}

      {projects.length === 0 ? (
        <p className="text-gray-500">Пока пусто. Нажмите «+ Создать бриф».</p>
      ) : (
        <ul className="space-y-3">
          {projects.map((p) => (
            <li key={p.id} className="rounded border p-4 bg-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <span className="font-medium text-lg">{p.title}</span>
                <span className="ml-2 text-xs text-gray-400">({p.category})</span>
                <div className="text-sm text-gray-500 mt-1">Статус: <span className="capitalize">{p.status}</span></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => viewResponses(p)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm view-btn">
                  Ответы
                </button>
                <button onClick={() => copyLink(p.client_slug)} className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm copy-btn">
                  Ссылка
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}