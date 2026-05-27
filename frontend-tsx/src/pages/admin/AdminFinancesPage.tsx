import React, { useEffect, useMemo, useState } from 'react'
import { getAccessToken } from '@/services/auth'
import { BASE_URL } from '@/api/client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Select } from '@/components/ui/Select'
import { Download, CheckCircle2, Search, X } from 'lucide-react'

const API = BASE_URL.replace(/\/$/, '')

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${getAccessToken()}` } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}

function fmt(d?: string | null) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('pl-PL') } catch { return d }
}

function fmtCur(v: number | string) {
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(Number(v) || 0)
}

interface Fee { id: number; student_name?: string; enrollment?: number; studies_name?: string; edition_id?: number; academic_year?: string; title?: string; amount?: string; due_date?: string; paid_date?: string; status?: string }
interface Transaction { id: number; fee?: number; status?: string; reference_number?: string; payment_date?: string; file?: number | null }
interface Dashboard { overall?: { total_collected?: number; pending_transfers_count?: number } }

type ComputedStatus = 'paid' | 'pending' | 'overdue' | 'unpaid'

function getStatus(fee: Fee, trx?: Transaction): ComputedStatus {
  if (fee.status === 'paid' || fee.paid_date) return 'paid'
  const s = trx?.status?.toUpperCase() ?? ''
  if (s === 'COMPLETED') return 'paid'
  if (s === 'PENDING') return 'pending'
  const today = new Date(); today.setHours(0,0,0,0)
  const due = new Date(fee.due_date ?? '9999'); due.setHours(0,0,0,0)
  return due < today ? 'overdue' : 'unpaid'
}

const STATUS_BADGE: Record<ComputedStatus, React.ReactElement> = {
  paid:    <Badge variant="success">Zaksięgowano</Badge>,
  pending: <Badge variant="warning">Oczekuje</Badge>,
  overdue: <Badge variant="danger">Zaległe</Badge>,
  unpaid:  <Badge variant="default">Brak wpłaty</Badge>,
}

const STATUS_OPTIONS = [
  { value: '', label: 'Wszystkie statusy' },
  { value: 'paid', label: 'Zaksięgowano' },
  { value: 'pending', label: 'Oczekuje' },
  { value: 'overdue', label: 'Zaległe' },
  { value: 'unpaid', label: 'Brak wpłaty' },
]

type ActiveTab = 'payments' | 'transfers'

export default function AdminFinancesPage() {
  const [fees, setFees] = useState<Fee[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<ActiveTab>('payments')
  const [approvingId, setApprovingId] = useState<number | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [kierunekFilter, setKierunekFilter] = useState('')
  const [edycjaFilter, setEdycjaFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([
      apiFetch<Fee[]>('/api/admin/finances/fees/'),
      apiFetch<Transaction[]>('/api/admin/finances/transactions/'),
      apiFetch<Dashboard>('/api/admin/finances/dashboard/'),
    ]).then(([f, t, d]) => {
      setFees(Array.isArray(f) ? f : [])
      setTransactions(Array.isArray(t) ? t : [])
      setDashboard(d)
    }).catch((e: Error) => setError(`Nie udało się załadować danych: ${e.message}`))
      .finally(() => setLoading(false))
  }
useEffect(() => { load() }, [])

  const trxByFee = useMemo(() => {
    const m: Record<number, Transaction> = {}
    transactions.forEach((t) => { if (t.fee && !m[t.fee]) m[t.fee] = t })
    return m
  }, [transactions])

  const pendingTransfers = useMemo(() => transactions.filter((t) => t.status?.toUpperCase() === 'PENDING'), [transactions])

  // Unique kierunek names derived from loaded fees
  const kierunekOptions = useMemo(() => {
    const names = Array.from(new Set(fees.map((f) => f.studies_name).filter(Boolean) as string[])).sort()
    return [{ value: '', label: 'Wszystkie kierunki' }, ...names.map((n) => ({ value: n, label: n }))]
  }, [fees])

  // Unique editions (kierunek + rok), filtered by active kierunek if set
  const edycjaOptions = useMemo(() => {
    const seen = new Map<number, string>()
    fees
      .filter((f) => !kierunekFilter || f.studies_name === kierunekFilter)
      .forEach((f) => {
        if (f.edition_id != null && !seen.has(f.edition_id))
          seen.set(f.edition_id, `${f.studies_name ?? '?'} ${f.academic_year ?? ''}`.trim())
      })
    const opts = Array.from(seen.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([id, label]) => ({ value: String(id), label }))
    return [{ value: '', label: 'Wszystkie edycje' }, ...opts]
  }, [fees, kierunekFilter])

  const hasActiveFilters = search !== '' || kierunekFilter !== '' || edycjaFilter !== '' || statusFilter !== ''

  const filteredFees = useMemo(() => {
    const q = search.trim().toLowerCase()
    return fees.filter((f) => {
      if (q && !(f.student_name ?? '').toLowerCase().includes(q)) return false
      if (kierunekFilter && f.studies_name !== kierunekFilter) return false
      if (edycjaFilter && String(f.edition_id) !== edycjaFilter) return false
      return !(statusFilter && getStatus(f, trxByFee[f.id]) !== statusFilter);

    })
  }, [fees, search, kierunekFilter, edycjaFilter, statusFilter, trxByFee])

  const resetFilters = () => { setSearch(''); setKierunekFilter(''); setEdycjaFilter(''); setStatusFilter('') }

  const handleApprove = async (trxId: number) => {
    setApprovingId(trxId)
    try {
      const res = await fetch(`${API}/api/admin/finances/transactions/${trxId}/approve/`, {
        method: 'POST', headers: { Authorization: `Bearer ${getAccessToken()}` }
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      load()
    } catch (e) { setError(`Nie udało się zatwierdzić: ${(e as Error).message}`) }
    finally { setApprovingId(null) }
  }

  const handleDownload = async (fileId: number) => {
    const res = await fetch(`${API}/api/files/${fileId}/`, {
      headers: { Authorization: `Bearer ${getAccessToken()}` }
    })
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `potwierdzenie_${fileId}`; a.click()
    URL.revokeObjectURL(url)
  }

  const exportCsv = () => {
    const headers = ['Student', 'ID Zapisu', 'Kierunek', 'Przedmiot', 'Kwota (PLN)', 'Status', 'Termin', 'Data wpłaty']
    const labels = { paid: 'Zaksięgowano', pending: 'Oczekuje', overdue: 'Zaległe', unpaid: 'Brak wpłaty' }
    const rows = filteredFees.map((f) => {
      const trx = trxByFee[f.id]
      const status = getStatus(f, trx)
      return [f.student_name, f.enrollment, f.studies_name, f.title, f.amount, labels[status], fmt(f.due_date), fmt(f.paid_date)]
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
        .join(',')
    })
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `finanse_${new Date().toISOString().slice(0,10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">Finanse</h1>
        <p className="text-sm text-text-muted">Zarządzanie płatnościami i budżetem rekrutacyjnym.</p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Summary strip */}
      {dashboard?.overall && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card><CardContent className="py-3"><p className="text-xs text-text-muted uppercase tracking-wide font-semibold">Wpłacono łącznie</p>
            <p className="text-xl font-bold text-success">{fmtCur(dashboard.overall.total_collected ?? 0)}</p></CardContent></Card>
          <Card><CardContent className="py-3"><p className="text-xs text-text-muted uppercase tracking-wide font-semibold">Oczekujące przelewy</p>
            <p className="text-xl font-bold text-warning">{dashboard.overall.pending_transfers_count ?? 0}</p></CardContent></Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-surface-high">
        {([['payments', 'Zarządzanie wpłatami'], ['transfers', `Przelewy do zatwierdzenia${pendingTransfers.length > 0 ? ` (${pendingTransfers.length})` : ''}`]] as [ActiveTab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={['flex items-center px-5 py-3 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px', tab === key ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text'].join(' ')}>
            {label}
          </button>
        ))}
      </div>

      {loading ? <p className="text-text-muted">Ładowanie...</p> : tab === 'payments' ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>Wszystkie wpłaty</CardTitle>
              <Button variant="secondary" size="sm" onClick={exportCsv}>Eksportuj CSV</Button>
            </div>

            {/* Filter bar */}
            <div className="flex flex-wrap gap-3 mt-3">
              <div className="relative flex-1 min-w-48">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder="Szukaj po nazwisku..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-md border border-surface-high bg-surface-low pl-8 pr-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="min-w-44">
                <Select
                  options={kierunekOptions}
                  value={kierunekFilter}
                  onChange={(e) => { setKierunekFilter(e.target.value); setEdycjaFilter('') }}
                />
              </div>
              <div className="min-w-52">
                <Select
                  options={edycjaOptions}
                  value={edycjaFilter}
                  onChange={(e) => setEdycjaFilter(e.target.value)}
                />
              </div>
              <div className="min-w-44">
                <Select
                  options={STATUS_OPTIONS}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                />
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  <X size={14} /> Wyczyść
                </Button>
              )}
            </div>

            {/* Row counter */}
            {!loading && (
              <p className="text-xs text-text-muted mt-2">
                Wyświetlono {filteredFees.length} z {fees.length} {fees.length === 1 ? 'wpłaty' : 'wpłat'}
              </p>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Kierunek</TableHead>
                  <TableHead>Przedmiot</TableHead>
                  <TableHead>Kwota</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Termin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-text-muted">
                      {hasActiveFilters ? 'Brak wyników dla podanych filtrów.' : 'Brak danych'}
                    </TableCell>
                  </TableRow>
                ) : filteredFees.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium text-sm">{f.student_name}</TableCell>
                    <TableCell className="text-xs">{f.studies_name}</TableCell>
                    <TableCell className="text-xs">{f.title}</TableCell>
                    <TableCell>{fmtCur(Number(f.amount))}</TableCell>
                    <TableCell>{STATUS_BADGE[getStatus(f, trxByFee[f.id])]}</TableCell>
                    <TableCell className="text-xs">{fmt(f.due_date)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Przelewy do zatwierdzenia</CardTitle></CardHeader>
          <CardContent className="p-0">
            {pendingTransfers.length === 0 ? (
              <p className="p-5 text-sm text-text-muted flex items-center gap-2">
                <CheckCircle2 size={16} className="text-success" /> Brak oczekujących przelewów.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nr referencyjny</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Plik</TableHead>
                    <TableHead>Akcja</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingTransfers.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">#{t.reference_number ?? t.id}</TableCell>
                      <TableCell className="text-xs">{fmt(t.payment_date)}</TableCell>
                      <TableCell>
                        {t.file ? (
                          <Button size="sm" variant="secondary" onClick={() => handleDownload(t.file as number)}>
                            <Download size={13} /> Pobierz
                          </Button>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="success" disabled={approvingId === t.id}
                          onClick={() => handleApprove(t.id)}>
                          {approvingId === t.id ? 'Zatwierdzanie...' : 'Zatwierdź'}
                        </Button>
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
  )
}
