import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { changePassword } from '@/services/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { UserCircle, LogOut, KeyRound } from 'lucide-react'

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrator systemu',
  STUDIES_DIRECTOR: 'Dyrektor kierunku',
  ADMINISTRATIVE_COORDINATOR: 'Koordynator administracyjny',
  FINANCE_COORDINATOR: 'Koordynator finansowy',
  CANDIDATE: 'Kandydat',
  STUDENT: 'Student',
}

export default function MyProfilePage() {
  const { user, logout } = useAuth()
  const [showPwChange, setShowPwChange] = useState(false)
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPw !== confirmPw) { setPwError('Nowe hasła nie są identyczne.'); return }
    if (newPw.length < 8) { setPwError('Hasło musi mieć co najmniej 8 znaków.'); return }
    setPwError(''); setLoading(true)
    try {
      await changePassword(oldPw, newPw)
      setPwSuccess(true)
      setOldPw(''); setNewPw(''); setConfirmPw('')
      setTimeout(() => { setPwSuccess(false); setShowPwChange(false) }, 2000)
    } catch (err) {
      setPwError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  const role = user.role?.toUpperCase()
  const roleLabel = ROLE_LABELS[role] ?? role
  const roleBadgeVariant = ['CANDIDATE'].includes(role) ? 'warning'
    : ['STUDENT'].includes(role) ? 'success'
    : ['ADMIN'].includes(role) ? 'danger'
    : 'info'

  const Field = ({ label, value }: { label: string; value?: string | null }) => (
    <div className="flex flex-col gap-0.5">
      <p className="text-[0.65rem] uppercase tracking-wide text-text-muted font-semibold">{label}</p>
      <p className="text-sm font-medium">{value || 'Brak danych'}</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">Mój profil</h1>
        <p className="text-sm text-text-muted">Zarządzaj danymi swojego konta.</p>
      </div>

      {/* Profile card */}
      <Card>
        <CardContent className="flex items-center gap-5 py-5">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center shrink-0">
            <UserCircle size={40} className="text-secondary" />
          </div>
          <div>
            <p className="text-xl font-bold">{user.first_name} {user.last_name}</p>
            <div className="mt-1">
              <Badge variant={roleBadgeVariant as 'warning' | 'success' | 'danger' | 'info'}>{roleLabel}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal data */}
      <Card>
        <CardHeader><CardTitle>Dane osobowe</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Field label="Imię" value={user.first_name} />
          <Field label="Nazwisko" value={user.last_name} />
          <Field label="Email" value={user.email} />
        </CardContent>
      </Card>

      {/* Password change */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><KeyRound size={16} />Zmiana hasła</CardTitle>
            <Button variant="secondary" size="sm" onClick={() => setShowPwChange(!showPwChange)}>
              {showPwChange ? 'Anuluj' : 'Zmień hasło'}
            </Button>
          </div>
        </CardHeader>
        {showPwChange && (
          <CardContent>
            {pwSuccess && <Alert variant="success" className="mb-4">Hasło zostało zmienione.</Alert>}
            {pwError && <Alert variant="error" className="mb-4">{pwError}</Alert>}
            <form onSubmit={handlePasswordChange} className="flex flex-col gap-3">
              <Input label="Obecne hasło" type="password" value={oldPw}
                onChange={(e) => setOldPw(e.target.value)} required />
              <Input label="Nowe hasło" type="password" value={newPw}
                onChange={(e) => setNewPw(e.target.value)} required />
              <Input label="Powtórz nowe hasło" type="password" value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)} required />
              <Button type="submit" disabled={loading} className="mt-1">
                {loading ? 'Zmienianie...' : 'Zapisz nowe hasło'}
              </Button>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Logout */}
      <Button variant="danger" onClick={logout} className="flex items-center gap-2 w-fit">
        <LogOut size={16} /> Wyloguj się
      </Button>
    </div>
  )
}
