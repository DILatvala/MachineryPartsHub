import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

type CatalogItem = {
  id: number
  name: string
  category: number
  category_name: string
  description: string
  is_active: boolean
}

type ServiceRequest = {
  id: number
  name: string
  phone: string
  vehicle: string
  part_or_service: string
  notes: string
  status: 'new' | 'pending' | 'completed'
  created_at: string
}

type FormState = {
  name: string
  phone: string
  vehicle: string
  part: string
}

const defaultItems: CatalogItem[] = [
  { id: 1, name: 'Двигатели и комплектующие', category: 1, category_name: 'Двигатели и комплектующие', description: 'Запасные части и комплектующие для двигателей строительной техники.', is_active: true },
  { id: 2, name: 'Гидронасосы', category: 2, category_name: 'Гидравлика', description: 'Гидронасосы и компоненты гидравлических систем спецтехники.', is_active: true },
  { id: 3, name: 'Фильтры и ремни', category: 3, category_name: 'Фильтры и ремни', description: 'Фильтрующие элементы и приводные ремни для рабочей техники.', is_active: true },
  { id: 4, name: 'Турбины и топливные системы', category: 4, category_name: 'Турбины и топливные системы', description: 'Турбокомпрессоры и комплектующие топливных систем.', is_active: true },
  { id: 5, name: 'Ходовая часть и редукторы', category: 5, category_name: 'Ходовая часть и редукторы', description: 'Компоненты ходовой части, трансмиссии и редукторы.', is_active: true },
  { id: 6, name: 'Тормозные системы', category: 6, category_name: 'Тормозные системы', description: 'Комплектующие тормозных систем строительной и дорожной техники.', is_active: true },
]

const categories = [
  'Все',
  'Двигатели и комплектующие',
  'Гидравлика',
  'Фильтры и ремни',
  'Турбины и топливные системы',
  'Ходовая часть и редукторы',
  'Тормозные системы',
]

const initialForm: FormState = {
  name: '',
  phone: '',
  vehicle: '',
  part: '',
}

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) || 'http://127.0.0.1:8000'
const ADMIN_SITE_URL = (import.meta.env.VITE_ADMIN_URL as string | undefined) || '/admin'
const PUBLIC_SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined) || '/'
const ADMIN_ONLY = import.meta.env.VITE_ADMIN_ONLY === 'true'
let csrfToken = ''

const heroSlides = [
  {
    eyebrow: 'Machinery Parts Hub · MPH Group',
    title: 'Надёжные запчасти',
    emphasis: 'для спецтехники',
    description: 'Детали и комплектующие для экскаваторов, бульдозеров, погрузчиков, кранов и строительной техники.',
  },
  {
    eyebrow: 'Оригинальные детали и проверенные аналоги',
    title: 'Подбор деталей',
    emphasis: 'под вашу технику',
    description: 'Помогаем подобрать двигатели, гидравлику, фильтры, ремни, турбины, ходовую часть и тормозные системы.',
  },
  {
    eyebrow: 'Казахстан и страны СНГ',
    title: 'Поставка без лишних',
    emphasis: 'задержек',
    description: 'Оперативная доставка и профессиональная консультация для владельцев техники и сервисных команд.',
  },
]

const buildHeaders = (includeCsrf = false) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  if (includeCsrf) {
    const csrfCookie = document.cookie
      .split('; ')
      .find((entry) => entry.startsWith('csrftoken='))
      ?.split('=')[1]

    headers['X-CSRFToken'] = csrfCookie ? decodeURIComponent(csrfCookie) : csrfToken
  }

  return headers
}

const ICON = `
  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
    <circle cx="24" cy="24" r="16"/>
    <circle cx="24" cy="24" r="5"/>
    <path d="M24 8v6M24 34v6M8 24h6M34 24h6"/>
  </svg>
`

const statusLabels: Record<ServiceRequest['status'], string> = {
  new: 'Новая',
  pending: 'В обработке',
  completed: 'Завершена',
}

