import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, type DocItem, type Enrollment } from '@/services/api'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Download, CheckCircle2, AlertTriangle, Clock } from 'lucide-react'

function fmt(d?: string | null) {
  if (!d) return '-'
  try { return new Date(d).toLocaleDateString('pl-PL') } catch { return d }
}

const STATUS_MAP: Record<string, { label: string; variant: 'success' | 'danger' | 'warning' | 'info' | 'default' }> = {
  'ACCEPTED':       { label: 'Zaakceptowany',                variant: 'success' },
  'VERIFIED':       { label: 'Zweryfikowany',                variant: 'success' },
  'SUBMITTED':      { label: 'Załączony przez Ciebie',       variant: 'info' },
  'REJECTED':       { label: 'Odrzucony',                    variant: 'danger' },
  'SIGN & DELIVER': { label: 'Wymaga dostarczenia',          variant: 'warning' },
  'MISSING':        { label: 'Brak dokumentu',               variant: 'danger' },
}

function docStatusIcon(status: string) {
  const s = status?.toUpperCase()
  if (s === 'ACCEPTED' || s === 'VERIFIED') return <CheckCircle2 size={18} className="text-success" />
  if (s === 'REJECTED' || s === 'MISSING' || s === 'SIGN & DELIVER') return <AlertTriangle size={18} className="text-error" />
  return <Clock size={18} className="text-warning" />
}

export default function MyDocumentsPage() {
  const [searchParams] = useSearchParams()
  const enrollmentIdFromUrl = searchParams.get('enrollment_id')

  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string>(enrollmentIdFromUrl || '')
  const [docs, setDocs] = useState<DocItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getMyEnrollments().then((res) => {
      if (!res.error && Array.isArray(res.data)) {
        const active = res.data.filter((e) => e.status?.toUpperCase() !== 'DRAFT')
        setEnrollments(active)
        if (!selectedEnrollmentId && active.length > 0) setSelectedEnrollmentId(String(active[0].id))
      }
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!selectedEnrollmentId) return
    setLoading(true)
    api.getEnrollmentDocuments(Number(selectedEnrollmentId)).then((res) => {
      if (!res.error && Array.isArray(res.data)) setDocs(res.data)
      else setError(res.error ? res.msg : '')
      setLoading(false)
    })
  }, [selectedEnrollmentId])

  const enrollmentName = (e: Enrollment) => typeof e.studies_edition === 'object' ? e.studies_edition?.name : `Wniosek #${e.id}`
  const enrollmentOptions = enrollments.map((e) => ({ value: String(e.id), label: enrollmentName(e) }))

  const handleDownload = async (fileId: number) => {
    const res = await api.downloadFile(fileId)
    if (res.error) { setError(res.msg); return }
    const blob = await (res.data as Response).blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `dokument_${fileId}`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">Dokumenty</h1>
        <p className="text-sm text-text-muted">Lista dokumentów wymaganych dla Twojego wniosku.</p>
      </div>

      {error && <Alert variant="error" className="mb-2">{error}</Alert>}

      {enrollments.length > 1 && (
        <Select
          label="Wniosek"
          options={enrollmentOptions}
          value={selectedEnrollmentId}
          onChange={(e) => setSelectedEnrollmentId(e.target.value)}
        />
      )}

      {loading ? <p className="text-text-muted">Ładowanie...</p> : (
        <Card>
          <CardHeader><CardTitle>Lista dokumentów</CardTitle></CardHeader>
          <CardContent className="p-0">
            {docs.length === 0 ? (
              <p className="p-5 text-sm text-text-muted">Brak dokumentów dla wybranego wniosku.</p>
            ) : (
              <div className="flex flex-col divide-y divide-surface-high">
                {docs.map((doc, i) => {
                  const status = doc.status?.toUpperCase()
                  const statusInfo = STATUS_MAP[status] ?? { label: status, variant: 'default' as const }
                  const needsAction = !['ACCEPTED', 'VERIFIED', 'SUBMITTED'].includes(status)
                  return (
                    <div key={doc.id ?? i} className="flex items-center justify-between px-5 py-4 gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${needsAction ? 'bg-red-50' : 'bg-green-50'}`}>
                          {docStatusIcon(status)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{doc.studies_document?.name || doc.title || `Dokument #${doc.id}`}</p>
                          <div className="flex gap-2 flex-wrap mt-0.5">
                            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                            {doc.studies_document?.due_date && needsAction && (
                              <span className="text-xs text-error">Termin: {fmt(doc.studies_document.due_date)}</span>
                            )}
                            {doc.submitted_date && !needsAction && (
                              <span className="text-xs text-text-muted">Złożono: {fmt(doc.submitted_date)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {doc.file ? (
                        <Button size="sm" variant="secondary" onClick={() => handleDownload(doc.file as number)}
                          className="flex items-center gap-1">
                          <Download size={14} /> Pobierz
                        </Button>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
