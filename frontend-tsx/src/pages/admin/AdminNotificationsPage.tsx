import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { api, type AdminEnrollment } from '@/services/api'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Eye, Mail, Send, Search, Tag, X } from 'lucide-react'
import { getAccessToken } from '@/services/auth'
import { BASE_URL } from '@/api/client'

const TEMPLATES = {
  missing_documents: {
    label: 'Brakujące dokumenty',
    subject: 'Przypomnienie: Brakujące dokumenty',
    body: 'Przypominamy, że do Twojej rekrutacji brakuje wymaganych dokumentów. Prosimy o ich dostarczenie jak najszybciej.',
  },
  missing_payment: {
    label: 'Brakująca płatność',
    subject: 'Przypomnienie: Brakująca płatność',
    body: 'Przypominamy o nieopłaconej opłacie rekrutacyjnej. Prosimy o jej uregulowanie w możliwie najkrótszym terminie.',
  },
  course_start: {
    label: 'Informacja o rozpoczęciu kierunku',
    subject: 'Zapraszamy na początek kierunku',
    body: 'Informujemy, że studia na kierunku {{studies_name}} rozpoczynają się {{start_date}}. Szczegóły organizacyjne znajdują się na portalu.',
  },
  no_start: {
    label: 'Brak startu kierunku',
    subject: 'Informacja o rezygnacji z kierunku',
    body: 'Informujemy, że kierunek {{studies_name}} nie zostanie uruchomiony w tej edycji. Przepraszamy za niedogodności.',
  },
  custom: {
    label: 'Wiadomość własna',
    subject: '',
    body: '',
  },
} as const

type TemplateKey = keyof typeof TEMPLATES

const VARIABLES = [
  { key: '{{user_name}}', label: 'Imię i nazwisko' },
  { key: '{{user_email}}', label: 'Email' },
  { key: '{{studies_name}}', label: 'Kierunek' },
  { key: '{{start_date}}', label: 'Data rozpoczęcia' },
]

const STATUS_LABELS: Record<string, string> = {
  draft: 'Wniosek niewysłany',
  candidate: 'Kandydat',
  student: 'Student',
  reserve: 'Kandydat rezerwowy',
  rejected: 'Odrzucony',
  expelled: 'Skreślony',
}

const STATUS_VARIANT: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'danger'> = {
  draft: 'default',
  candidate: 'primary',
  student: 'success',
  reserve: 'warning',
  rejected: 'danger',
  expelled: 'danger',
}

const statusOptions = [
  { value: '', label: 'Wszystkie statusy' },
  { value: 'candidate', label: 'Kandydat' },
  { value: 'student', label: 'Student' },
  { value: 'reserve', label: 'Kandydat rezerwowy' },
  { value: 'rejected', label: 'Odrzucony' },
  { value: 'expelled', label: 'Skreślony' },
]

const hasVars = (text: string) => /\{\{.*?\}\}/.test(text)

function substituteVars(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
}

