import { useEffect, useState } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { api, type AdminUser } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Plus, X } from 'lucide-react'

const ROLES = [
  { value: '', label: 'Wybierz rolę...' },
  { value: 'ADMINISTRATIVE_COORDINATOR', label: 'Koordynator administracyjny' },
  { value: 'FINANCE_COORDINATOR', label: 'Koordynator finansowy' },
  { value: 'STUDIES_DIRECTOR', label: 'Kierownik studiów' },
  { value: 'ADMIN', label: 'Administrator systemu' },
]

const ROLE_VARIANT: Record<string, string> = {
  ADMINISTRATIVE_COORDINATOR: 'info',
  FINANCE_COORDINATOR: 'warning',
  STUDIES_DIRECTOR: 'success',
  ADMIN: 'danger',
}

const ROLE_LABEL: Record<string, string> = {
  ADMINISTRATIVE_COORDINATOR: 'Koord. administracyjny',
  FINANCE_COORDINATOR: 'Koord. finansowy',
  STUDIES_DIRECTOR: 'Kierownik studiów',
  ADMIN: 'Administrator',
  UNASSIGNED_EMPLOYEE: 'Brak roli',
}

function generateRandom(length: number) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

const emptyForm = {
  first_name: '', last_name: '', email: '', password: '',
  role: '', academic_title: '',
}

export default function ManageEmployeesPage() {
  usePageTitle('Zarządzaj Pracownikami')
  const [employees, setEmployees] = useState<AdminUser[]>([])
  const [form, setForm] = useState<typeof emptyForm>(emptyForm)
  const [phones, setPhones] = useState<string[]>([''])
  const [autoEmail, setAutoEmail] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function fetchEmployees() {
    setLoading(true)
    const res = await api.getAdminEmployeesList()
    if (!res.error) setEmployees(res.data)
    else setError(res.msg)
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchEmployees() }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setError('')
    setForm(prev => {
      const updated = { ...prev, [name]: value }
      const first = (name === 'first_name' ? value : prev.first_name).trim().toLowerCase()
      const last = (name === 'last_name' ? value : prev.last_name).trim().toLowerCase()
      if (autoEmail && first && last) updated.email = `${first}.${last}@agh.edu.pl`
      if (name === 'first_name' || name === 'last_name') {
        if (last || (name === 'last_name' && value.trim())) {
          const l = (name === 'last_name' ? value : prev.last_name).trim().toLowerCase()
          updated.password = `${l}-${generateRandom(6)}`
        }
      }
      return updated
    })
  }

  function addPhone() { setPhones(p => [...p, '']) }
  function removePhone(i: number) { setPhones(p => p.filter((_, idx) => idx !== i)) }
  function setPhone(i: number, val: string) { setPhones(p => p.map((v, idx) => idx === i ? val : v)) }

  function resetForm() {
    setForm(emptyForm)
    setPhones([''])
    setError('')
    setSuccess('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!form.first_name || !form.last_name || !form.email || !form.password) {
      setError('Uzupełnij wszystkie wymagane pola.')
      return
    }
    if (!form.role) {
      setError('Wybierz rolę pracownika.')
      return
    }

    const validPhones = phones.filter(p => p.trim())
    const res = await api.createAdminEmployee({
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      password: form.password,
      role: form.role,
      academic_title: form.academic_title,
      work_phones: validPhones,
    })

    if (res.error) { setError(res.msg); return }

    setSuccess(`Konto utworzone pomyślnie.\nEmail: ${form.email}\nHasło: ${form.password}`)
    resetForm()
    fetchEmployees()
  }

  const selectClass = "w-full border border-[var(--color-outline)] rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Zarządzanie pracownikami</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Dodaj nowe konto pracownicze</CardTitle></CardHeader>
        <CardContent>
          {error && <Alert variant="error" className="mb-3" onClose={() => setError('')}>{error}</Alert>}
          {success && (
            <Alert variant="success" className="mb-3" onClose={() => setSuccess('')}>
              <strong>Konto zostało utworzone.</strong>
              <pre className="text-xs mt-1 whitespace-pre-wrap">{success}</pre>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Imię *</label>
                <Input name="first_name" value={form.first_name} onChange={handleChange} required />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Nazwisko *</label>
                <Input name="last_name" value={form.last_name} onChange={handleChange} required />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Tytuł naukowy</label>
                <Input name="academic_title" value={form.academic_title} onChange={handleChange} placeholder="np. dr, mgr inż." />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Rola *</label>
                <select name="role" value={form.role} onChange={handleChange} required className={selectClass}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Email służbowy *</label>
                <Input
                  name="email" type="email" value={form.email} onChange={handleChange}
                  disabled={autoEmail} required
                  className={autoEmail ? 'bg-[var(--color-surface-low)] opacity-70' : ''}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Hasło jednorazowe *</label>
                <Input
                  name="password" value={form.password} readOnly required
                  className="bg-[var(--color-surface-low)] opacity-70 font-mono text-xs"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={autoEmail} onChange={e => setAutoEmail(e.target.checked)} className="rounded" />
              Generuj automatyczny email (imie.nazwisko@agh.edu.pl)
            </label>

            {/* NUMERY TELEFONOW */}
            <div>
              <label className="block text-xs font-medium mb-2">Numery telefonów służbowych</label>
              <div className="space-y-2">
                {phones.map((phone, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      type="tel" value={phone} onChange={e => setPhone(i, e.target.value)}
                      placeholder="+48 600 000 000"
                      className="flex-1"
                    />
                    {phones.length > 1 && (
                      <button type="button" onClick={() => removePhone(i)} className="text-[var(--color-error)] hover:opacity-70 px-2">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={addPhone} className="mt-2 flex items-center gap-1 text-xs text-[var(--color-primary)] hover:opacity-70">
                <Plus size={12} /> Dodaj kolejny numer
              </button>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit">Utwórz konto</Button>
              <Button type="button" variant="secondary" onClick={resetForm}>Wyczyść</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Lista pracowników ({employees.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading && <p className="p-4 text-sm text-[var(--color-text-muted)]">Ładowanie...</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Imię i nazwisko</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rola</TableHead>
                <TableHead>Tytuł</TableHead>
                <TableHead>Telefony</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 && !loading && (
                <TableRow><TableCell colSpan={5} className="text-center text-[var(--color-text-muted)]">Brak pracowników do wyświetlenia.</TableCell></TableRow>
              )}
              {employees.map(emp => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">
                    {emp.academic_title && <span className="text-[var(--color-text-muted)] mr-1">{emp.academic_title}</span>}
                    {emp.first_name} {emp.last_name}
                  </TableCell>
                  <TableCell>{emp.email || '-'}</TableCell>
                  <TableCell>
                    {emp.role ? (
                      <Badge variant={ROLE_VARIANT[emp.role] as 'info' | 'warning' | 'success' | 'danger'}>
                        {ROLE_LABEL[emp.role] || emp.role}
                      </Badge>
                    ) : <span className="text-[var(--color-text-muted)] text-xs">Brak roli</span>}
                  </TableCell>
                  <TableCell>{emp.academic_title || '-'}</TableCell>
                  <TableCell>
                    {Array.isArray(emp.work_phones) && emp.work_phones.length > 0
                      ? emp.work_phones.map(w => w.phone).join(', ')
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
