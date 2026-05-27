import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, type StudiesEdition } from '@/services/api'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { BookOpen, GraduationCap, Calendar, Wallet, ChevronRight, MapPin } from 'lucide-react'

const CARD_IMAGES = [
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&q=80',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&q=80',
  'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=600&q=80',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80',
  'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=600&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80',
  'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=600&q=80',
]

function statusBadge(status: string) {
  const s = status?.toLowerCase()
  if (s === 'active') return <Badge variant="success">Otwarta rekrutacja</Badge>
  if (s === 'closed') return <Badge variant="default">Rekrutacja zamknięta</Badge>
  return <Badge>{status || '-'}</Badge>
}

type Filter = 'all' | 'active' | 'closed'

export default function StudiesPage() {
  const navigate = useNavigate()
  const [editions, setEditions] = useState<StudiesEdition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    api.getEditions().then((res) => {
      if (!res.error && Array.isArray(res.data) && res.data.length > 0) {
        setEditions(res.data)
      } else {
        setError('Nie udało się pobrać ofert studiów.')
      }
      setLoading(false)
    })
  }, [])

  const filtered = editions.filter((ed) => {
    if (filter === 'active') return ed.status?.toLowerCase() === 'active'
    if (filter === 'closed') return ed.status?.toLowerCase() === 'closed'
    return true
  })

  const activeCount = editions.filter((ed) => ed.status?.toLowerCase() === 'active').length

  function plKierunek(n: number) {
    if (n === 1) return 'kierunek'
    if (n % 100 >= 12 && n % 100 <= 14) return 'kierunków'
    if (n % 10 >= 2 && n % 10 <= 4) return 'kierunki'
    return 'kierunków'
  }

  function plRekrutacja(n: number) {
    if (n === 1) return 'otwarta rekrutacja'
    if (n % 100 >= 12 && n % 100 <= 14) return 'otwartych rekrutacji'
    if (n % 10 >= 2 && n % 10 <= 4) return 'otwarte rekrutacje'
    return 'otwartych rekrutacji'
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-white flex flex-col">

      {/* ── Page header ── */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="bg-[#ffd600] rounded-lg p-2 shrink-0">
              <GraduationCap size={22} className="text-[#4c545c]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Oferty studiów</h1>
              <p className="text-sm text-gray-500">Wydział Informatyki, AGH Kraków</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">
              {editions.length} {plKierunek(editions.length)}
            </span>
            {activeCount > 0 && (
              <span className="bg-[#ffd600]/30 text-[#705d00] text-sm px-3 py-1 rounded-full font-medium">
                {activeCount} {plRekrutacja(activeCount)}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-gray-400 text-sm">
              <MapPin size={13} />
              Kraków
            </span>
          </div>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-[#f6f3f2] border-b border-gray-200 sticky top-[56px] z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-3">
          <span className="text-sm text-gray-500 font-medium mr-1">Filtruj:</span>
          {(['all', 'active', 'closed'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 cursor-pointer ${
                filter === f
                  ? 'bg-[#4c545c] text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {f === 'all' ? 'Wszystkie' : f === 'active' ? 'Otwarta rekrutacja' : 'Zamknięte'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Cards ── */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
        {error && <Alert variant="warning" className="mb-6 max-w-lg mx-auto">{error}</Alert>}

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-24 text-gray-400">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-[#4c545c] rounded-full animate-spin" />
            <p>Ładowanie ofert...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <GraduationCap size={52} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Brak ofert spełniających kryteria</p>
            <p className="text-sm mt-1">Spróbuj zmienić filtr</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((ed, i) => (
              <div
                key={ed.id}
                onClick={() => navigate(`/studies/editions/${ed.id}`)}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-xl hover:-translate-y-1.5 transition-all duration-200 flex flex-col"
              >
                <div
                  className="h-40 bg-cover bg-center relative"
                  style={{ backgroundImage: `url('${CARD_IMAGES[i % CARD_IMAGES.length]}')` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    {statusBadge(ed.status)}
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1 gap-3">
                  <h3 className="font-bold text-gray-900 text-base leading-snug group-hover:text-[#705d00] transition-colors">
                    {ed.name}
                  </h3>

                  <div className="flex flex-col gap-1.5 text-sm text-gray-500 mt-auto">
                    <div className="flex items-center gap-2">
                      <Wallet size={13} className="text-gray-400 shrink-0" />
                      <span>{ed.price ? `${Number(ed.price).toLocaleString('pl-PL')} PLN` : '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="text-gray-400 shrink-0" />
                      <span>Start: {ed.start_date || '-'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm font-semibold text-[#705d00] pt-1 border-t border-gray-100">
                    <BookOpen size={14} />
                    <span>Zobacz szczegóły</span>
                    <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="bg-[#4c545c] text-white mt-10">
        <div className="h-1 bg-[#ffd600]" />
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="bg-[#ffd600] rounded-lg p-1.5">
                <GraduationCap size={18} className="text-[#4c545c]" />
              </div>
              <span className="font-bold text-lg text-white">Wydział Informatyki AGH</span>
            </div>
          </div>
          <div>
            <div className="font-semibold mb-3 text-white text-base">Adres korespondencyjny:</div>
            <div className="text-gray-300 text-sm space-y-1.5">
              <div>Wydział Informatyki</div>
              <div>Akademia Górniczo-Hutnicza im. Stanisława Staszica</div>
              <div>al. Mickiewicza 30</div>
              <div>30-059 Kraków</div>
            </div>
          </div>
          <div>
            <div className="font-semibold mb-3 text-white text-base">Adres siedziby:</div>
            <div className="text-gray-300 text-sm space-y-1.5">
              <div>ul. Kawiory 21</div>
              <div>30-055 Kraków</div>
              <div>tel: +48 12 328-34-00</div>
              <div>fax: +48 12 617-51-72</div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-500">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between text-gray-400 text-xs">
            <span>© {new Date().getFullYear()} Akademia Górniczo-Hutnicza. Wszelkie prawa zastrzeżone.</span>
            <span>Kraków, Polska</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