export default function AdminNotificationsPage() {
  usePageTitle('Powiadomienia')

  const [enrollments, setEnrollments] = useState<AdminEnrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterEdition, setFilterEdition] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterMissingDocs, setFilterMissingDocs] = useState(false)
  const [filterUnpaid, setFilterUnpaid] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const [showModal, setShowModal] = useState(false)
  const [template, setTemplate] = useState<TemplateKey>('missing_documents')
  const [subject, setSubject] = useState<string>(TEMPLATES.missing_documents.subject)
  const [body, setBody] = useState<string>(TEMPLATES.missing_documents.body)
  const [useSenderName, setUseSenderName] = useState(false)
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgError, setMsgError] = useState(false)

  const bodyRef = useRef<HTMLTextAreaElement>(null)

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

  const editions = useMemo(
    () => [...new Set(enrollments.map((e) => e.studies_name).filter(Boolean))].sort() as string[],
    [enrollments],
  )

  const filtered = useMemo(
    () =>
      enrollments.filter((e) => {
        const q = search.trim().toLowerCase()
        if (q && !(e.student_name ?? '').toLowerCase().includes(q)) return false
        if (filterEdition && e.studies_name !== filterEdition) return false
        if (filterStatus && e.status?.toLowerCase() !== filterStatus) return false
        if (filterMissingDocs && !e.missing_documents) return false
        return !(filterUnpaid && e.is_fully_paid)
      }),
    [enrollments, search, filterEdition, filterStatus, filterMissingDocs, filterUnpaid],
  )

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
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const changeTemplate = (key: TemplateKey) => {
    setTemplate(key)
    setSubject(TEMPLATES[key].subject)
    setBody(TEMPLATES[key].body)
  }

  const insertVariable = (varKey: string) => {
    const el = bodyRef.current
    if (!el) {
      setBody((b) => b + varKey)
      return
    }
    const start = el.selectionStart ?? body.length
    const end = el.selectionEnd ?? body.length
    const newBody = body.slice(0, start) + varKey + body.slice(end)
    setBody(newBody)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + varKey.length, start + varKey.length)
    }, 0)
  }

  const openModal = () => {
    setMsg('')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setMsg('')
  }

  const doSend = async () => {
    if (!subject.trim() || !body.trim()) {
      setMsg('Uzupełnij temat i treść wiadomości.')
      setMsgError(true)
      return
    }
    setSending(true)
    setMsg('')
    const emails = enrollments.filter((e) => selected.has(e.id)).map((e) => e.email).filter(Boolean)
    try {
      const res = await fetch(`${BASE_URL.replace(/\/$/, '')}/api/admin/notifications/new/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAccessToken()}` },
        body: JSON.stringify({
          emails,
          notification_subject: subject,
          notification_body: body,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setMsg(`Wiadomości wysłane do ${emails.length} kandydatów.`)
      setMsgError(false)
      setShowModal(false)
      setSelected(new Set())
    } catch (e) {
      setMsg(`Błąd: ${(e as Error).message}`)
      setMsgError(true)
    } finally {
      setSending(false)
    }
  }

  const recipientCount = selected.size
  const senderSignature = useSenderName ? 'Administrator' : 'Rekrutacja AGH'

  const previewEnrollment = useMemo(
    () => enrollments.find((e) => selected.has(e.id)) ?? null,
    [enrollments, selected],
  )

  const previewVars: Record<string, string> = {
    user_name: previewEnrollment?.student_name ?? 'Jan Kowalski',
    user_email: previewEnrollment?.email ?? 'jan.kowalski@example.com',
    studies_name: previewEnrollment?.studies_name ?? 'Nazwa kierunku',
    start_date: '',
  }

  const previewSubject = substituteVars(subject, previewVars)
  const previewBody = substituteVars(
    `Dzień dobry ${previewVars.user_name},\n\n${body || '…'}\n\nPozdrawiam,\n${senderSignature}`,
    previewVars,
  )

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">Powiadomienia</h1>
        <p className="text-sm text-text-muted">Filtruj kandydatów, wybierz odbiorców i wyślij e-mail.</p>
      </div>

      {msg && !showModal && <Alert variant={msgError ? 'error' : 'success'}>{msg}</Alert>}

      {/* Filters */}
      <Card>
        <CardContent className="py-4 space-y-4">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
            <input
              type="text"
              placeholder="Szukaj po nazwisku..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-surface-high bg-surface-low pl-8 pr-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Select
              label="Kierunek"
              options={[{ value: '', label: 'Wszystkie kierunki' }, ...editions.map((e) => ({ value: e, label: e }))]}
              value={filterEdition}
              onChange={(e) => setFilterEdition(e.target.value)}
            />
            <Select
              label="Status"
              options={statusOptions}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            />
            <label className="flex items-center gap-2 text-sm cursor-pointer pt-6">
              <input
                type="checkbox"
                checked={filterMissingDocs}
                onChange={(e) => setFilterMissingDocs(e.target.checked)}
              />
              Braki dokumentów
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer pt-6">
              <input type="checkbox" checked={filterUnpaid} onChange={(e) => setFilterUnpaid(e.target.checked)} />
              Nieopłacone
            </label>
          </div>
          {(search || filterEdition || filterStatus || filterMissingDocs || filterUnpaid) && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('')
                  setFilterEdition('')
                  setFilterStatus('')
                  setFilterMissingDocs(false)
                  setFilterUnpaid(false)
                }}
              >
                <X size={14} /> Wyczyść filtry
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Candidates table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Kandydaci ({filtered.length})
              {selected.size > 0 && (
                <span className="ml-2 text-sm font-normal text-text-muted">— zaznaczono: {selected.size}</span>
              )}
            </CardTitle>
            <Button disabled={selected.size === 0} onClick={openModal} className="flex items-center gap-2">
              <Mail size={15} />
              Wyślij ({selected.size})
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-5 text-sm text-text-muted">Ładowanie...</p>
          ) : (
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
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-text-muted">
                      Brak wyników
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>
                        <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggle(e.id)} />
                      </TableCell>
                      <TableCell className="font-medium text-sm">{e.student_name}</TableCell>
                      <TableCell className="text-xs text-text-muted">{e.studies_name}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[e.status?.toLowerCase() ?? ''] ?? 'default'}>
                          {STATUS_LABELS[e.status?.toLowerCase() ?? ''] || e.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {e.missing_documents ? (
                          <Badge variant="danger">Braki</Badge>
                        ) : (
                          <Badge variant="success">OK</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {e.is_fully_paid ? (
                          <Badge variant="success">Opłacone</Badge>
                        ) : (
                          <Badge variant="warning">Nieopłacone</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Compose modal */}
      <Modal
        open={showModal}
        onClose={closeModal}
        title="Komponowanie wiadomości"
        description={`Wysyłasz do ${recipientCount} ${recipientCount === 1 ? 'kandydata' : 'kandydatów'}`}
        className="max-w-3xl"
      >
        <div className="flex flex-col gap-5">
          {msg && showModal && <Alert variant={msgError ? 'error' : 'success'}>{msg}</Alert>}

          {/* Template picker */}
          <Select
            label="Szablon"
            options={Object.entries(TEMPLATES).map(([k, v]) => ({ value: k, label: v.label }))}
            value={template}
            onChange={(e) => changeTemplate(e.target.value as TemplateKey)}
          />

          {/* Subject */}
          <Input label="Temat" value={subject} onChange={(e) => setSubject(e.target.value)} required />

          {/* Body editor */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.65rem] font-semibold uppercase tracking-wide text-text-muted">
              Treść wiadomości
            </label>
            <textarea
              ref={bodyRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="w-full rounded-md border border-surface-high bg-surface-low px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />

            {/* Clickable variable chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="flex items-center gap-1 text-xs text-text-muted shrink-0">
                <Tag size={11} />
                Wstaw zmienną:
              </span>
              {VARIABLES.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => insertVariable(v.key)}
                  title={v.label}
                  className="rounded border border-surface-high bg-surface-low px-2 py-0.5 font-mono text-xs text-primary hover:bg-primary-container hover:border-primary transition-colors cursor-pointer"
                >
                  {v.key}
                </button>
              ))}
            </div>
          </div>

          {/* Live preview */}
          <div className="rounded-lg border border-surface-high overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-surface-high bg-surface-low">
              <div className="flex items-center gap-1.5">
                <Eye size={13} className="text-text-muted" />
                <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">Podgląd</span>
              </div>
              {previewEnrollment && (
                <span className="text-xs text-text-muted">
                  dla: <span className="font-medium text-text">{previewEnrollment.student_name}</span>
                </span>
              )}
            </div>
            <div className="px-4 py-3 bg-white space-y-2">
              <p className="text-xs text-text-muted">
                <span className="font-medium">Temat: </span>
                {previewSubject ? (
                  <span className="text-text">{previewSubject}</span>
                ) : (
                  <em className="text-text-muted">brak tematu</em>
                )}
              </p>
              <div className="rounded border border-dashed border-surface-high bg-surface-low px-4 py-3">
                <p className="whitespace-pre-wrap text-sm text-text leading-relaxed">{previewBody}</p>
              </div>
              {(hasVars(body) || hasVars(subject)) && (
                <p className="text-xs text-text-muted flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-primary-container border border-primary shrink-0" />
                  Zmienne zostaną zastąpione danymi każdego kandydata przy wysyłaniu.
                </p>
              )}
            </div>
          </div>

          {/* Sender option */}
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={useSenderName}
              onChange={(e) => setUseSenderName(e.target.checked)}
            />
            Użyj mojego imienia i nazwiska w podpisie
          </label>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2 border-t border-surface-high">
            <Button variant="secondary" onClick={closeModal}>
              Anuluj
            </Button>
            <Button disabled={sending} onClick={doSend} className="flex items-center gap-2">
              <Send size={14} />
              {sending ? 'Wysyłanie…' : `Wyślij dla ${recipientCount} kandydatów`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
