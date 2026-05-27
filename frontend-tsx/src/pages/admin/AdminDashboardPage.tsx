import { useEffect, useMemo, useState } from 'react'
import { api } from '@/services/api'
import { Alert } from '@/components/ui/Alert'
import { Card, CardContent } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Users, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react'

interface StatRow {
  edition_id: number; studies_name?: string; academic_year?: string
  candidates_total?: number; paid_entries_count?: number; unpaid_entries_count?: number
  missing_documents_count?: number
  statuses?: { candidate?: number; student?: number; expelled?: number }
  amounts?: { total_fees?: number; paid_fees?: number; unpaid_fees?: number }
}

function fmt(v: number) {
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(v)
}

function StatCard({ icon: Icon, label, value, color = 'text-[var(--color-text)]' }: { icon: React.ElementType; label: string; value: string | number; color?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-4">
        <div className="p-2.5 rounded-xl bg-surface-container">
          <Icon size={20} className="text-secondary" />
        </div>
        <div>
          <p className="text-[0.65rem] uppercase tracking-wide text-text-muted font-semibold">{label}</p>
          <p className={`text-xl font-bold ${color}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminDashboardPage() {
  const [rows, setRows] = useState<StatRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.getRecruitmentStats().then((res) => {
      if (!res.error && Array.isArray(res.data)) setRows(res.data as StatRow[])
      else setError('Nie udało się pobrać statystyk.')
      setLoading(false)
    })
  }, [])

  const studiesOptions = useMemo(() => {
    const names = [...new Set(rows.map((r) => r.studies_name).filter(Boolean))] as string[]
    return [{ value: 'all', label: 'Wszystkie kierunki' }, ...names.sort((a, b) => a.localeCompare(b, 'pl')).map((n) => ({ value: n, label: n }))]
  }, [rows])

  const visible = useMemo(() => filter === 'all' ? rows : rows.filter((r) => r.studies_name === filter), [rows, filter])

  const sum = useMemo(() => visible.reduce((a, r) => ({
    editions: a.editions + 1,
    candidates: a.candidates + (r.candidates_total || 0),
    paid: a.paid + (r.paid_entries_count || 0),
    unpaid: a.unpaid + (r.unpaid_entries_count || 0),
    missingDocs: a.missingDocs + (r.missing_documents_count || 0),
    students: a.students + (r.statuses?.student || 0),
    paidFees: a.paidFees + Number(r.amounts?.paid_fees || 0),
    unpaidFees: a.unpaidFees + Number(r.amounts?.unpaid_fees || 0),
  }), { editions: 0, candidates: 0, paid: 0, unpaid: 0, missingDocs: 0, students: 0, paidFees: 0, unpaidFees: 0 }), [visible])

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">Statystyki rekrutacji</h1>
        <p className="text-sm text-text-muted">Przegląd rekrutacji dla przypisanych kierunków i edycji.</p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="max-w-xs">
        <Select options={studiesOptions} value={filter} onChange={(e) => setFilter(e.target.value)} label="Filtruj według kierunku" />
      </div>

      {loading ? <p className="text-text-muted">Ładowanie...</p> : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={TrendingUp} label="Edycje" value={sum.editions} />
            <StatCard icon={Users} label="Kandydaci" value={sum.candidates} />
            <StatCard icon={CheckCircle2} label="Opłacone" value={sum.paid} color="text-[var(--color-success)]" />
            <StatCard icon={AlertTriangle} label="Nieopłacone" value={sum.unpaid} color="text-[var(--color-error)]" />
            <StatCard icon={CheckCircle2} label="Studenci" value={sum.students} color="text-[var(--color-success)]" />
            <StatCard icon={AlertTriangle} label="Braki dokumentów" value={sum.missingDocs} color="text-[var(--color-warning)]" />
            <StatCard icon={TrendingUp} label="Wpłacone kwoty" value={fmt(sum.paidFees)} color="text-[var(--color-success)]" />
            <StatCard icon={TrendingUp} label="Nieopłacone kwoty" value={fmt(sum.unpaidFees)} color="text-[var(--color-error)]" />
          </div>

          <Card>
            <div className="px-5 py-3 border-b border-surface-high font-semibold text-sm">
              Szczegóły według edycji
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kierunek</TableHead>
                  <TableHead>Rok akademicki</TableHead>
                  <TableHead>Kandydaci</TableHead>
                  <TableHead>Opłacone</TableHead>
                  <TableHead>Nieopłacone</TableHead>
                  <TableHead>Braki dok.</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Wpłacone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-text-muted">Brak danych</TableCell></TableRow>
                ) : visible.map((r) => (
                  <TableRow key={r.edition_id}>
                    <TableCell className="font-medium">{r.studies_name}</TableCell>
                    <TableCell>{r.academic_year || '-'}</TableCell>
                    <TableCell>{r.candidates_total || 0}</TableCell>
                    <TableCell className="text-success">{r.paid_entries_count || 0}</TableCell>
                    <TableCell className="text-error">{r.unpaid_entries_count || 0}</TableCell>
                    <TableCell className="text-warning">{r.missing_documents_count || 0}</TableCell>
                    <TableCell>{r.statuses?.student || 0}</TableCell>
                    <TableCell>{fmt(Number(r.amounts?.paid_fees || 0))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  )
}
