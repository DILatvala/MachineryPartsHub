import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { localeTag, translate, type Language } from './i18n'

type LanguageContextValue = {
  language: Language
  setLanguage: (language: Language) => void
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'ru',
  setLanguage: () => undefined,
})

function useLanguage() {
  return useContext(LanguageContext)
}

function LanguageSelector() {
  const { language, setLanguage } = useLanguage()
  const label = translate(language, 'Язык')

  return (
    <label className="language-picker">
      <span className="sr-only">{label}</span>
      <select aria-label={label} value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
        <option value="ru">RU</option>
        <option value="kk">KZ</option>
        <option value="en">EN</option>
      </select>
    </label>
  )
}

type CatalogItem = {
  id: number
  name: string
  category: number
  category_name: string
  description: string
  brand?: string
  equipment_model?: string
  image?: string | null
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
const currentYear = new Date().getFullYear()
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
  const { language } = useLanguage()
  const t = (text: string) => translate(language, text)
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
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.equipment_model?.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesCategory && matchesQuery
    })
  }, [activeCategory, catalog, searchQuery])
  const categoryOptions = useMemo(
    () => ['Все', ...new Set(catalog.map((item) => item.category_name))],
    [catalog],
  )

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
          <a className="logo" href="#top" aria-label={`${t('Запчасти для спецтехники')} — ${t('О нас')}`}>
            <img className="logo-image" src="/mph-logo.jpg" alt="Machinery Parts Hub" />
            <span>{t('Запчасти для спецтехники')}</span>
          </a>
          <a href={ADMIN_SITE_URL} className="link-button">{t('Менеджер')}</a>
          <LanguageSelector />
          <button className="menu" type="button" aria-expanded={menuOpen} aria-controls="site-navigation" onClick={() => setMenuOpen((open) => !open)}>
            {t('Меню')}
          </button>
          <nav id="site-navigation" className={menuOpen ? 'nav-open' : ''} aria-label="Основная навигация" onClick={() => setMenuOpen(false)}>
            <a href="#about">{t('О нас')}</a>
            <a href="#catalog">{t('Запчасти')}</a>
            <a href="#request">{t('Запрос')}</a>
            <a href="#contact">{t('Контакты')}</a>
          </nav>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="wrap hero-grid">
            <div>
              <div className="hero-carousel" role="group" aria-roledescription="carousel" aria-label={t('Преимущества Machinery Parts Hub')}>
                <div className="hero-slide" aria-live="polite" aria-atomic="true">
                  <span className="eyebrow">{t(heroSlides[activeHeroSlide].eyebrow)}</span>
                  <h1>
                    {t(heroSlides[activeHeroSlide].title)} <em>{t(heroSlides[activeHeroSlide].emphasis)}</em>
                  </h1>
                  <p className="lead">{t(heroSlides[activeHeroSlide].description)}</p>
                </div>
                <div className="hero-carousel-controls">
                  <button
                    type="button"
                    className="carousel-arrow"
                    aria-label={t('Предыдущий слайд')}
                    onClick={() => setActiveHeroSlide((current) => (current - 1 + heroSlides.length) % heroSlides.length)}
                  >
                    ←
                  </button>
                  <div className="carousel-dots" role="group" aria-label={t('Выбрать слайд')}>
                    {heroSlides.map((slide, index) => (
                      <button
                        key={slide.eyebrow}
                        type="button"
                        className="carousel-dot"
                        aria-label={`${t('Слайд')} ${index + 1}: ${t(slide.eyebrow)}`}
                        aria-pressed={activeHeroSlide === index}
                        onClick={() => setActiveHeroSlide(index)}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    className="carousel-arrow"
                    aria-label={t('Следующий слайд')}
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
                  placeholder={t('Например: гидронасос, фильтр')}
                  aria-label={t('Поиск запчастей')}
                />
                <button type="submit">{t('Найти')}</button>
              </form>
              <p className="hint">{t('Подбор запчастей для строительной и дорожно-строительной техники.')}</p>
            </div>

            <div className="hero-brand-card">
              <img src="/mph-logo.jpg" alt="Логотип Machinery Parts Hub с изображением спецтехники и запчастей" />
              <span>{t('Надёжные запчасти для спецтехники')}</span>
            </div>
          </div>

          <div className="wrap strip">
            <div><b>{t('Оригинал и аналоги')}</b>{t('Проверенные комплектующие')}</div>
            <div><b>{t('Доставка')}</b>{t('По Казахстану и СНГ')}</div>
            <div><b>{t('Подбор')}</b>{t('Профессиональная консультация')}</div>
          </div>
        </section>

        <section id="about">
          <div className="wrap about">
            <div>
              <span className="eyebrow">{t('О нас')}</span>
              <h2>{t('Надёжные запчасти для спецтехники')}</h2>
              <p>
                {t('Компания Machinery Parts Hub (MPH Group) — ваш надёжный партнёр в сфере поставок запчастей для спецтехники. Предлагаем комплектующие для экскаваторов, бульдозеров, погрузчиков, кранов и другой строительной и дорожно-строительной техники.')}
              </p>
              <div className="pillars">
                <div>{t('Оригинальные и аналоговые запчасти от ведущих производителей')}</div>
                <div>{t('Гарантия качества и долговечности')}</div>
                <div>{t('Оперативная доставка по Казахстану и СНГ')}</div>
                <div>{t('Профессиональная консультация и подбор деталей')}</div>
              </div>
            </div>

            <div className="about-assortment">
              <span className="eyebrow">{t('Ассортимент запчастей')}</span>
              <h3>{t('Комплектующие для рабочих машин')}</h3>
              <ul>
                <li>{t('Двигатели и комплектующие')}</li>
                <li>{t('Гидравлика и гидронасосы')}</li>
                <li>{t('Фильтры, ремни, турбины и топливные системы')}</li>
                <li>{t('Ходовая часть, редукторы и тормозные системы')}</li>
              </ul>
              <p>{t('Работаем с владельцами спецтехники, сервисными центрами, строительными и транспортными компаниями.')}</p>
            </div>
          </div>
        </section>

        <section id="catalog" className="alt">
          <div className="wrap">
            <div className="head">
              <div>
                <span className="eyebrow">{t('Запчасти и сервис')}</span>
                <h2>{t('Каталог по категориям')}</h2>
              </div>
              <div className="chips" role="group" aria-label={t('Фильтр по категории')}>
                {categoryOptions.map((category) => (
                  <button
                    key={category}
                    className="chip"
                    type="button"
                    aria-pressed={activeCategory === category}
                    onClick={() => setActiveCategory(category)}
                  >
                    {t(category)}
                  </button>
                ))}
              </div>
            </div>

            <div className="cards" aria-live="polite">
              {filteredItems.map((item) => (
                <article key={item.id} className="card">
                  {item.image
                    ? <div className="photo-block"><img src={item.image} alt={item.name} loading="lazy" /></div>
                    : <div className="photo-block" dangerouslySetInnerHTML={{ __html: ICON }} />}
                  <div className="body">
                    <small>{t(item.category_name)}</small>
                    <h3>{t(item.name)}</h3>
                    <p>{t(item.description)}</p>
                    {(item.brand || item.equipment_model) && (
                      <p className="part-fit">
                        {[item.brand, item.equipment_model].filter(Boolean).map((value) => t(value!)).join(' · ')}
                      </p>
                    )}
                  </div>
                  <button type="button" onClick={() => setFormData((current) => ({ ...current, part: [item.name, item.brand, item.equipment_model].filter(Boolean).join(' — ') }))}>{t('Запросить →')}</button>
                </article>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <p className="empty" style={{ display: 'block' }}>
                {t('По вашему запросу ничего не найдено. Попробуйте другое слово или отправьте запрос ниже.')}
              </p>
            )}
            <p className="note">{t('Указанные цены на сайте не являются публичной офертой.')}</p>
          </div>
        </section>

        <section id="request">
          <div className="wrap formgrid">
            <div>
              <span className="eyebrow">{t('Запрос')}</span>
              <h2>{t('Расскажите, что вам нужно')}</h2>
              <p>{t('Укажите модель спецтехники и нужную запчасть. Поля со звёздочкой * обязательны.')}</p>
            </div>

            <div>
              <form onSubmit={handleSubmit} noValidate>
                <div className="proto" role="note">
                  <b>{t('Отправьте запрос:')}</b> {t('он будет сохранён, чтобы менеджер мог его обработать.')}
                </div>

                <div className="r2">
                  <label>
                    {t('Имя *')}
                    <input name="name" value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} aria-invalid={Boolean(errors.name)} />
                    <span className="err">{errors.name ? t(errors.name) : ''}</span>
                  </label>

                  <label>
                    {t('Телефон *')}
                    <input name="phone" type="tel" value={formData.phone} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} aria-invalid={Boolean(errors.phone)} placeholder="+7" />
                    <span className="err">{errors.phone ? t(errors.phone) : ''}</span>
                  </label>
                </div>

                <label>
                  {t('Данные спецтехники *')}
                  <input name="vehicle" value={formData.vehicle} onChange={(event) => setFormData({ ...formData, vehicle: event.target.value })} aria-invalid={Boolean(errors.vehicle)} placeholder={t('Марка, модель, год, серийный номер')} />
                  <span className="err">{errors.vehicle ? t(errors.vehicle) : ''}</span>
                </label>

                <label>
                  {t('Запчасть или услуга *')}
                  <textarea name="part" rows={4} value={formData.part} onChange={(event) => setFormData({ ...formData, part: event.target.value })} aria-invalid={Boolean(errors.part)} placeholder={t('Что вы ищете?')} />
                  <span className="err">{errors.part ? t(errors.part) : ''}</span>
                </label>

                <button className="btn" type="submit">{t('Оставить запрос')}</button>
                {submissionError && <p className="err" role="alert">{t(submissionError)}</p>}
              </form>

              {submitted && (
                <div className="ok" style={{ display: 'block' }} role="status">
                  <b>{t('Запрос сохранён')}</b>
                  <p>{t('Менеджер увидит ваш запрос в панели управления.')}</p>
                  <button className="btn ghost" type="button" onClick={() => setSubmitted(false)}>{t('Новый запрос')}</button>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="contact" id="contact">
          <div className="wrap grid">
            <div>
              <span className="eyebrow accent-light">{t('Контакты')}</span>
              <h2>{t('Ищете нужную запчасть?')}</h2>
              <p className="lead">{t('Свяжитесь с нами для консультации и профессионального подбора запчастей для вашей техники.')}</p>
              <div className="cta-row">
                <a className="btn" href="#request">{t('Оставить запрос')}</a>
                <a className="btn ghost" href="https://wa.me/77089693220" target="_blank" rel="noreferrer">{t('WhatsApp')}</a>
                <a className="btn ghost" href="tel:+77089693220">{t('Позвонить')}</a>
              </div>
            </div>

            <dl>
              <dt>Телефон</dt>
              <dd><a href="tel:+77089693220">+7 708 969 32 20</a></dd>
              <dt>{t('Доставка')}</dt>
              <dd>{t('Казахстан и страны СНГ')}</dd>
              <dt>{t('Подбор')}</dt>
              <dd>{t('Запчасти для спецтехники')}</dd>
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
              <p className="footer-copy">{t('Надёжные запчасти для строительной и дорожно-строительной техники.')}</p>
            </div>

            <div>
              <h4>{t('Навигация')}</h4>
              <ul>
                <li><a href="#about">{t('О нас')}</a></li>
                <li><a href="#catalog">{t('Запчасти')}</a></li>
                <li><a href="#request">{t('Запрос')}</a></li>
                <li><a href="#contact">{t('Контакты')}</a></li>
                <li><a href="https://mphgroup.kz/" target="_blank" rel="noreferrer">MPH Group</a></li>
              </ul>
            </div>

            <div>
              <h4>{t('Категории')}</h4>
              <ul>
                {categoryOptions.slice(1).map((category) => (
                  <li key={category}><a href="#catalog">{t(category)}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <h4>{t('Контакты')}</h4>
              <ul>
                <li><a href="tel:+77089693220">+7 708 969 32 20</a></li>
                <li><a href="mailto:MachineryPartsHub@mphgroup.kz">MachineryPartsHub@mphgroup.kz</a></li>
              </ul>
              <h4 className="social-title">{t('Соцсети')}</h4>
              <ul className="social-links">
                <li><a href="https://www.instagram.com/machinerypartshub" target="_blank" rel="noreferrer">Instagram</a></li>
                <li><a href="https://www.facebook.com/profile.php?id=61569470997783" target="_blank" rel="noreferrer">Facebook</a></li>
                <li><a href="https://www.youtube.com/@MachineryPartsHub" target="_blank" rel="noreferrer">YouTube</a></li>
              </ul>
            </div>
          </div>

          <div className="copy">
            <span>© {currentYear} Machinery Parts Hub · MPH Group.</span>
            <a href="https://mphgroup.kz/" target="_blank" rel="noreferrer">{t('Подробнее о MPH Group')}</a>
            <span>{t('Указанные цены на сайте не являются публичной офертой.')}</span>
          </div>
        </div>
      </footer>
    </>
  )
}

function AdminPage() {
  const { language } = useLanguage()
  const t = useCallback((text: string) => translate(language, text), [language])
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [parts, setParts] = useState<CatalogItem[]>([])
  const [catalogCategories, setCatalogCategories] = useState<Array<{ id: number; name: string }>>([])
  const [loginLoading, setLoginLoading] = useState(false)
  const [requestsLoaded, setRequestsLoaded] = useState(false)
  const [catalogLoaded, setCatalogLoaded] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [requestError, setRequestError] = useState('')
  const [notificationError, setNotificationError] = useState('')
  const [activeAdminTab, setActiveAdminTab] = useState<'requests' | 'catalog'>('requests')
  const [catalogError, setCatalogError] = useState('')
  const [catalogSuccess, setCatalogSuccess] = useState('')
  const [editingPartId, setEditingPartId] = useState<number | null>(null)
  const [partForm, setPartForm] = useState({
    name: '',
    description: '',
    category: '',
    brand: '',
    equipment_model: '',
    is_active: true,
  })
  const [partImage, setPartImage] = useState<File | null>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted',
  )
  const [incomingRequests, setIncomingRequests] = useState<ServiceRequest[]>([])
  const [newRequestCount, setNewRequestCount] = useState(0)
  const knownRequestIds = useRef<Set<number> | null>(null)
  const refreshInProgress = useRef(false)

  const loadRequests = useCallback(async () => {
    if (refreshInProgress.current) return
    refreshInProgress.current = true
    try {
      const response = await fetch(`${API_BASE_URL}/api/requests/list/`, { credentials: 'include' })
      if (!response.ok) throw new Error(`Request refresh failed with status ${response.status}`)
      const data = (await response.json()) as ServiceRequest[]
      setRequests(data)
      setRequestError('')

      const currentIds = new Set(data.map((request) => request.id))
      if (knownRequestIds.current === null) {
        knownRequestIds.current = currentIds
      } else {
        const newItems = data.filter((request) => !knownRequestIds.current?.has(request.id))
        if (newItems.length > 0) {
          setIncomingRequests(newItems)
          setNewRequestCount((count) => count + newItems.length)
          knownRequestIds.current = new Set([...knownRequestIds.current, ...currentIds])

          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            try {
              new Notification(t('Новая заявка'), {
                body: newItems.length === 1
                  ? `${newItems[0].name}: ${newItems[0].part_or_service}`
                  : `${t('Новых заявок')}: ${newItems.length}`,
                icon: '/mph-logo.jpg',
              })
            } catch (error) {
              console.error('Browser notification failed', error)
              setNotificationError(t('Не удалось показать уведомление браузера.'))
            }
          }
        } else {
          knownRequestIds.current = currentIds
        }
      }
    } catch (error) {
      console.error('Request refresh failed', error)
      setRequestError(t('Не удалось обновить заявки. Проверьте соединение и попробуйте ещё раз.'))
    } finally {
      setRequestsLoaded(true)
      refreshInProgress.current = false
    }
  }, [t])

  const loadCatalog = useCallback(async () => {
    setCatalogError('')
    try {
      const [partsResponse, categoriesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/catalog/manage/`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/catalog/categories/`),
      ])
      if (!partsResponse.ok || !categoriesResponse.ok) {
        throw new Error(`Catalog refresh failed (${partsResponse.status}/${categoriesResponse.status})`)
      }
      const [partData, categoryData] = await Promise.all([
        partsResponse.json() as Promise<CatalogItem[]>,
        categoriesResponse.json() as Promise<Array<{ id: number; name: string }>>,
      ])
      setParts(partData)
      setCatalogCategories(categoryData)
      setPartForm((current) => ({
        ...current,
        category: current.category || (categoryData[0] ? String(categoryData[0].id) : ''),
      }))
    } catch (error) {
      console.error('Catalog refresh failed', error)
      setCatalogError(t('Не удалось загрузить каталог. Проверьте соединение и попробуйте ещё раз.'))
      return false
    } finally {
      setCatalogLoaded(true)
    }
    return true
  }, [t])

  const checkSession = async () => {
    try {
      const csrfResponse = await fetch(`${API_BASE_URL}/api/requests/csrf/`, { credentials: 'include' })
      if (!csrfResponse.ok) throw new Error(`CSRF token request failed with status ${csrfResponse.status}`)
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
      const interval = window.setInterval(() => void loadRequests(), 30000)
      return () => window.clearInterval(interval)
    }
    return undefined
  }, [authenticated, loadRequests])

  useEffect(() => {
    if (authenticated && activeAdminTab === 'catalog') {
      void loadCatalog()
    }
  }, [authenticated, activeAdminTab, loadCatalog])

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault()
    setLoginLoading(true)
    setLoginError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/requests/login/`, {
        method: 'POST',
        credentials: 'include',
        headers: buildHeaders(true),
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        throw new Error(`Login failed with status ${response.status}`)
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
      setLoginLoading(false)
    }
  }

  const handleLogout = async () => {
    const response = await fetch(`${API_BASE_URL}/api/requests/logout/`, {
      method: 'POST',
      credentials: 'include',
      headers: buildHeaders(true),
    })
    if (!response.ok) {
      setLoginError(t('Не удалось завершить сеанс. Попробуйте ещё раз.'))
      return
    }

    setAuthenticated(false)
    setUsername('')
    setRequests([])
    setRequestsLoaded(false)
    knownRequestIds.current = null
  }

  const updateStatus = async (id: number, status: ServiceRequest['status']) => {
    const response = await fetch(`${API_BASE_URL}/api/requests/${id}/`, {
      method: 'PATCH',
      credentials: 'include',
      headers: buildHeaders(true),
      body: JSON.stringify({ status }),
    })
    if (!response.ok) {
      setLoginError(t('Не удалось обновить статус заявки. Попробуйте ещё раз.'))
      return
    }

    setRequests((current) =>
      current.map((request) =>
        request.id === id ? { ...request, status } : request,
      ),
    )
  }

  const resetPartForm = () => {
    setEditingPartId(null)
    setPartForm({ name: '', description: '', category: '', brand: '', equipment_model: '', is_active: true })
    setPartImage(null)
    setCatalogError('')
    setCatalogSuccess('')
  }

  const editPart = (part: CatalogItem) => {
    setEditingPartId(part.id)
    setPartImage(null)
    setPartForm({
      name: part.name,
      description: part.description,
      category: String(part.category),
      brand: part.brand ?? '',
      equipment_model: part.equipment_model ?? '',
      is_active: part.is_active,
    })
    setCatalogSuccess('')
    setCatalogError('')
  }

  const savePart = async (event: FormEvent) => {
    event.preventDefault()
    setCatalogError('')
    setCatalogSuccess('')
    const payload = { ...partForm, category: Number(partForm.category) }
    const url = editingPartId
      ? `${API_BASE_URL}/api/catalog/manage/${editingPartId}/`
      : `${API_BASE_URL}/api/catalog/manage/`

    try {
      const headers = buildHeaders(true)
      let body: BodyInit
      if (partImage) {
        const formData = new FormData()
        Object.entries(payload).forEach(([key, value]) => formData.append(key, String(value)))
        formData.append('image', partImage)
        delete headers['Content-Type']
        body = formData
      } else {
        body = JSON.stringify(payload)
      }

      const response = await fetch(url, {
        method: editingPartId ? 'PATCH' : 'POST',
        credentials: 'include',
        headers,
        body,
      })
      if (!response.ok) {
        const details = await response.json() as Record<string, string[]>
        throw new Error(Object.values(details).flat().map(t).join(' ') || `Catalog save failed (${response.status})`)
      }
      if (!await loadCatalog()) return
      setCatalogSuccess(t(editingPartId ? 'Карточка обновлена.' : 'Позиция добавлена в каталог.'))
      resetPartForm()
    } catch (error) {
      console.error('Catalog save failed', error)
      setCatalogError(`${t('Не удалось сохранить позицию.')} ${error instanceof Error ? error.message : ''}`)
    }
  }

  const archivePart = async (part: CatalogItem) => {
    if (!window.confirm(`${t('Скрыть позицию из публичного каталога?')}\n${part.name}`)) return
    try {
      const response = await fetch(`${API_BASE_URL}/api/catalog/manage/${part.id}/`, {
        method: 'DELETE',
        credentials: 'include',
        headers: buildHeaders(true),
      })
      if (!response.ok) throw new Error(`Catalog archive failed (${response.status})`)
      if (!await loadCatalog()) return
      setCatalogSuccess(t('Позиция скрыта из каталога.'))
    } catch (error) {
      console.error('Catalog archive failed', error)
      setCatalogError(t('Не удалось скрыть позицию. Попробуйте ещё раз.'))
    }
  }

  const restorePart = async (part: CatalogItem) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/catalog/manage/${part.id}/`, {
        method: 'PATCH',
        credentials: 'include',
        headers: buildHeaders(true),
        body: JSON.stringify({ is_active: true }),
      })
      if (!response.ok) throw new Error(`Catalog restore failed (${response.status})`)
      if (!await loadCatalog()) return
      setCatalogSuccess(t('Позиция восстановлена в каталоге.'))
    } catch (error) {
      console.error('Catalog restore failed', error)
      setCatalogError(t('Не удалось восстановить позицию. Попробуйте ещё раз.'))
    }
  }

  const enableNotifications = async () => {
    setNotificationError('')
    if (typeof Notification === 'undefined') {
      setNotificationError(t('Браузер не поддерживает уведомления.'))
      return
    }
    try {
      const permission = await Notification.requestPermission()
      setNotificationsEnabled(permission === 'granted')
      if (permission !== 'granted') {
        setNotificationError(t('Разрешите уведомления в настройках браузера.'))
      }
    } catch (error) {
      console.error('Browser notification permission request failed', error)
      setNotificationError(t('Не удалось включить уведомления браузера.'))
    }
  }

  const acknowledgeRequests = () => {
    setNewRequestCount(0)
    setIncomingRequests([])
  }

  if (authLoading) {
    return <div className="admin-shell"><LanguageSelector /><p>{t('Проверка доступа...')}</p></div>
  }

  if (!authenticated) {
    return (
      <div className="admin-shell">
        <header className="admin-header">
          <div className="admin-brand">
            <img className="logo-image" src="/mph-logo.jpg" alt="Machinery Parts Hub" />
            <h1>{t('Панель менеджера')}</h1>
          </div>
          <div className="admin-actions">
            <LanguageSelector />
            <a href={PUBLIC_SITE_URL} className="link-button">{t('На сайт')}</a>
          </div>
        </header>

        <section className="admin-table-wrap">
          <form onSubmit={handleLogin} className="admin-login" noValidate>
            <h2>{t('Вход для менеджера')}</h2>
            <label>
              {t('Имя пользователя')}
              <input
                value={credentials.username}
                onChange={(event) => setCredentials((current) => ({ ...current, username: event.target.value }))}
              />
            </label>
            <label>
              {t('Пароль')}
              <input
                type="password"
                value={credentials.password}
                onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
              />
            </label>
            <button className="btn" type="submit" disabled={loginLoading}>{t('Войти')}</button>
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
          <h1>{t('Панель менеджера')}</h1>
          <p className="muted">{t('Вы вошли как')} {username}</p>
        </div>
        <div className="admin-actions">
          <LanguageSelector />
          <button type="button" className="link-button" onClick={() => void enableNotifications()}>
            {notificationsEnabled ? t('Уведомления включены') : t('Включить уведомления')}
          </button>
          <button type="button" className="link-button" onClick={handleLogout}>{t('Выйти')}</button>
          <a href={PUBLIC_SITE_URL} className="link-button">{t('На сайт')}</a>
        </div>
      </header>

      {notificationError && <p className="err admin-error" role="alert">{notificationError}</p>}
      {newRequestCount > 0 && (
        <div className="incoming-request-banner" role="status">
          <span>
            {newRequestCount === 1
              ? `${t('Новая заявка')}: ${incomingRequests[0]?.name ?? ''} — ${incomingRequests[0]?.part_or_service ?? ''}`
              : `${t('Новых заявок')}: ${newRequestCount}`}
          </span>
          <button type="button" onClick={acknowledgeRequests}>{t('Понятно')}</button>
        </div>
      )}
      {loginError && <p className="err admin-error" role="alert">{loginError}</p>}

      <div className="admin-tabs" role="tablist" aria-label={t('Разделы панели')}>
        <button
          type="button"
          role="tab"
          aria-selected={activeAdminTab === 'requests'}
          onClick={() => {
            setActiveAdminTab('requests')
            acknowledgeRequests()
          }}
        >
          {t('Заявки')}
          {newRequestCount > 0 && <span className="notification-count">{newRequestCount}</span>}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeAdminTab === 'catalog'}
          onClick={() => setActiveAdminTab('catalog')}
        >
          {t('Каталог')}
        </button>
      </div>

      {activeAdminTab === 'requests' ? (
      <section className="admin-table-wrap">
        {requestError && <p className="err" role="alert">{requestError}</p>}
        {!requestsLoaded ? (
          <p>{t('Загрузка заявок...')}</p>
        ) : requests.length === 0 ? (
          <p>{t('Нет заявок.')}</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('Клиент')}</th>
                <th>{t('Телефон')}</th>
                <th>{t('Техника')}</th>
                <th>{t('Запрос')}</th>
                <th>{t('Статус')}</th>
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
                          {t(label)}
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
      ) : (
        <section className="catalog-manager">
          <div>
            <h2>{t(editingPartId ? 'Редактировать позицию' : 'Добавить позицию')}</h2>
            {catalogError && <p className="err" role="alert">{catalogError}</p>}
            {catalogSuccess && <p className="catalog-success" role="status">{catalogSuccess}</p>}
            <form className="catalog-editor" onSubmit={savePart}>
              <label>
                {t('Название')}
                <input required maxLength={200} value={partForm.name} onChange={(event) => setPartForm({ ...partForm, name: event.target.value })} />
              </label>
              <label>
                {t('Категория')}
                <select required value={partForm.category} onChange={(event) => setPartForm({ ...partForm, category: event.target.value })}>
                  <option value="">{t('Выберите категорию')}</option>
                  {catalogCategories.map((category) => <option key={category.id} value={category.id}>{t(category.name)}</option>)}
                </select>
              </label>
              <label>
                {t('Бренд')}
                <input maxLength={120} value={partForm.brand} onChange={(event) => setPartForm({ ...partForm, brand: event.target.value })} />
              </label>
              <label>
                {t('Модель техники')}
                <input maxLength={160} value={partForm.equipment_model} onChange={(event) => setPartForm({ ...partForm, equipment_model: event.target.value })} />
              </label>
              <label className="catalog-description">
                {t('Описание')}
                <textarea rows={3} value={partForm.description} onChange={(event) => setPartForm({ ...partForm, description: event.target.value })} />
              </label>
              <label className="catalog-description">
                {t('Изображение товара (до 5 МБ)')}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setPartImage(event.target.files?.[0] ?? null)}
                />
                <span className="muted">{partImage?.name ?? t('Файл необязателен. Поддерживаются изображения PNG, JPEG и WebP.')}</span>
              </label>
              <div className="catalog-editor-actions">
                <button className="btn" type="submit">{t(editingPartId ? 'Сохранить изменения' : 'Добавить в каталог')}</button>
                {editingPartId !== null && <button className="link-button" type="button" onClick={resetPartForm}>{t('Отмена')}</button>}
              </div>
            </form>
          </div>

          <div className="catalog-inventory">
            <h2>{t('Позиции каталога')} ({parts.length})</h2>
            {!catalogLoaded ? <p>{t('Загрузка каталога...')}</p> : parts.length === 0 ? <p>{t('Каталог пока пуст.')}</p> : (
              <div className="admin-part-list">
                {parts.map((part) => (
                  <article className={`admin-part ${part.is_active ? '' : 'admin-part-archived'}`} key={part.id}>
                    <div>
                      {part.image && <img className="admin-part-image" src={part.image} alt="" loading="lazy" />}
                      <strong>{t(part.name)}</strong>
                      <span>{t(part.category_name)}{part.brand ? ` · ${part.brand}` : ''}{part.equipment_model ? ` · ${part.equipment_model}` : ''}</span>
                      <p>{t(part.description)}</p>
                      {!part.is_active && <small>{t('Скрыта из публичного каталога')}</small>}
                    </div>
                    <div className="admin-part-actions">
                      <button type="button" className="link-button" onClick={() => editPart(part)}>{t('Изменить')}</button>
                      {part.is_active && <button type="button" className="link-button danger-button" onClick={() => void archivePart(part)}>{t('Скрыть')}</button>}
                      {!part.is_active && <button type="button" className="link-button restore-button" onClick={() => void restorePart(part)}>{t('Восстановить')}</button>}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

function App() {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = window.localStorage.getItem('mph-language')
    return stored === 'kk' || stored === 'en' ? stored : 'ru'
  })

  useEffect(() => {
    document.documentElement.lang = localeTag(language)
    window.localStorage.setItem('mph-language', language)
    document.title = language === 'ru'
      ? 'Machinery Parts Hub — запчасти для спецтехники'
      : language === 'kk'
        ? 'Machinery Parts Hub — арнайы техника бөлшектері'
        : 'Machinery Parts Hub — heavy equipment parts'

    const description = language === 'ru'
      ? 'Machinery Parts Hub (MPH Group) — оригинальные и аналоговые запчасти для экскаваторов, бульдозеров, погрузчиков и другой спецтехники.'
      : language === 'kk'
        ? 'Machinery Parts Hub (MPH Group) — экскаваторларға, бульдозерлерге, тиегіштерге және басқа арнайы техникаға арналған қосалқы бөлшектер.'
        : 'Machinery Parts Hub (MPH Group) supplies genuine and alternative parts for excavators, bulldozers, loaders, and other heavy equipment.'
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', document.title)
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description)
    document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', document.title)
    document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', description)
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
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
    </LanguageContext.Provider>
  )
}

export default App
