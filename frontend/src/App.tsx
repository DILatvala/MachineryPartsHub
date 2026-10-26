import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'

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
  { id: 1, name: 'Тормозные колодки', category: 1, category_name: 'Тормоза', description: 'Тормозные колодки для легкового автомобиля.', is_active: true },
  { id: 2, name: 'Масляный фильтр', category: 2, category_name: 'Фильтры', description: 'Масляный фильтр для двигателя.', is_active: true },
  { id: 3, name: 'Свечи зажигания', category: 3, category_name: 'Двигатель', description: 'Комплект свечей для стабильного зажигания.', is_active: true },
  { id: 4, name: 'Амортизатор', category: 4, category_name: 'Подвеска', description: 'Передний или задний амортизатор в зависимости от модели.', is_active: true },
  { id: 5, name: 'Аккумулятор', category: 5, category_name: 'Электрика', description: 'Аккумулятор с достаточной ёмкостью для сезона.', is_active: true },
  { id: 6, name: 'Диагностика', category: 6, category_name: 'Сервис', description: 'Комплексная диагностика автомобиля.', is_active: true },
]

const categories = ['Все', 'Двигатель', 'Тормоза', 'Фильтры', 'Подвеска', 'Электрика', 'Сервис']

const initialForm: FormState = {
  name: '',
  phone: '',
  vehicle: '',
  part: '',
}

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) || 'http://127.0.0.1:8000'

