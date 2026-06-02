import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import { api, type AdminEnrollment, type AdminEnrollmentDetail } from '@/services/api'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { ChevronRight, Download, CheckCircle2, XCircle, User, FileText, CreditCard, ClipboardCheck } from 'lucide-react'

type Tab = 'personal' | 'application' | 'documents' | 'payments'

const STATUS_LABELS: Record<string, string> = {
  CANDIDATE: 'Kandydat', DRAFT: 'Wniosek niewysłany', RESERVE: 'Rezerwowy',
  STUDENT: 'Student', REJECTED: 'Odrzucony', EXPELLED: 'Wydalony',
}

function statusBadge(status: string) {
  const s = status?.toUpperCase()
  if (s === 'STUDENT') return <Badge variant="success">{STATUS_LABELS[s] ?? s}</Badge>
  if (s === 'CANDIDATE') return <Badge variant="primary">{STATUS_LABELS[s] ?? s}</Badge>
  if (s === 'REJECTED' || s === 'EXPELLED') return <Badge variant="danger">{STATUS_LABELS[s] ?? s}</Badge>
  if (s === 'RESERVE') return <Badge variant="warning">{STATUS_LABELS[s] ?? s}</Badge>
  return <Badge>{STATUS_LABELS[s] ?? s}</Badge>
}

function fmt(d?: string | null) {
  if (!d) return '-'
  try { return new Date(d).toLocaleDateString('pl-PL') } catch { return d }
}

function Field({ label, value }: { label: string; value?: string | null | number }) {
  return (
    <div>
      <p className="text-[0.65rem] uppercase tracking-wide text-text-muted font-semibold">{label}</p>
      <p className="text-sm">{value || '-'}</p>
    </div>
  )
}

