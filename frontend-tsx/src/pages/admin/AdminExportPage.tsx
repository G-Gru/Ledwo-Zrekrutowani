import { useState, useMemo } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { api } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Download, X, RefreshCw } from 'lucide-react'

const PREVIEW_LIMIT = 20

const COLUMNS = [
  { key: 'id', label: 'ID' },
  { key: 'student_name', label: 'Imię i nazwisko' },
  { key: 'pesel', label: 'PESEL' },
  { key: 'email', label: 'Email' },
  { key: 'studies_name', label: 'Kierunek' },
  { key: 'status', label: 'Status' },
  { key: 'is_fully_paid', label: 'Opłacony' },
  { key: 'missing_documents', label: 'Brak dok.' },
] as const

type ColKey = (typeof COLUMNS)[number]['key']

type ExportRow = Record<ColKey, string | number | boolean>

const STATUS_LABEL: Record<string, string> = {
  CANDIDATE: 'Kandydat',
  STUDENT: 'Student',
  EXPELLED: 'Skreślony',
  RESIGNED: 'Zrezygnował',
  FINISHED: 'Ukończył',
}

const STATUS_CLASS: Record<string, string> = {
  CANDIDATE: 'text-blue-600',
  STUDENT: 'text-green-600',
  EXPELLED: 'text-red-600',
  RESIGNED: 'text-orange-500',
  FINISHED: 'text-gray-500',
}

