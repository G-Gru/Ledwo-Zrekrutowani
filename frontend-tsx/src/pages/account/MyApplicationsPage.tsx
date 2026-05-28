import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import { api, type Enrollment } from '@/services/api'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { FileText, ChevronRight, AlertTriangle, CheckCircle2 } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  CANDIDATE: 'Kandydat', DRAFT: 'Wniosek niewysłany', RESERVE: 'Kandydat rezerwowy',
  STUDENT: 'Student', REJECTED: 'Odrzucony', EXPELLED: 'Wydalony',
}

function statusBadge(status: string) {
  const s = status?.toUpperCase()
  if (s === 'STUDENT') return <Badge variant="success">{STATUS_LABELS[s] ?? s}</Badge>
  if (s === 'CANDIDATE') return <Badge variant="primary">{STATUS_LABELS[s] ?? s}</Badge>
  if (s === 'DRAFT') return <Badge variant="default">{STATUS_LABELS[s] ?? s}</Badge>
  if (s === 'REJECTED' || s === 'EXPELLED') return <Badge variant="danger">{STATUS_LABELS[s] ?? s}</Badge>
  if (s === 'RESERVE') return <Badge variant="warning">{STATUS_LABELS[s] ?? s}</Badge>
  return <Badge>{s}</Badge>
}

function editionName(e: Enrollment) {
  if (typeof e.studies_edition === 'object') return e.studies_edition?.name || 'Nieznany kierunek'
  return 'Kierunek #' + e.studies_edition
}

function editionId(e: Enrollment) {
  if (typeof e.studies_edition === 'object') return e.studies_edition?.id
  return e.studies_edition
}

export default function MyApplicationsPage() {
  usePageTitle('Moje Aplikacje')
  const navigate = useNavigate()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [resigning, setResigning] = useState<number | null>(null)

  const load = () => {
    api.getMyEnrollments().then((res) => {
      if (!res.error) setEnrollments(Array.isArray(res.data) ? res.data : [])
      else setError(res.msg)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  const resign = async (e: Enrollment) => {
    const name = editionName(e)
    if (!window.confirm(`Czy na pewno chcesz zrezygnować z rekrutacji dla: ${name}?\n\nTej operacji nie da się cofnąć.`)) return
    setResigning(e.id)
    const res = await api.resignEnrollment(e.id)
    setResigning(null)
    if (res.error) setError(res.msg)
    else load()
  }

  const drafts = enrollments.filter((e) => e.status?.toUpperCase() === 'DRAFT')
  const active = enrollments.filter((e) => e.status?.toUpperCase() !== 'DRAFT')

  if (loading) return <p className="text-text-muted">Ładowanie...</p>

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">Moje wnioski</h1>
        <p className="text-sm text-text-muted">Zarządzaj procesami rekrutacyjnymi i monitoruj statusy dokumentów.</p>
      </div>

      {error && <Alert variant="error" onClose={() => setError('')}>{error}</Alert>}

      {/* Niewysłane */}
      {drafts.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Niewysłane</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0">
            {drafts.map((e) => (
              <EnrollmentCard key={e.id} enrollment={e} isDraft onResign={() => resign(e)}
                isResigning={resigning === e.id}
                onContinue={() => navigate(`/applicationForm?edition_id=${editionId(e)}`)} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Aktywne */}
      <Card>
        <CardHeader><CardTitle>Aktywne wnioski</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-3 pt-0">
          {active.length === 0 ? (
            <p className="text-sm text-text-muted py-2">Nie masz żadnych aktywnych wniosków.</p>
          ) : active.map((e) => (
            <EnrollmentCard key={e.id} enrollment={e} onResign={() => resign(e)}
              isResigning={resigning === e.id}
              onGoToDocuments={() => navigate(`/my-documents?enrollment_id=${e.id}`)}
              onGoToPayments={() => navigate('/my-payments')} />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

interface CardProps {
  enrollment: Enrollment
  isDraft?: boolean
  isResigning: boolean
  onResign: () => void
  onContinue?: () => void
  onGoToDocuments?: () => void
  onGoToPayments?: () => void
}

function EnrollmentCard({ enrollment: e, isDraft, isResigning, onResign, onContinue, onGoToDocuments, onGoToPayments }: CardProps) {
  return (
    <div className="rounded-lg border border-surface-high p-4 flex flex-col gap-3 bg-surface">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-surface-container">
            <FileText size={18} className="text-secondary" />
          </div>
          <div>
            <p className="font-semibold text-sm">Wniosek rekrutacyjny</p>
            <p className="text-xs text-text-muted">{editionName(e)}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {isDraft
            ? <Badge variant="default">Wniosek niewypełniony</Badge>
            : statusBadge(e.status)}
          {!isDraft && !e.is_fully_paid && (
            <Badge variant="warning" className="flex items-center gap-1">
              <AlertTriangle size={11} /> Wymaga płatności
            </Badge>
          )}
          {!isDraft && e.has_missing_docs && (
            <Badge variant="danger" className="flex items-center gap-1">
              <AlertTriangle size={11} /> Brak dokumentów
            </Badge>
          )}
          {!isDraft && e.is_fully_paid && !e.has_missing_docs && (
            <Badge variant="success" className="flex items-center gap-1">
              <CheckCircle2 size={11} /> Kompletny
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2 flex-wrap">
          {isDraft && onContinue && (
            <Button size="sm" onClick={onContinue} className="flex items-center gap-1">
              Kontynuuj wypełnianie <ChevronRight size={14} />
            </Button>
          )}
          {!isDraft && onGoToPayments && !e.is_fully_paid && (
            <Button size="sm" variant="secondary" onClick={onGoToPayments}>Przejdź do płatności</Button>
          )}
          {!isDraft && onGoToDocuments && (
            <Button size="sm" variant="secondary" onClick={onGoToDocuments}>Dokumenty wniosku</Button>
          )}
        </div>
        <Button size="sm" variant="danger" disabled={isResigning} onClick={onResign}>
          {isResigning ? 'Rezygnacja...' : 'Rezygnuj'}
        </Button>
      </div>
    </div>
  )
}