const buildHeaders = (includeCsrf = false) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  if (includeCsrf) {
    const csrfCookie = document.cookie
      .split('; ')
      .find((entry) => entry.startsWith('csrftoken='))
      ?.split('=')[1]

    if (csrfCookie) {
      headers['X-CSRFToken'] = decodeURIComponent(csrfCookie)
    }
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
  const [formData, setFormData] = useState<FormState>(initialForm)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [submitted, setSubmitted] = useState(false)

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
    if (formData.vehicle.trim().length < 3) nextErrors.vehicle = 'Укажите марку, модель и год.'
    if (formData.part.trim().length < 3) nextErrors.part = 'Укажите нужную запчасть или услугу.'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!validateForm()) return

    try {
      await fetch(`${API_BASE_URL}/api/requests/`, {
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
    } catch (error) {
      console.error('Request send failed', error)
    }

    setSubmitted(true)
    setFormData(initialForm)
  }

  return (
    <>
      <header className="site-header">
        <div className="wrap bar">
          <a className="logo" href="#top" aria-label="MachineryPartsHub — на главную">
            <i>M</i>
            <span>
              MachineryParts<span className="accent">Hub</span>
            </span>
          </a>
          <Link to="/admin" className="link-button">Admin</Link>
          <button className="menu" type="button" aria-expanded="false">
            Меню
          </button>
          <nav aria-label="Основная навигация">
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
              <span className="eyebrow">Автозапчасти и сервис</span>
              <h1>
                Нужная деталь. <em>Установлена правильно.</em>
              </h1>
              <p className="lead">
                Запчасти и сервис для вашего автомобиля. Расскажите, на чём вы ездите и что нужно, — мы поможем проверить наличие.
              </p>
              <form className="search" role="search">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Поиск запчастей, например: колодки"
                  aria-label="Поиск запчастей"
                />
                <button type="submit">Найти</button>
              </form>
              <p className="hint">Нажмите «/», чтобы перейти к поиску. Каталог — демонстрационный.</p>
            </div>

            <div className="photo-block" role="img" aria-label="Иллюстрация складских стеллажей — заглушка для фото">
              <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                <rect width="400" height="300" fill="#1a1a1a" />
                <rect y="250" width="400" height="50" fill="#262626" />
                <g fill="#2e2e2e">
                  <rect x="20" y="40" width="360" height="6" />
                  <rect x="20" y="115" width="360" height="6" />
                  <rect x="20" y="190" width="360" height="6" />
                  <rect x="20" y="40" width="6" height="210" />
                  <rect x="194" y="40" width="6" height="210" />
                  <rect x="374" y="40" width="6" height="210" />
                </g>
                <g fill="#3a3a3a">
                  <rect x="36" y="14" width="60" height="26" />
                  <rect x="104" y="22" width="44" height="18" />
                  <rect x="210" y="12" width="70" height="28" />
                  <rect x="40" y="86" width="50" height="29" />
                  <rect x="100" y="72" width="70" height="43" />
                  <rect x="220" y="90" width="60" height="25" />
                  <rect x="290" y="76" width="70" height="39" />
                  <rect x="36" y="160" width="70" height="30" />
                  <rect x="214" y="150" width="46" height="40" />
                  <rect x="270" y="164" width="86" height="26" />
                </g>
                <g fill="#FFC400">
                  <rect x="40" y="94" width="50" height="4" />
                  <rect x="104" y="80" width="70" height="4" />
                  <rect x="294" y="84" width="70" height="4" />
                  <rect x="214" y="158" width="46" height="4" />
                  <rect x="36" y="168" width="70" height="4" />
                </g>
              </svg>
              <span>Заглушка · замените фото склада</span>
            </div>
          </div>

          <div className="wrap strip">
            <div><b>Запчасти</b>По категориям и автомобилям</div>
            <div><b>Сервис</b>Обслуживание в мастерской по запросу</div>
            <div><b>Поддержка</b>Оставьте запрос — проверим наличие</div>
          </div>
        </section>

        <section id="about">
          <div className="wrap about">
            <div>
              <span className="eyebrow">О нас</span>
              <h2>Запчасти и сервис в одном месте</h2>
              <p>
                MachineryPartsHub — автозапчасти и сервисное обслуживание. [Впишите здесь историю компании, год основания и бренды — только то, что можете подтвердить.]
              </p>
              <div className="pillars">
                <div>Запчасти</div>
                <div>Сервис</div>
                <div>Проверка наличия</div>
                <div>Понятная связь</div>
              </div>
            </div>

            <div className="pair">
              <div className="photo-block" role="img" aria-label="Заглушка: мастерская">
                <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                  <rect width="400" height="300" fill="#222" />
                  <rect y="230" width="400" height="70" fill="#2d2d2d" />
                  <path d="M60 230 L90 160 H300 L340 230Z" fill="#3b3b3b" />
                  <circle cx="120" cy="236" r="26" fill="#111" />
                  <circle cx="290" cy="236" r="26" fill="#111" />
                  <rect x="0" y="90" width="400" height="5" fill="#FFC400" />
                  <path d="M30 0v90M370 0v90" stroke="#444" strokeWidth="4" />
                </svg>
                <span>Мастерская · заглушка</span>
              </div>
              <div className="photo-block" role="img" aria-label="Заглушка: стойка выдачи запчастей">
                <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                  <rect width="400" height="300" fill="#e4e4e0" />
                  <rect y="170" width="400" height="130" fill="#cfcfca" />
                  <g fill="#9a9a95">
                    <rect x="40" y="60" width="90" height="110" />
                    <rect x="150" y="90" width="80" height="80" />
                    <rect x="250" y="40" width="100" height="130" />
                  </g>
                  <rect x="40" y="110" width="90" height="6" fill="#FFC400" />
                  <rect x="250" y="90" width="100" height="6" fill="#FFC400" />
                </svg>
                <span>Выдача запчастей · заглушка</span>
              </div>
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
            <p className="note">Демонстрационные позиции — без цен, наличия и характеристик. Замените реальными данными каталога.</p>
          </div>
        </section>

        <section id="request">
          <div className="wrap formgrid">
            <div>
              <span className="eyebrow">Запрос</span>
              <h2>Расскажите, что вам нужно</h2>
              <p>Укажите данные автомобиля и нужную запчасть или услугу. Поля со звёздочкой * обязательны.</p>
            </div>

            <div>
              <form onSubmit={handleSubmit} noValidate>
                <div className="proto" role="note">
                  <b>Прототип:</b> форма ничего не отправляет. Данные остаются в вашем браузере.
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
                  Данные автомобиля *
                  <input name="vehicle" value={formData.vehicle} onChange={(event) => setFormData({ ...formData, vehicle: event.target.value })} aria-invalid={Boolean(errors.vehicle)} placeholder="Марка, модель, год, VIN (по желанию)" />
                  <span className="err">{errors.vehicle ?? ''}</span>
                </label>

                <label>
                  Запчасть или услуга *
                  <textarea name="part" rows={4} value={formData.part} onChange={(event) => setFormData({ ...formData, part: event.target.value })} aria-invalid={Boolean(errors.part)} placeholder="Что вы ищете?" />
                  <span className="err">{errors.part ?? ''}</span>
                </label>

                <button className="btn" type="submit">Оставить запрос</button>
              </form>

              {submitted && (
                <div className="ok" style={{ display: 'block' }} role="status">
                  <b>Запрос принят (демо)</b>
                  <p>
                    Это прототип — ничего не отправлено. На рабочем сайте команда связалась бы с вами, {formData.name || 'клиент'}, по телефону.
                  </p>
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
              <p className="lead">Отправьте запрос — наша команда поможет проверить наличие и подобрать подходящее решение.</p>
              <div className="cta-row">
                <a className="btn" href="#request">Оставить запрос</a>
                <a className="btn ghost" href="#contact">WhatsApp</a>
                <a className="btn ghost" href="#contact">Позвонить</a>
              </div>
            </div>

            <dl>
              <dt>Телефон</dt>
              <dd>[Номер телефона]</dd>
              <dt>WhatsApp</dt>
              <dd>[Номер WhatsApp]</dd>
              <dt>Адрес</dt>
              <dd>[Адрес]</dd>
              <dt>Часы работы</dt>
              <dd>[Часы работы]</dd>
              <dt>Email</dt>
              <dd>[Email]</dd>
            </dl>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <div className="footer-grid">
            <div>
              <a className="logo" href="#top">
                <i>M</i>
                <span>
                  MachineryParts<span className="accent">Hub</span>
                </span>
              </a>
              <p className="footer-copy">Автозапчасти и сервис.</p>
            </div>

            <div>
              <h4>Навигация</h4>
              <ul>
                <li><a href="#about">О нас</a></li>
                <li><a href="#catalog">Запчасти</a></li>
                <li><a href="#request">Запрос</a></li>
                <li><a href="#contact">Контакты</a></li>
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
                <li>[Номер телефона]</li>
                <li>[Email]</li>
                <li>[Адрес]</li>
              </ul>
              <h4 className="social-title">Соцсети</h4>
              <ul className="social-links">
                <li><a href="#">Instagram</a></li>
                <li><a href="#">Facebook</a></li>
                <li><a href="#">YouTube</a></li>
              </ul>
            </div>
          </div>

          <div className="copy">
            <span>© {new Date().getFullYear()} MachineryPartsHub. Все права защищены.</span>
            <span>Дизайн-прототип</span>
          </div>
        </div>
      </footer>
    </>
  )
}

function AdminPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [credentials, setCredentials] = useState({ username: '', password: '' })

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
      const response = await fetch(`${API_BASE_URL}/api/requests/session/`, { credentials: 'include' })
      if (!response.ok) {
        setAuthenticated(false)
        setUsername('')
        return
      }

      const data = (await response.json()) as { authenticated: boolean; username?: string }
      setAuthenticated(Boolean(data.authenticated))
      setUsername(data.username ?? '')
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
          <h1>Manager panel</h1>
          <Link to="/" className="link-button">На сайт</Link>
        </header>

        <section className="admin-table-wrap">
          <form onSubmit={handleLogin} className="admin-login" noValidate>
            <h2>Вход в менеджерский раздел</h2>
            <label>
              Username
              <input
                value={credentials.username}
                onChange={(event) => setCredentials((current) => ({ ...current, username: event.target.value }))}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={credentials.password}
                onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
              />
            </label>
            <button className="btn" type="submit" disabled={loading}>Войти</button>
          </form>
        </section>
      </div>
    )
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <h1>Manager panel</h1>
          <p className="muted">Вы вошли как {username}</p>
        </div>
        <div className="admin-actions">
          <button type="button" className="link-button" onClick={handleLogout}>Выйти</button>
          <Link to="/" className="link-button">На сайт</Link>
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
                <th>Авто</th>
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
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
