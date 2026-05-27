import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, type AdminEnrollment } from '@/services/api'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Mail, Send, Search, X } from 'lucide-react'
import { getAccessToken } from '@/services/auth'
import { BASE_URL } from '@/api/client'

const TEMPLATES = {
  missing_documents: { label: 'Brakujące dokumenty', subject: 'Przypomnienie: Brakujące dokumenty', body: 'Przypominamy, że do Twojej rekrutacji brakuje wymaganych dokumentów. Prosimy o ich dostarczenie jak najszybciej.' },
  missing_payment:   { label: 'Brakująca płatność',  subject: 'Przypomnienie: Brakująca płatność',  body: 'Przypominamy o nieopłaconej opłacie rekrutacyjnej. Prosimy o jej uregulowanie w możliwie najkrótszym terminie.' },
  course_start:      { label: 'Rozpoczęcie kierunku', subject: 'Zapraszamy na początek kierunku', body: 'Informujemy, że studia na kierunku {{studies_name}} rozpoczynają się {{start_date}}.' },
  custom:            { label: 'Wiadomość własna', subject: '', body: '' },
}

export default function AdminNotificationsPage() {
  const [enrollments, setEnrollments] = useState<AdminEnrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterEdition, setFilterEdition] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterMissingDocs, setFilterMissingDocs] = useState(false)
  const [filterUnpaid, setFilterUnpaid] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [showModal, setShowModal] = useState(false)
  const [template, setTemplate] = useState<keyof typeof TEMPLATES>('missing_documents')
  const [subject, setSubject] = useState(TEMPLATES.missing_documents.subject)
  const [body, setBody] = useState(TEMPLATES.missing_documents.body)
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    api.getAdminEnrollments().then((res) => {
      if (!res.error) {
        const data = res.data
        const list = Array.isArray(data) ? data : (data as { results: AdminEnrollment[] }).results ?? []
        setEnrollments(list)
      }
      setLoading(false)
    })
  }, [])

  const editions = useMemo(() => [...new Set(enrollments.map((e) => e.studies_name).filter(Boolean))].sort() as string[], [enrollments])

  const filtered = useMemo(() => enrollments.filter((e) => {
    const q = search.trim().toLowerCase()
    if (q && !(e.student_name ?? '').toLowerCase().includes(q)) return false
    if (filterEdition && e.studies_name !== filterEdition) return false
    if (filterStatus && e.status?.toLowerCase() !== filterStatus) return false
    if (filterMissingDocs && !e.missing_documents) return false
    return !(filterUnpaid && e.is_fully_paid)
  }), [enrollments, search, filterEdition, filterStatus, filterMissingDocs, filterUnpaid])

  const allSelected = filtered.length > 0 && filtered.every((e) => selected.has(e.id))

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allSelected) filtered.forEach((e) => next.delete(e.id))
      else filtered.forEach((e) => next.add(e.id))
      return next
    })
  }, [allSelected, filtered])

  const toggle = useCallback((id: number) => {
    setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }, [])

  const changeTemplate = (key: keyof typeof TEMPLATES) => {
    setTemplate(key)
    setSubject(TEMPLATES[key].subject)
    setBody(TEMPLATES[key].body)
  }

  const doSend = async () => {
    if (!subject.trim() || !body.trim()) { setMsg('Uzupełnij temat i treść wiadomości.'); return }
    setSending(true); setMsg('')
    const ids = [...selected]
    const payload = { enrollment_ids: ids, notification_subject: subject, notification_body: body }
    try {
      const res = await fetch(`${BASE_URL.replace(/\/$/, '')}/api/notifications/send/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAccessToken()}` },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setMsg(`Wiadomości wysłane dla ${ids.length} kandydatów.`)
      setShowModal(false); setSelected(new Set())
    } catch (e) { setMsg(`Błąd: ${(e as Error).message}`) }
    finally { setSending(false) }
  }

  const STATUS_LABELS: Record<string, string> = {
    'candidate': 'Kandydat',
    'student': 'Student',
    'rejected': 'Odrzucony',
  }

  const statusOptions = [
    { value: '', label: 'Wszystkie statusy' },
    { value: 'candidate', label: 'Kandydat' },
    { value: 'student', label: 'Student' },
    { value: 'rejected', label: 'Odrzucony' },
  ]

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">Powiadomienia</h1>
        <p className="text-sm text-text-muted">Filtruj kandydatów, wybierz odbiorców i wyślij e-mail.</p>
      </div>

      {msg && <Alert variant={msg.startsWith('Błąd') ? 'error' : 'success'}>{msg}</Alert>}

      {/* Filters */}
      <Card>
        <CardContent className="py-4 space-y-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Szukaj po nazwisku..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-outline bg-surface-low pl-8 pr-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Select label="Kierunek"
              options={[{ value: '', label: 'Wszystkie kierunki' }, ...editions.map((e) => ({ value: e, label: e }))]}
              value={filterEdition} onChange={(e) => setFilterEdition(e.target.value)} />
            <Select label="Status" options={statusOptions} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} />
            <label className="flex items-center gap-2 text-sm cursor-pointer pt-6">
              <input type="checkbox" checked={filterMissingDocs} onChange={(e) => setFilterMissingDocs(e.target.checked)} />
              Braki dokumentów
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer pt-6">
              <input type="checkbox" checked={filterUnpaid} onChange={(e) => setFilterUnpaid(e.target.checked)} />
              Nieopłacone
            </label>
          </div>
          {(search || filterEdition || filterStatus || filterMissingDocs || filterUnpaid) && (
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setFilterEdition(''); setFilterStatus(''); setFilterMissingDocs(false); setFilterUnpaid(false) }}>
                <X size={14} /> Wyczyść
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Kandydaci ({filtered.length}){selected.size > 0 && ` — zaznaczono: ${selected.size}`}</CardTitle>
            <Button disabled={selected.size === 0} onClick={() => { setShowModal(true); setMsg('') }}
              className="flex items-center gap-2">
              <Mail size={15} /> Wyślij ({selected.size})
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <p className="p-5 text-sm text-text-muted">Ładowanie...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                  </TableHead>
                  <TableHead>Imię i nazwisko</TableHead>
                  <TableHead>Kierunek</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dokumenty</TableHead>
                  <TableHead>Płatności</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-text-muted">Brak wyników</TableCell></TableRow>
                ) : filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell><input type="checkbox" checked={selected.has(e.id)} onChange={() => toggle(e.id)} /></TableCell>
                    <TableCell className="font-medium text-sm">{e.student_name}</TableCell>
                    <TableCell className="text-xs">{e.studies_name}</TableCell>
                    <TableCell><Badge variant={e.status?.toUpperCase() === 'STUDENT' ? 'success' : 'primary'}>{STATUS_LABELS[e.status?.toLowerCase() ?? ''] || e.status}</Badge></TableCell>
                    <TableCell>{e.missing_documents ? <Badge variant="danger">Braki</Badge> : <Badge variant="success">OK</Badge>}</TableCell>
                    <TableCell>{e.is_fully_paid ? <Badge variant="success">Opłacone</Badge> : <Badge variant="warning">Nieopłacone</Badge>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Compose modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Komponowanie wiadomości"
        description={`Wysyłasz do ${selected.size} kandydatów`} className="max-w-2xl">
        <div className="flex flex-col gap-4">
          {msg && <Alert variant="error">{msg}</Alert>}
          <Select label="Szablon"
            options={Object.entries(TEMPLATES).map(([k, v]) => ({ value: k, label: v.label }))}
            value={template} onChange={(e) => changeTemplate(e.target.value as keyof typeof TEMPLATES)} />
          <Input label="Temat" value={subject} onChange={(e) => setSubject(e.target.value)} required />
          <div className="flex flex-col gap-1">
            <label className="text-[0.65rem] font-semibold uppercase tracking-wide text-text-muted">Treść</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8}
              className="w-full rounded-md border border-surface-high bg-surface-low px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            <p className="text-xs text-text-muted">Zmienne: {'{{user_name}}'}, {'{{studies_name}}'}, {'{{start_date}}'}</p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Anuluj</Button>
            <Button disabled={sending} onClick={doSend} className="flex items-center gap-2">
              <Send size={14} /> {sending ? 'Wysyłanie...' : `Wyślij (${selected.size})`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