export default function AdminCandidatesPage() {
  usePageTitle('Kandydaci')
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()

  const [enrollments, setEnrollments] = useState<AdminEnrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterEdition, setFilterEdition] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterMissingDocs, setFilterMissingDocs] = useState(false)
  const [filterUnpaid, setFilterUnpaid] = useState(false)

  const [selectedId, setSelectedId] = useState<number | null>(id ? Number(id) : null)
  const [detail, setDetail] = useState<AdminEnrollmentDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('personal')

  const [decisionNote, setDecisionNote] = useState('')
  const [decisionModal, setDecisionModal] = useState<'accept' | 'reject' | null>(null)
  const [noteText, setNoteText] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)
  const [noteMsg, setNoteMsg] = useState('')
  const [docModal, setDocModal] = useState<{ id: number; action: 'accept' | 'reject' } | null>(null)
  const [docNote, setDocNote] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMsg, setActionMsg] = useState('')

  useEffect(() => {
    api.getAdminEnrollments().then((res) => {
      if (!res.error) {
        const data = res.data
        const list = Array.isArray(data) ? data : (data as { results: AdminEnrollment[] }).results ?? []
        setEnrollments(list)
      } else setError('Nie udało się pobrać listy kandydatów.')
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!selectedId) { setDetail(null); return }
    navigate(`/admin/candidates/${selectedId}`, { replace: true })
    setDetailLoading(true)
    setDetail(null)
    setNoteMsg('')
    api.getAdminEnrollmentDetail(selectedId).then((res) => {
      if (!res.error) { setDetail(res.data); setNoteText(res.data.status_note ?? '') }
      else setError('Nie udało się pobrać szczegółów.')
      setDetailLoading(false)
    })
  }, [navigate, selectedId])

  const editions = useMemo(
    () => [...new Set(enrollments.map((e) => e.studies_name).filter(Boolean))].sort() as string[],
    [enrollments],
  )

  const filtered = useMemo(() => {
    return enrollments.filter((e) => {
      const q = search.trim().toLowerCase()
      if (q && !(e.student_name?.toLowerCase().includes(q) || e.studies_name?.toLowerCase().includes(q) || e.edition_name?.toLowerCase().includes(q))) return false
      if (filterEdition && e.studies_name !== filterEdition) return false
      if (filterStatus && e.status?.toUpperCase() !== filterStatus) return false
      if (filterMissingDocs && !e.missing_documents) return false
      if (filterUnpaid && e.is_fully_paid) return false
      return true
    })
  }, [enrollments, search, filterEdition, filterStatus, filterMissingDocs, filterUnpaid])

  const doDecision = async () => {
    if (!selectedId || !decisionModal) return
    setActionLoading(true); setActionMsg('')
    const res = decisionModal === 'accept'
      ? await api.acceptEnrollment(selectedId, decisionNote)
      : await api.rejectEnrollment(selectedId, decisionNote)
    if (!res.error) {
      setDecisionModal(null); setDecisionNote('')
      setEnrollments((prev) => prev.map((e) => e.id === selectedId
        ? { ...e, status: decisionModal === 'accept' ? 'STUDENT' : 'REJECTED' } : e))
      const fresh = await api.getAdminEnrollmentDetail(selectedId)
      if (!fresh.error) setDetail(fresh.data)
    } else setActionMsg(res.msg)
    setActionLoading(false)
  }

  const doSaveNote = async () => {
    if (!selectedId) return
    setNoteSaving(true); setNoteMsg('')
    const res = await api.saveEnrollmentNote(selectedId, noteText)
    if (!res.error) {
      setDetail((prev) => prev ? { ...prev, status_note: res.data.status_note } : prev)
      setNoteMsg('Notatka zapisana.')
    } else setNoteMsg('Błąd zapisu notatki.')
    setNoteSaving(false)
  }

  const doDocAction = async () => {
    if (!docModal || !selectedId) return
    setActionLoading(true); setActionMsg('')
    const res = docModal.action === 'accept'
      ? await api.acceptDocument(selectedId, docModal.id, docNote)
      : await api.rejectDocument(selectedId, docModal.id, docNote)
    if (!res.error) {
      setDocModal(null); setDocNote('')
      const fresh = await api.getAdminEnrollmentDetail(selectedId)
      if (!fresh.error) setDetail(fresh.data)
    } else setActionMsg(res.msg)
    setActionLoading(false)
  }

  const handleDownload = async (fileId: number) => {
    const res = await api.downloadFile(fileId)
    if (res.error) return
    const blob = await (res.data as Response).blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `plik_${fileId}`; a.click()
    URL.revokeObjectURL(url)
  }

  const TABS = [
    { key: 'personal' as Tab, label: 'Dane osobowe', icon: User },
    { key: 'application' as Tab, label: 'Wniosek', icon: ClipboardCheck },
    { key: 'documents' as Tab, label: 'Dokumenty', icon: FileText },
    { key: 'payments' as Tab, label: 'Płatności', icon: CreditCard },
  ]

  return (
    <div className="flex gap-4 h-full">
      {/* Left: list */}
      <div className="w-80 shrink-0 flex flex-col gap-2">
        <h1 className="text-xl font-bold">Kandydaci</h1>

        {/* Search */}
        <Input
          placeholder="Szukaj po nazwisku lub kierunku..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Filters */}
        <div className="flex flex-col gap-1.5">
          <select
            value={filterEdition}
            onChange={(e) => setFilterEdition(e.target.value)}
            className="w-full rounded-md border border-surface-high bg-surface-low px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Wszystkie kierunki</option>
            {editions.map((ed) => <option key={ed} value={ed}>{ed}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full rounded-md border border-surface-high bg-surface-low px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Wszystkie statusy</option>
            <option value="CANDIDATE">Kandydat</option>
            <option value="STUDENT">Student</option>
            <option value="RESERVE">Rezerwowy</option>
            <option value="REJECTED">Odrzucony</option>
            <option value="EXPELLED">Skreślony</option>
            <option value="DRAFT">Wniosek niewysłany</option>
          </select>
          <div className="flex gap-3 px-0.5">
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="checkbox" checked={filterMissingDocs} onChange={(e) => setFilterMissingDocs(e.target.checked)} />
              Braki dok.
            </label>
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="checkbox" checked={filterUnpaid} onChange={(e) => setFilterUnpaid(e.target.checked)} />
              Nieopłacone
            </label>
          </div>
          {(search || filterEdition || filterStatus || filterMissingDocs || filterUnpaid) && (
            <button
              onClick={() => { setSearch(''); setFilterEdition(''); setFilterStatus(''); setFilterMissingDocs(false); setFilterUnpaid(false) }}
              className="text-xs text-text-muted hover:text-text text-left px-0.5 cursor-pointer"
            >
              × Wyczyść filtry ({filtered.length} wyników)
            </button>
          )}
        </div>

        {error && <Alert variant="error" className="text-xs">{error}</Alert>}

        {loading ? <p className="text-sm text-text-muted">Ładowanie...</p> : (
          <div className="flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-265px)]">
            {filtered.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-4">Brak wyników</p>
            ) : filtered.map((e) => (
              <button
                key={e.id}
                onClick={() => { setSelectedId(e.id); setActiveTab('personal') }}
                className={[
                  'text-left px-3 py-2.5 rounded-lg transition-colors text-sm cursor-pointer border',
                  selectedId === e.id
                    ? 'bg-primary-container border-primary text-primary'
                    : 'bg-white border-surface-high hover:bg-surface-container'
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium truncate">{e.student_name}</span>
                  <ChevronRight size={14} className="shrink-0" />
                </div>
                <p className="text-xs text-text-muted truncate mt-0.5">{e.studies_name}</p>
                <div className="mt-1">{statusBadge(e.status)}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: detail */}
      <div className="flex-1 min-w-0">
        {!selectedId ? (
          <div className="flex items-center justify-center h-64 text-text-muted text-sm">
            Wybierz kandydata z listy
          </div>
        ) : detailLoading ? (
          <p className="text-text-muted">Ładowanie szczegółów...</p>
        ) : detail ? (
          <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-bold">{detail.student_name}</h2>
                <p className="text-sm text-text-muted">{detail.studies_name} — {detail.edition_name}</p>
              </div>
              <div className="flex items-center gap-2">
                {statusBadge(detail.status)}
                {!detail.is_fully_paid && <Badge variant="warning">Nieopłacone</Badge>}
                {detail.missing_documents && <Badge variant="danger">Braki dokumentów</Badge>}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-surface-high">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => setActiveTab(key)}
                  className={[
                    'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px',
                    activeTab === key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-text-muted hover:text-text'
                  ].join(' ')}>
                  <Icon size={14} />{label}
                </button>
              ))}
            </div>

            {actionMsg && <Alert variant="error" className="text-xs">{actionMsg}</Alert>}

            {/* Tab content */}
            {activeTab === 'personal' && (
              <Card>
                <CardHeader><CardTitle>Dane osobowe i kontaktowe</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <Field label="Imię" value={detail.form_data?.first_name} />
                  <Field label="Drugie imię" value={detail.form_data?.second_name} />
                  <Field label="Nazwisko" value={detail.form_data?.last_name} />
                  <Field label="Nazwisko rodowe" value={detail.form_data?.family_name} />
                  <Field label="Tytuł" value={detail.form_data?.academic_title} />
                  <Field label="PESEL" value={detail.form_data?.pesel} />
                  <Field label="Data urodzenia" value={fmt(detail.form_data?.birth_date)} />
                  <Field label="Miejsce urodzenia" value={detail.form_data?.birth_place} />
                  <Field label="Obywatelstwo" value={detail.form_data?.citizenship} />
                  <Field label="Email" value={detail.form_data?.email} />
                  <Field label="Telefon" value={detail.form_data?.phone} />
                </CardContent>
              </Card>
            )}

            {activeTab === 'application' && (
              <div className="flex flex-col gap-4">
                <Card>
                  <CardHeader><CardTitle>Status wniosku</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <Field label="Status" value={STATUS_LABELS[detail.status?.toUpperCase()] ?? detail.status} />
                    <Field label="Data zapisu" value={fmt(detail.enrollment_date)} />
                    {detail.status_note && <Field label="Notatka" value={detail.status_note} />}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Wymagania do przyjęcia</CardTitle></CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      {detail.is_fully_paid
                        ? <CheckCircle2 size={16} className="text-success shrink-0" />
                        : <XCircle size={16} className="text-error shrink-0" />}
                      <span>Opłaty — {detail.is_fully_paid ? 'wszystkie opłacone' : 'brakujące płatności'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {!detail.missing_documents
                        ? <CheckCircle2 size={16} className="text-success shrink-0" />
                        : <XCircle size={16} className="text-error shrink-0" />}
                      <span>Dokumenty — {!detail.missing_documents ? 'wszystkie dostarczone i zaakceptowane' : 'brakujące lub odrzucone dokumenty'}</span>
                    </div>
                  </CardContent>
                </Card>

                {(detail.form_data?.education_university || detail.form_data?.education_year || detail.form_data?.education_location) && (
                  <Card>
                    <CardHeader><CardTitle>Wykształcenie</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <Field label="Uczelnia" value={detail.form_data?.education_university} />
                      <Field label="Rok ukończenia" value={detail.form_data?.education_year} />
                      <Field label="Miejscowość" value={detail.form_data?.education_location} />
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader><CardTitle>Notatka administratora</CardTitle></CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      rows={3}
                      maxLength={200}
                      placeholder="Wpisz notatkę wewnętrzną (max 200 znaków)..."
                      className="w-full rounded-lg border border-surface-high bg-surface-low px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <div className="flex items-center gap-3">
                      <Button size="sm" onClick={doSaveNote} disabled={noteSaving}>
                        {noteSaving ? 'Zapisywanie...' : 'Zapisz notatkę'}
                      </Button>
                      {noteMsg && (
                        <span className={`text-xs ${noteMsg.startsWith('Błąd') ? 'text-error' : 'text-success'}`}>
                          {noteMsg}
                        </span>
                      )}
                      <span className="ml-auto text-xs text-text-muted">{noteText.length}/200</span>
                    </div>
                  </CardContent>
                </Card>

                {!['STUDENT', 'REJECTED', 'EXPELLED'].includes(detail.status?.toUpperCase()) && (
                  <div className="flex gap-3">
                    <Button variant="danger" onClick={() => { setDecisionNote(''); setDecisionModal('reject') }}>
                      <XCircle size={15} /> Odrzuć wniosek
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'documents' && (
              <Card>
                <CardHeader><CardTitle>Dokumenty</CardTitle></CardHeader>
                <CardContent className="p-0">
                  {!detail.documents || detail.documents.length === 0 ? (
                    <p className="p-5 text-sm text-text-muted">Brak dokumentów.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Dokument</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Termin</TableHead>
                          <TableHead>Akcje</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.documents.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell className="font-medium text-sm">{doc.studies_document?.name || doc.title || `Dok. #${doc.id}`}</TableCell>
                            <TableCell>
                              {doc.status === 'ACCEPTED' || doc.status === 'VERIFIED'
                                ? <Badge variant="success">{doc.status}</Badge>
                                : doc.status === 'REJECTED'
                                ? <Badge variant="danger">{doc.status}</Badge>
                                : <Badge variant="info">{doc.status}</Badge>}
                            </TableCell>
                            <TableCell className="text-xs">{fmt(doc.studies_document?.due_date)}</TableCell>
                            <TableCell>
                              <div className="flex gap-1.5 flex-wrap">
                                {doc.file && (
                                  <Button size="sm" variant="secondary" onClick={() => handleDownload(doc.file as number)}>
                                    <Download size={12} />
                                  </Button>
                                )}
                                {!['ACCEPTED', 'VERIFIED'].includes(doc.status) && (
                                  <Button size="sm" variant="success" onClick={() => { setDocModal({ id: doc.id, action: 'accept' }); setDocNote('') }}>
                                    <CheckCircle2 size={12} />
                                  </Button>
                                )}
                                {doc.status !== 'REJECTED' && (
                                  <Button size="sm" variant="danger" onClick={() => { setDocModal({ id: doc.id, action: 'reject' }); setDocNote('') }}>
                                    <XCircle size={12} />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'payments' && (
              <Card>
                <CardHeader><CardTitle>Płatności</CardTitle></CardHeader>
                <CardContent className="p-0">
                  {!detail.payments || detail.payments.length === 0 ? (
                    <p className="p-5 text-sm text-text-muted">Brak płatności.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tytuł</TableHead>
                          <TableHead>Kwota</TableHead>
                          <TableHead>Termin</TableHead>
                          <TableHead>Zapłacono</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.payments.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium text-sm">{p.title || p.fee_type || '-'}</TableCell>
                            <TableCell>{p.amount} PLN</TableCell>
                            <TableCell className="text-xs">{fmt(p.due_date)}</TableCell>
                            <TableCell className="text-xs">{fmt(p.paid_date)}</TableCell>
                            <TableCell>
                              {p.paid_date
                                ? <Badge variant="success">Opłacone</Badge>
                                : <Badge variant="warning">Oczekuje</Badge>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </div>

      {/* Decision modal */}
      <Modal open={!!decisionModal} onClose={() => setDecisionModal(null)}
        title={decisionModal === 'accept' ? 'Zaakceptuj wniosek' : 'Odrzuć wniosek'}
        description={decisionModal === 'accept' ? 'Kandydat uzyska status Studenta.' : 'Wniosek zostanie odrzucony.'}>
        <div className="flex flex-col gap-4">
          {actionMsg && <Alert variant="error">{actionMsg}</Alert>}
          <Input label="Notatka (opcjonalnie)" value={decisionNote} onChange={(e) => setDecisionNote(e.target.value)} />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setDecisionModal(null)}>Anuluj</Button>
            <Button variant={decisionModal === 'accept' ? 'primary' : 'danger'} disabled={actionLoading} onClick={doDecision}>
              {actionLoading ? 'Zapisywanie...' : decisionModal === 'accept' ? 'Zaakceptuj' : 'Odrzuć'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Doc action modal */}
      <Modal open={!!docModal} onClose={() => setDocModal(null)}
        title={docModal?.action === 'accept' ? 'Zaakceptuj dokument' : 'Odrzuć dokument'}>
        <div className="flex flex-col gap-4">
          {actionMsg && <Alert variant="error">{actionMsg}</Alert>}
          <Input label="Notatka (opcjonalnie)" value={docNote} onChange={(e) => setDocNote(e.target.value)} />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setDocModal(null)}>Anuluj</Button>
            <Button variant={docModal?.action === 'accept' ? 'primary' : 'danger'} disabled={actionLoading} onClick={doDocAction}>
              {actionLoading ? 'Zapisywanie...' : docModal?.action === 'accept' ? 'Zaakceptuj' : 'Odrzuć'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
