import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, type StudiesEdition, type StaffMember } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { CalendarDays, Users, BadgeDollarSign, BookOpen, GraduationCap } from 'lucide-react'

const ROLE_LABELS: Record<string, string> = {
  STUDIES_DIRECTOR: 'Kierownik studiów',
  ADMINISTRATIVE_COORDINATOR: 'Koordynator administracyjny',
  FINANCE_COORDINATOR: 'Koordynator finansowy',
}

function formatDate(d?: string | null) {
  if (!d) return '-'
  try { return new Date(d).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' }) }
  catch { return d }
}

function statusBadge(status: string) {
  const s = status?.toLowerCase()
  if (s === 'active') return <Badge variant="success">Otwarta rekrutacja</Badge>
  if (s === 'closed') return <Badge variant="danger">Rekrutacja zamknięta</Badge>
  return <Badge>{status || '-'}</Badge>
}

export default function StudiesDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [edition, setEdition] = useState<StudiesEdition | null>(null)
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [canApply, setCanApply] = useState(true)
  const [hasDraft, setHasDraft] = useState(false)
  const [blockingStatus, setBlockingStatus] = useState('')

  useEffect(() => {
    if (!id) return
    Promise.all([api.getEdition(id), api.getEditionStaff(id)]).then(([edRes, stRes]) => {
      if (!edRes.error) setEdition(edRes.data)
      if (!stRes.error && Array.isArray(stRes.data)) setStaff(stRes.data)
      setLoading(false)
    })
  }, [id])

  useEffect(() => {
    if (!user || !id) return
    api.getMyEnrollments().then((res) => {
      if (res.error || !Array.isArray(res.data)) return
      const match = res.data.find((e) => {
        const eid = typeof e.studies_edition === 'object' ? e.studies_edition?.id : e.studies_edition
        return String(eid) === String(id)
      })
      const status = match?.status?.toUpperCase() || ''
      if (!status || status === 'DRAFT') {
        setHasDraft(status === 'DRAFT')
        setCanApply(true)
      } else {
        setCanApply(false)
        setBlockingStatus(status)
      }
    })
  }, [id, user])

  if (loading) return <div className="p-10 text-center text-[var(--color-text-muted)]">Ładowanie...</div>
  if (!edition) return <div className="p-10 text-center text-[var(--color-text-muted)]">Edycja nie znaleziona.</div>

  const isStaff = ['ADMIN', 'STUDIES_DIRECTOR', 'ADMINISTRATIVE_COORDINATOR', 'FINANCE_COORDINATOR'].includes(user?.role ?? '')
  const recruitmentOpen = edition.status?.toLowerCase() === 'active'

  const infoCards = [
    { icon: BadgeDollarSign, label: 'Cena', value: edition.price ? `${edition.price} PLN` : '-' },
    { icon: BookOpen, label: 'Semestrów', value: edition.terms_count ?? '-' },
    { icon: Users, label: 'Limit uczestników', value: edition.max_participants ?? '-' },
    { icon: GraduationCap, label: 'Status', value: statusBadge(edition.status) },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold">{edition.name}</h1>
        {statusBadge(edition.status)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main content */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card>
            <CardHeader><CardTitle>Program kształcenia</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-[var(--color-text-muted)] leading-relaxed">
                {edition.description || 'Brak opisu programu.'}
              </p>
              {edition.syllabus_url && (
                <a href={edition.syllabus_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" size="sm">Zobacz sylabus</Button>
                </a>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays size={16} />Rekrutacja</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                <div><p className="text-[0.65rem] uppercase tracking-wide text-[var(--color-text-muted)] font-semibold">Rozpoczęcie</p>
                  <p className="font-bold text-base">{formatDate(edition.recruitment_start_date)}</p></div>
                <div className="border-t border-[var(--color-surface-high)]" />
                <div><p className="text-[0.65rem] uppercase tracking-wide text-[var(--color-text-muted)] font-semibold">Zakończenie</p>
                  <p className="font-bold text-base">{formatDate(edition.recruitment_end_date)}</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays size={16} />Terminy studiów</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                <div><p className="text-[0.65rem] uppercase tracking-wide text-[var(--color-text-muted)] font-semibold">Rozpoczęcie</p>
                  <p className="font-bold text-base">{formatDate(edition.start_date)}</p></div>
                <div className="border-t border-[var(--color-surface-high)]" />
                <div><p className="text-[0.65rem] uppercase tracking-wide text-[var(--color-text-muted)] font-semibold">Zakończenie</p>
                  <p className="font-bold text-base">{formatDate(edition.end_date)}</p></div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Side info */}
        <div className="flex flex-col gap-3">
          {infoCards.map(({ icon: Icon, label, value }) => (
            <Card key={label}>
              <CardContent className="py-3 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--color-surface-container)]">
                  <Icon size={16} className="text-[var(--color-secondary)]" />
                </div>
                <div className="text-left">
                  <p className="text-[0.65rem] uppercase tracking-wide text-[var(--color-text-muted)] font-semibold">{label}</p>
                  <div className="font-bold text-sm">{value}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Staff table */}
      {staff.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Zespół edycji</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rola</TableHead>
                  <TableHead>Imię i nazwisko</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Telefon</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{ROLE_LABELS[m.role] || m.role}</TableCell>
                    <TableCell>{[m.user?.first_name, m.user?.last_name].filter(Boolean).join(' ') || '-'}</TableCell>
                    <TableCell>{m.user?.email || '-'}</TableCell>
                    <TableCell>{m.user?.work_phones?.map((w) => w.phone).join(', ') || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Apply button — hidden for staff */}
      {!isStaff && (
        <div className="flex justify-center py-2">
          {!recruitmentOpen ? (
            <p className="text-[var(--color-text-muted)] border border-[var(--color-surface-high)] rounded-lg px-5 py-3 text-sm">
              Kierunek nie prowadzi obecnie rekrutacji.
            </p>
          ) : !canApply ? (
            <p className="text-[var(--color-text-muted)] border border-[var(--color-surface-high)] rounded-lg px-5 py-3 text-sm">
              Masz już złożony wniosek dla tej edycji.{blockingStatus ? ` Status: ${blockingStatus}.` : ''}
            </p>
          ) : (
            <Button
              size="lg"
              onClick={() => {
                const target = `/applicationForm?edition_id=${edition.id}`
                if (!user) navigate(`/login?redirect=${encodeURIComponent(target)}`)
                else navigate(target)
              }}
            >
              {hasDraft ? 'Kontynuuj wypełnianie wniosku' : 'Rekrutuj się'}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