function CellValue({ row, col }: { row: ExportRow; col: ColKey }) {
  const v = row[col]
  if (col === 'status') {
    const s = v as string
    return <span className={`font-medium ${STATUS_CLASS[s] ?? ''}`}>{STATUS_LABEL[s] ?? s}</span>
  }
  if (col === 'is_fully_paid') {
    return v ? (
      <span className="text-green-600 font-medium">Tak</span>
    ) : (
      <span className="text-red-500">Nie</span>
    )
  }
  if (col === 'missing_documents') {
    return v ? (
      <span className="text-red-500 font-medium">Tak</span>
    ) : (
      <span className="text-green-600">Nie</span>
    )
  }
  return <>{String(v ?? '—')}</>
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-text-muted font-medium">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 px-2 text-sm border border-gray-300 rounded bg-surface-low focus:outline-none focus:ring-1 focus:ring-primary-container"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

const ALL_KEYS = COLUMNS.map((c) => c.key)

export default function AdminExportPage() {
  usePageTitle('Eksport')
  const [rows, setRows] = useState<ExportRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterStudies, setFilterStudies] = useState('')
  const [filterPaid, setFilterPaid] = useState('')
  const [filterDocs, setFilterDocs] = useState('')

  const [selectedCols, setSelectedCols] = useState<ColKey[]>([...ALL_KEYS])

  const toggleCol = (key: ColKey) =>
    setSelectedCols((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...ALL_KEYS.filter((k) => prev.includes(k) || k === key)]
    )

  const activeCols = COLUMNS.filter((c) => selectedCols.includes(c.key))

  const load = async () => {
    setLoading(true)
    setError('')
    const res = await api.getUsosExport()
    if (!res.error && Array.isArray(res.data)) {
      setRows(res.data as ExportRow[])
      setLoaded(true)
    } else {
      setError('Nie udało się pobrać danych eksportu.')
    }
    setLoading(false)
  }

  const uniqueStatuses = useMemo(() => [...new Set(rows.map((r) => r.status as string))].sort(), [rows])
  const uniqueStudies = useMemo(() => [...new Set(rows.map((r) => r.studies_name as string))].sort(), [rows])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return rows.filter((r) => {
      if (q) {
        const name = (r.student_name as string).toLowerCase()
        const email = (r.email as string).toLowerCase()
        const pesel = r.pesel as string
        if (!name.includes(q) && !email.includes(q) && !pesel.includes(q)) return false
      }
      if (filterStatus && r.status !== filterStatus) return false
      if (filterStudies && r.studies_name !== filterStudies) return false
      if (filterPaid === 'paid' && !r.is_fully_paid) return false
      if (filterPaid === 'unpaid' && r.is_fully_paid) return false
      if (filterDocs === 'ok' && r.missing_documents) return false
      return !(filterDocs === 'missing' && !r.missing_documents);

    })
  }, [rows, search, filterStatus, filterStudies, filterPaid, filterDocs])

  const hasFilters = search || filterStatus || filterStudies || filterPaid || filterDocs

  const clearFilters = () => {
    setSearch('')
    setFilterStatus('')
    setFilterStudies('')
    setFilterPaid('')
    setFilterDocs('')
  }

  const exportCsv = () => {
    if (filtered.length === 0 || activeCols.length === 0) return
    const header = activeCols.map((c) => c.label).join(',')
    const body = filtered.map((r) =>
      activeCols.map((c) => {
        const v = r[c.key]
        if (c.key === 'status') return STATUS_LABEL[v as string] ?? v
        if (typeof v === 'boolean') return v ? 'Tak' : 'Nie'
        return `"${String(v ?? '').replace(/"/g, '""')}"`
      }).join(',')
    )
    const csv = [header, ...body].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `usos_export_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">Eksport danych</h1>
        <p className="text-sm text-text-muted">
          Eksport danych kandydatów do systemu USOS i innych formatów.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle>Eksport USOS</CardTitle>
            <div className="flex gap-2 items-center">
              {loaded && (
                <span className="text-sm text-text-muted">
                  {hasFilters ? `${filtered.length} / ${rows.length}` : `${rows.length}`} rekordów
                </span>
              )}
              <Button variant="secondary" onClick={load} disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-1">
                    <RefreshCw size={13} className="animate-spin" /> Pobieranie…
                  </span>
                ) : loaded ? (
                  'Odśwież'
                ) : (
                  'Załaduj dane'
                )}
              </Button>
              {loaded && filtered.length > 0 && (
                <Button onClick={exportCsv} className="flex items-center gap-2">
                  <Download size={15} />
                  Pobierz CSV{hasFilters ? ` (${filtered.length})` : ''}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {loaded && (
          <div className="px-4 pb-3 border-b border-gray-200 flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-text-muted font-medium">Szukaj</span>
              <input
                type="text"
                placeholder="Imię, email, PESEL…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 px-2 text-sm border border-gray-300 rounded bg-surface-low w-52 focus:outline-none focus:ring-1 focus:ring-primary-container"
              />
            </div>

            <FilterSelect
              label="Status"
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: '', label: 'Wszystkie statusy' },
                ...uniqueStatuses.map((s) => ({ value: s, label: STATUS_LABEL[s] ?? s })),
              ]}
            />

            <FilterSelect
              label="Kierunek"
              value={filterStudies}
              onChange={setFilterStudies}
              options={[
                { value: '', label: 'Wszystkie kierunki' },
                ...uniqueStudies.map((s) => ({ value: s, label: s })),
              ]}
            />

            <FilterSelect
              label="Opłaty"
              value={filterPaid}
              onChange={setFilterPaid}
              options={[
                { value: '', label: 'Wszystkie' },
                { value: 'paid', label: 'Opłacone' },
                { value: 'unpaid', label: 'Nieopłacone' },
              ]}
            />

            <FilterSelect
              label="Dokumenty"
              value={filterDocs}
              onChange={setFilterDocs}
              options={[
                { value: '', label: 'Wszystkie' },
                { value: 'ok', label: 'Kompletne' },
                { value: 'missing', label: 'Brakujące' },
              ]}
            />

            {hasFilters && (
              <div className="flex flex-col gap-0.5 justify-end">
                <span className="text-xs opacity-0 font-medium">_</span>
                <button
                  onClick={clearFilters}
                  className="h-8 px-3 flex items-center gap-1 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50"
                >
                  <X size={13} /> Wyczyść
                </button>
              </div>
            )}
          </div>
        )}

        {loaded && (
          <div className="px-4 py-3 border-b border-gray-200 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-text-muted font-medium mr-1">Kolumny:</span>
            {COLUMNS.map((c) => {
              const active = selectedCols.includes(c.key)
              return (
                <button
                  key={c.key}
                  onClick={() => toggleCol(c.key)}
                  className={`h-7 px-3 text-xs rounded-full border transition-colors ${
                    active
                      ? 'bg-primary-container border-primary-container text-primary font-medium'
                      : 'bg-white border-gray-300 text-gray-400 hover:border-gray-400'
                  }`}
                >
                  {c.label}
                </button>
              )
            })}
            <div className="flex gap-1 ml-2">
              <button
                onClick={() => setSelectedCols([...ALL_KEYS])}
                className="text-xs text-text-muted hover:text-primary underline"
              >
                Wszystkie
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => setSelectedCols([])}
                className="text-xs text-text-muted hover:text-red-500 underline"
              >
                Żadne
              </button>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          {!loaded ? (
            <p className="p-5 text-sm text-text-muted">
              Kliknij „Załaduj dane" aby pobrać dane eksportu.
            </p>
          ) : filtered.length === 0 ? (
            <p className="p-5 text-sm text-text-muted">
              Brak rekordów spełniających kryteria filtrowania.
            </p>
          ) : activeCols.length === 0 ? (
            <p className="p-5 text-sm text-text-muted">
              Zaznacz co najmniej jedną kolumnę aby wyświetlić dane.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {activeCols.map((c) => (
                    <TableHead key={c.key}>{c.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, PREVIEW_LIMIT).map((r, i) => (
                  <TableRow key={i}>
                    {activeCols.map((c) => (
                      <TableCell key={c.key} className="text-xs">
                        <CellValue row={r} col={c.key} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {filtered.length > PREVIEW_LIMIT && (
            <p className="p-3 text-xs text-text-muted text-center border-t border-gray-100">
              Podgląd: <strong>{PREVIEW_LIMIT}</strong> z{' '}
              <strong>{filtered.length}</strong> rekordów — pobierz CSV aby wyeksportować
              wszystkie.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