function HomePage() {
  const [catalog, setCatalog] = useState<CatalogItem[]>(defaultItems)
  const [activeCategory, setActiveCategory] = useState('Все')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeHeroSlide, setActiveHeroSlide] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [formData, setFormData] = useState<FormState>(initialForm)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submissionError, setSubmissionError] = useState('')

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const timer = window.setInterval(() => {
      setActiveHeroSlide((current) => (current + 1) % heroSlides.length)
    }, 7000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    fetch(`${API_BASE_URL}/api/catalog/`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('API error')
        return response.json()
      })
      .then((data: CatalogItem[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setCatalog(data)
        }
      })
      .catch(() => {
        setCatalog(defaultItems)
      })

    return () => controller.abort()
  }, [])

  const filteredItems = useMemo(() => {
    return catalog.filter((item) => {
      const matchesCategory = activeCategory === 'Все' || item.category_name === activeCategory
      const matchesQuery =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesCategory && matchesQuery
    })
  }, [activeCategory, catalog, searchQuery])

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {}

    if (formData.name.trim().length < 2) nextErrors.name = 'Введите имя.'
    if (!/^\+?[\d\s()-]{7,}$/.test(formData.phone.trim())) nextErrors.phone = 'Введите корректный номер телефона.'
    if (formData.vehicle.trim().length < 3) nextErrors.vehicle = 'Укажите марку и модель техники.'
    if (formData.part.trim().length < 3) nextErrors.part = 'Укажите нужную запчасть или услугу.'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!validateForm()) return

    setSubmitted(false)
    setSubmissionError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/requests/`, {
        method: 'POST',
        headers: buildHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          vehicle: formData.vehicle,
          part_or_service: formData.part,
          notes: '',
        }),
      })

      if (!response.ok) throw new Error(`Request rejected with status ${response.status}`)

      setSubmitted(true)
      setFormData(initialForm)
    } catch (error) {
      console.error('Request send failed', error)
      setSubmissionError('Не удалось отправить запрос. Проверьте соединение и попробуйте ещё раз.')
    }
  }

  return (
    <>
      <header className="site-header">
        <div className="wrap bar">
          <a className="logo" href="#top" aria-label="MachineryPartsHub — на главную">
            <img className="logo-image" src="/mph-logo.jpg" alt="Machinery Parts Hub" />
            <span>Запчасти для спецтехники</span>
          </a>
          <a href={ADMIN_SITE_URL} className="link-button">Менеджер</a>
          <button className="menu" type="button" aria-expanded={menuOpen} aria-controls="site-navigation" onClick={() => setMenuOpen((open) => !open)}>
            Меню
          </button>
          <nav id="site-navigation" className={menuOpen ? 'nav-open' : ''} aria-label="Основная навигация" onClick={() => setMenuOpen(false)}>
            <a href="#about">О нас</a>
            <a href="#catalog">Запчасти</a>
            <a href="#request">Запрос</a>
            <a href="#contact">Контакты</a>
          </nav>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="wrap hero-grid">
            <div>
              <div className="hero-carousel" role="group" aria-roledescription="carousel" aria-label="Преимущества Machinery Parts Hub">
                <div className="hero-slide" aria-live="polite" aria-atomic="true">
                  <span className="eyebrow">{heroSlides[activeHeroSlide].eyebrow}</span>
                  <h1>
                    {heroSlides[activeHeroSlide].title} <em>{heroSlides[activeHeroSlide].emphasis}</em>
                  </h1>
                  <p className="lead">{heroSlides[activeHeroSlide].description}</p>
                </div>
                <div className="hero-carousel-controls">
                  <button
                    type="button"
                    className="carousel-arrow"
                    aria-label="Предыдущий слайд"
                    onClick={() => setActiveHeroSlide((current) => (current - 1 + heroSlides.length) % heroSlides.length)}
                  >
                    ←
                  </button>
                  <div className="carousel-dots" role="group" aria-label="Выбрать слайд">
                    {heroSlides.map((slide, index) => (
                      <button
                        key={slide.eyebrow}
                        type="button"
                        className="carousel-dot"
                        aria-label={`Слайд ${index + 1}: ${slide.eyebrow}`}
                        aria-pressed={activeHeroSlide === index}
                        onClick={() => setActiveHeroSlide(index)}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    className="carousel-arrow"
                    aria-label="Следующий слайд"
                    onClick={() => setActiveHeroSlide((current) => (current + 1) % heroSlides.length)}
                  >
                    →
                  </button>
                </div>
              </div>
              <form
                className="search"
                role="search"
                onSubmit={(event) => {
                  event.preventDefault()
                  document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Например: гидронасос, фильтр"
                  aria-label="Поиск запчастей"
                />
                <button type="submit">Найти</button>
              </form>
              <p className="hint">Подбор запчастей для строительной и дорожно-строительной техники.</p>
            </div>

            <div className="hero-brand-card">
              <img src="/mph-logo.jpg" alt="Логотип Machinery Parts Hub с изображением спецтехники и запчастей" />
              <span>Надёжные запчасти для спецтехники</span>
            </div>
          </div>

          <div className="wrap strip">
            <div><b>Оригинал и аналоги</b>Проверенные комплектующие</div>
            <div><b>Доставка</b>По Казахстану и СНГ</div>
            <div><b>Подбор</b>Профессиональная консультация</div>
          </div>
        </section>

        <section id="about">
          <div className="wrap about">
            <div>
              <span className="eyebrow">О нас</span>
              <h2>Надёжные запчасти для спецтехники</h2>
              <p>
                Компания Machinery Parts Hub (MPH Group) — ваш надёжный партнёр в сфере поставок запчастей для спецтехники. Предлагаем комплектующие для экскаваторов, бульдозеров, погрузчиков, кранов и другой строительной и дорожно-строительной техники.
              </p>
              <div className="pillars">
                <div>Оригинальные и аналоговые запчасти от ведущих производителей</div>
                <div>Гарантия качества и долговечности</div>
                <div>Оперативная доставка по Казахстану и СНГ</div>
                <div>Профессиональная консультация и подбор деталей</div>
              </div>
            </div>

            <div className="about-assortment">
              <span className="eyebrow">Ассортимент запчастей</span>
              <h3>Комплектующие для рабочих машин</h3>
              <ul>
                <li>Двигатели и комплектующие</li>
                <li>Гидравлика и гидронасосы</li>
                <li>Фильтры, ремни, турбины и топливные системы</li>
                <li>Ходовая часть, редукторы и тормозные системы</li>
              </ul>
              <p>Работаем с владельцами спецтехники, сервисными центрами, строительными и транспортными компаниями.</p>
            </div>
          </div>
        </section>

        <section id="catalog" className="alt">
          <div className="wrap">
            <div className="head">
              <div>
                <span className="eyebrow">Запчасти и сервис</span>
                <h2>Каталог по категориям</h2>
              </div>
              <div className="chips" role="group" aria-label="Фильтр по категории">
                {categories.map((category) => (
                  <button
                    key={category}
                    className="chip"
                    type="button"
                    aria-pressed={activeCategory === category}
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="cards" aria-live="polite">
              {filteredItems.map((item) => (
                <article key={item.id} className="card">
                  <div className="photo-block" dangerouslySetInnerHTML={{ __html: ICON }} />
                  <div className="body">
                    <small>{item.category_name}</small>
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                  </div>
                  <button type="button" onClick={() => setFormData((current) => ({ ...current, part: item.name }))}>Запросить →</button>
                </article>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <p className="empty" style={{ display: 'block' }}>
                По вашему запросу ничего не найдено. Попробуйте другое слово или отправьте запрос ниже.
              </p>
            )}
            <p className="note">Указанные цены на сайте не являются публичной офертой.</p>
          </div>
        </section>

        <section id="request">
          <div className="wrap formgrid">
            <div>
              <span className="eyebrow">Запрос</span>
              <h2>Расскажите, что вам нужно</h2>
              <p>Укажите модель спецтехники и нужную запчасть. Поля со звёздочкой * обязательны.</p>
            </div>

            <div>
              <form onSubmit={handleSubmit} noValidate>
                <div className="proto" role="note">
                  <b>Отправьте запрос:</b> он будет сохранён, чтобы менеджер мог его обработать.
                </div>

                <div className="r2">
                  <label>
                    Имя *
                    <input name="name" value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} aria-invalid={Boolean(errors.name)} />
                    <span className="err">{errors.name ?? ''}</span>
                  </label>

                  <label>
                    Телефон *
                    <input name="phone" type="tel" value={formData.phone} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} aria-invalid={Boolean(errors.phone)} placeholder="+7" />
                    <span className="err">{errors.phone ?? ''}</span>
                  </label>
                </div>

                <label>
                  Данные спецтехники *
                  <input name="vehicle" value={formData.vehicle} onChange={(event) => setFormData({ ...formData, vehicle: event.target.value })} aria-invalid={Boolean(errors.vehicle)} placeholder="Марка, модель, год, серийный номер" />
                  <span className="err">{errors.vehicle ?? ''}</span>
                </label>

                <label>
                  Запчасть или услуга *
                  <textarea name="part" rows={4} value={formData.part} onChange={(event) => setFormData({ ...formData, part: event.target.value })} aria-invalid={Boolean(errors.part)} placeholder="Что вы ищете?" />
                  <span className="err">{errors.part ?? ''}</span>
                </label>

                <button className="btn" type="submit">Оставить запрос</button>
                {submissionError && <p className="err" role="alert">{submissionError}</p>}
              </form>

              {submitted && (
                <div className="ok" style={{ display: 'block' }} role="status">
                  <b>Запрос сохранён</b>
                  <p>Менеджер увидит ваш запрос в панели управления.</p>
                  <button className="btn ghost" type="button" onClick={() => setSubmitted(false)}>
                    Новый запрос
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="contact" id="contact">
          <div className="wrap grid">
            <div>
              <span className="eyebrow accent-light">Контакты</span>
              <h2>Ищете нужную запчасть?</h2>
              <p className="lead">Свяжитесь с нами для консультации и профессионального подбора запчастей для вашей техники.</p>
              <div className="cta-row">
                <a className="btn" href="#request">Оставить запрос</a>
                <a className="btn ghost" href="https://wa.me/77089693220" target="_blank" rel="noreferrer">WhatsApp</a>
                <a className="btn ghost" href="tel:+77089693220">Позвонить</a>
              </div>
            </div>

            <dl>
              <dt>Телефон</dt>
              <dd><a href="tel:+77089693220">+7 708 969 32 20</a></dd>
              <dt>Доставка</dt>
              <dd>Казахстан и страны СНГ</dd>
              <dt>Подбор</dt>
              <dd>Запчасти для спецтехники</dd>
              <dt>Email</dt>
              <dd><a href="mailto:MachineryPartsHub@mphgroup.kz">MachineryPartsHub@mphgroup.kz</a></dd>
            </dl>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <div className="footer-grid">
            <div>
              <a className="logo" href="#top">
                <img className="logo-image logo-image-footer" src="/mph-logo.jpg" alt="Machinery Parts Hub" />
                <span>Machinery Parts Hub · MPH Group</span>
              </a>
              <p className="footer-copy">Надёжные запчасти для строительной и дорожно-строительной техники.</p>
            </div>

            <div>
              <h4>Навигация</h4>
              <ul>
                <li><a href="#about">О нас</a></li>
                <li><a href="#catalog">Запчасти</a></li>
                <li><a href="#request">Запрос</a></li>
                <li><a href="#contact">Контакты</a></li>
                <li><a href="https://mphgroup.kz/" target="_blank" rel="noreferrer">MPH Group</a></li>
              </ul>
            </div>

            <div>
              <h4>Категории</h4>
              <ul>
                {categories.slice(1).map((category) => (
                  <li key={category}><a href="#catalog">{category}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <h4>Контакты</h4>
              <ul>
                <li><a href="tel:+77089693220">+7 708 969 32 20</a></li>
                <li><a href="mailto:MachineryPartsHub@mphgroup.kz">MachineryPartsHub@mphgroup.kz</a></li>
              </ul>
              <h4 className="social-title">Соцсети</h4>
              <ul className="social-links">
                <li><a href="https://www.instagram.com/machinerypartshub" target="_blank" rel="noreferrer">Instagram</a></li>
                <li><a href="https://www.facebook.com/profile.php?id=61569470997783" target="_blank" rel="noreferrer">Facebook</a></li>
                <li><a href="https://www.youtube.com/@MachineryPartsHub" target="_blank" rel="noreferrer">YouTube</a></li>
              </ul>
            </div>
          </div>

          <div className="copy">
            <span>© {new Date().getFullYear()} Machinery Parts Hub · MPH Group.</span>
            <a href="https://mphgroup.kz/" target="_blank" rel="noreferrer">Подробнее о MPH Group</a>
            <span>Указанные цены на сайте не являются публичной офертой.</span>
          </div>
        </div>
      </footer>
    </>
  )
}

function AdminPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [loginError, setLoginError] = useState('')

  const loadRequests = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/requests/list/`, { credentials: 'include' })
      if (!response.ok) throw new Error('failed')
      const data = (await response.json()) as ServiceRequest[]
      setRequests(data)
    } catch {
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  const checkSession = async () => {
    setAuthLoading(true)
    try {
      const csrfResponse = await fetch(`${API_BASE_URL}/api/requests/csrf/`, { credentials: 'include' })
      if (!csrfResponse.ok) throw new Error('CSRF token request failed')
      const csrfData = (await csrfResponse.json()) as { csrfToken: string }
      csrfToken = csrfData.csrfToken

      const response = await fetch(`${API_BASE_URL}/api/requests/session/`, { credentials: 'include' })
      if (!response.ok) {
        setAuthenticated(false)
        setUsername('')
        return
      }

      const data = (await response.json()) as { authenticated: boolean; username?: string }
      setAuthenticated(Boolean(data.authenticated))
      setUsername(data.username ?? '')
    } catch {
      setAuthenticated(false)
      setUsername('')
      setLoginError('Не удалось проверить вход. Проверьте соединение и обновите страницу.')
    } finally {
      setAuthLoading(false)
    }
  }

  useEffect(() => {
    void checkSession()
  }, [])

  useEffect(() => {
    if (authenticated) {
      void loadRequests()
    }
  }, [authenticated])

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setLoginError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/requests/login/`, {
        method: 'POST',
        credentials: 'include',
        headers: buildHeaders(true),
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        throw new Error('login failed')
      }

      const data = (await response.json()) as { username?: string }
      setUsername(data.username ?? credentials.username)
      setAuthenticated(true)
      setCredentials({ username: '', password: '' })
    } catch {
      setAuthenticated(false)
      setUsername('')
      setLoginError('Не удалось войти. Проверьте имя пользователя и пароль.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch(`${API_BASE_URL}/api/requests/logout/`, {
      method: 'POST',
      credentials: 'include',
      headers: buildHeaders(true),
    })

    setAuthenticated(false)
    setUsername('')
    setRequests([])
  }

  const updateStatus = async (id: number, status: ServiceRequest['status']) => {
    await fetch(`${API_BASE_URL}/api/requests/${id}/`, {
      method: 'PATCH',
      credentials: 'include',
      headers: buildHeaders(true),
      body: JSON.stringify({ status }),
    })

    setRequests((current) =>
      current.map((request) =>
        request.id === id ? { ...request, status } : request,
      ),
    )
  }

  if (authLoading) {
    return <div className="admin-shell"><p>Проверка доступа...</p></div>
  }

  if (!authenticated) {
    return (
      <div className="admin-shell">
        <header className="admin-header">
          <div className="admin-brand">
            <img className="logo-image" src="/mph-logo.jpg" alt="Machinery Parts Hub" />
            <h1>Панель менеджера</h1>
          </div>
          <a href={PUBLIC_SITE_URL} className="link-button">На сайт</a>
        </header>

        <section className="admin-table-wrap">
          <form onSubmit={handleLogin} className="admin-login" noValidate>
            <h2>Вход для менеджера</h2>
            <label>
              Имя пользователя
              <input
                value={credentials.username}
                onChange={(event) => setCredentials((current) => ({ ...current, username: event.target.value }))}
              />
            </label>
            <label>
              Пароль
              <input
                type="password"
                value={credentials.password}
                onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
              />
            </label>
            <button className="btn" type="submit" disabled={loading}>Войти</button>
            {loginError && <p className="err" role="alert">{loginError}</p>}
          </form>
        </section>
      </div>
    )
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <h1>Панель менеджера</h1>
          <p className="muted">Вы вошли как {username}</p>
        </div>
        <div className="admin-actions">
          <button type="button" className="link-button" onClick={handleLogout}>Выйти</button>
          <a href={PUBLIC_SITE_URL} className="link-button">На сайт</a>
        </div>
      </header>

      <section className="admin-table-wrap">
        {loading ? (
          <p>Загрузка заявок...</p>
        ) : requests.length === 0 ? (
          <p>Нет заявок.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Клиент</th>
                <th>Телефон</th>
                <th>Техника</th>
                <th>Запрос</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>{request.name}</td>
                  <td>{request.phone}</td>
                  <td>{request.vehicle}</td>
                  <td>{request.part_or_service}</td>
                  <td>
                    <select
                      value={request.status}
                      onChange={(event) => updateStatus(request.id, event.target.value as ServiceRequest['status'])}
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {ADMIN_ONLY ? (
          <Route path="*" element={<AdminPage />} />
        ) : (
          <>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/admin"
              element={ADMIN_SITE_URL.startsWith('http') ? <Navigate to={ADMIN_SITE_URL} replace /> : <AdminPage />}
            />
          </>
        )}
      </Routes>
    </BrowserRouter>
  )
}

export default App
