import { useEffect, useRef, useState } from 'react'
import { api, type Payment } from '@/services/api'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { CreditCard, History, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

function fmt(d?: string | null) {
  if (!d) return '-'
  try { return new Date(d).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' }) }
  catch { return d }
}

function payBadge(status: string) {
  const s = status?.toLowerCase()
  if (s === 'paid') return <Badge variant="success">Opłacone</Badge>
  if (s === 'pending') return <Badge variant="warning">Oczekuje</Badge>
  if (s === 'overdue') return <Badge variant="danger">Po terminie</Badge>
  return <Badge>{status}</Badge>
}

export default function MyPaymentsPage() {
  const { user } = useAuth()
  const [upcoming, setUpcoming] = useState<Payment[]>([])
  const [history, setHistory] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showPay, setShowPay] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [payMsg, setPayMsg] = useState('')
  const [paySuccess, setPaySuccess] = useState<boolean | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    const [upRes, histRes] = await Promise.all([api.getUpcomingPayments(), api.getPaymentHistory()])
    if (!upRes.error && Array.isArray(upRes.data)) setUpcoming(upRes.data)
    else if (upRes.error) setError(upRes.msg)
    if (!histRes.error && Array.isArray(histRes.data)) setHistory(histRes.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const totalAmount = upcoming
    .filter((p) => selectedIds.includes(p.id))
    .reduce((s, p) => s + parseFloat(p.amount?.replace(/[^\d.]/g, '') || '0'), 0)
    .toFixed(2)

  const transferTitle = user ? `Oplata-${user.first_name}${user.last_name}-ID${selectedIds.join(',')}` : ''

  const doPayment = async () => {
    setPayMsg(''); setPaySuccess(null)
    const body = proofFile ? (() => { const fd = new FormData(); selectedIds.forEach((id) => fd.append('fee_ids', String(id))); fd.append('proof_file', proofFile); return fd })()
      : { fee_ids: selectedIds }
    const res = await api.payFee(selectedIds[0], body as FormData)
    if (!res.error) {
      setPaySuccess(true)
      setPayMsg(proofFile ? 'Przelew wysłany. Oczekuje na zatwierdzenie.' : 'Płatność zrealizowana!')
      setTimeout(() => { load(); setShowPay(false); setProofFile(null) }, 1500)
    } else {
      setPaySuccess(false)
      setPayMsg((res as { msg: string }).msg)
    }
  }

  if (loading) return <p className="text-text-muted">Ładowanie...</p>

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">Płatności</h1>
        <p className="text-sm text-text-muted">Monitoruj statusy opłat i wykonuj transakcje.</p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Summary card */}
      <Card>
        <CardContent className="flex items-center justify-between flex-wrap gap-4 py-5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-surface-container">
              <CreditCard size={24} className="text-secondary" />
            </div>
            <div>
              <p className="text-[0.65rem] uppercase tracking-wide text-text-muted font-semibold">Do zapłaty łącznie</p>
              <p className="text-2xl font-bold">
                {upcoming.length === 0 ? 'Brak zobowiązań' : `${upcoming.reduce((s, p) => s + parseFloat(p.amount?.replace(/[^\d.]/g, '') || '0'), 0).toFixed(2)} PLN`}
              </p>
              {upcoming.length > 0 && (
                <p className="text-xs text-text-muted mt-0.5">
                  Najbliższy termin: <strong>{fmt(upcoming.sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())[0]?.due_date)}</strong>
                </p>
              )}
            </div>
          </div>
          {upcoming.length > 0 && (
            <Button onClick={() => { setSelectedIds(upcoming.map((p) => p.id)); setShowPay(!showPay); setPayMsg('') }}>
              {showPay ? 'Ukryj opcje' : 'Zapłać za wszystko'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Upcoming payments */}
      <Card>
        <CardHeader><CardTitle>Bieżące zobowiązania</CardTitle></CardHeader>
        <CardContent className="p-0">
          {upcoming.length === 0 ? (
            <p className="p-5 text-sm text-text-muted">Brak nadchodzących płatności. Dobra robota!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tytuł</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Kwota</TableHead>
                  <TableHead>Termin</TableHead>
                  <TableHead>Akcja</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcoming.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-semibold">{p.title || p.fee_type || '-'}</TableCell>
                    <TableCell>{payBadge(p.status)}</TableCell>
                    <TableCell className="font-semibold">{p.amount} PLN</TableCell>
                    <TableCell className={p.status?.toLowerCase() === 'overdue' ? 'text-error font-semibold' : ''}>
                      {fmt(p.due_date)}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => { setSelectedIds([p.id]); setShowPay(true); setPayMsg('') }}>
                        Zapłać
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment options panel */}
      {showPay && (
        <Card>
          <CardHeader><CardTitle>Opcje płatności — {totalAmount} PLN</CardTitle></CardHeader>
          <CardContent>
            {payMsg && (
              <Alert variant={paySuccess ? 'success' : 'error'} className="mb-4">{payMsg}</Alert>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Traditional transfer */}
              <div className="flex flex-col gap-3">
                <h4 className="font-semibold text-sm">Przelew tradycyjny</h4>
                <div className="text-sm flex flex-col gap-1.5 bg-surface-low rounded-lg p-4">
                  <p><span className="text-text-muted">Kwota:</span> <strong>{totalAmount} PLN</strong></p>
                  <p><span className="text-text-muted">Odbiorca:</span> <strong>AGH</strong></p>
                  <p><span className="text-text-muted">Tytuł:</span> <strong className="break-all">{transferTitle}</strong></p>
                  <p className="text-xs text-text-muted mt-1">* Pamiętaj o dokładnym przepisaniu tytułu przelewu.</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-1">
                    Potwierdzenie przelewu (PDF/JPG)
                  </p>
                  <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                    onChange={(e) => setProofFile(e.target.files?.[0] ?? null)} />
                  {proofFile ? (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-success">✓ {proofFile.name}</span>
                      <button onClick={() => setProofFile(null)} className="text-error text-xs hover:underline cursor-pointer">Usuń</button>
                    </div>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
                      Wybierz plik
                    </Button>
                  )}
                </div>
                {proofFile && (
                  <Button onClick={doPayment}>Wyślij potwierdzenie przelewu</Button>
                )}
              </div>

              {/* Online payment */}
              <div className="flex flex-col gap-3">
                <h4 className="font-semibold text-sm">Płatność online</h4>
                <p className="text-sm text-text-muted">
                  Szybka płatność kartą, BLIK lub przelewem natychmiastowym.
                </p>
                <p className="text-sm"><span className="text-text-muted">Kwota do zapłaty:</span> <strong>{totalAmount} PLN</strong></p>
                <Button variant="success" onClick={doPayment}>Przejdź do płatności</Button>
                <p className="text-xs text-text-muted flex items-center gap-1">
                  <AlertTriangle size={12} /> Płatność online wymaga aktywnego systemu PayU.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><History size={16} />Historia transakcji</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {history.length === 0 ? (
            <p className="p-5 text-sm text-text-muted">Brak historii płatności.</p>
          ) : (
            <div className="flex flex-col divide-y divide-surface-high">
              {history.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div>
                    <p className="font-semibold">{p.title || p.fee_type || '-'}</p>
                    <p className="text-xs text-text-muted">ID: {p.id} • {fmt(p.paid_date)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold">{p.amount} PLN</span>
                    {payBadge(p.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
