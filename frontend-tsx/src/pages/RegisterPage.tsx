import { useState } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '@/services/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'

interface FormData {
  first_name: string; last_name: string; email: string; phone: string
  password: string; confirmPassword: string
}

export default function RegisterPage() {
  usePageTitle('Rejestracja')
  const navigate = useNavigate()
  const [form, setForm] = useState<FormData>({
    first_name: '', last_name: '', email: '', phone: '', password: '', confirmPassword: '',
  })
  const [consents, setConsents] = useState({ infoClause: false, gdpr: false, updates: false })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    if (type === 'checkbox') setConsents((p) => ({ ...p, [name]: checked }))
    else setForm((p) => ({ ...p, [name]: value }))
  }

  const validate = () => {
    if (!/\S+@\S+\.\S+/.test(form.email)) return 'Podaj poprawny adres email.'
    if (!/^\+?\d{9,12}$/.test(form.phone.trim())) return 'Niepoprawny numer telefonu (9–12 cyfr).'
    if (form.password !== form.confirmPassword) return 'Hasła nie są identyczne.'
    if (form.password.length < 8) return 'Hasło musi mieć co najmniej 8 znaków.'
    if (!consents.infoClause || !consents.gdpr) return 'Musisz zaakceptować wymagane zgody.'
    return null
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setError(''); setLoading(true)
    try {
      await register({ ...form, consents })
      navigate('/login')
    } catch (err) {
      setError((err as Error).message || 'Błąd rejestracji.')
    } finally {
      setLoading(false)
    }
  }

  const section = (title: string) => (
    <div className="text-xs font-semibold uppercase tracking-wider text-text-muted border-b border-surface-high pb-1 mt-6 mb-3">
      {title}
    </div>
  )

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-surface-low px-4 py-8">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-sm border border-surface-high p-8">
        <div className="mb-4 text-center">
          <img src="/assets/logo.png" alt="AGH" className="h-12 mx-auto mb-3"
            onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
          <h1 className="text-2xl font-bold">Rejestracja</h1>
          <p className="text-sm text-text-muted mt-1">Utwórz konto w systemie rekrutacji AGH</p>
        </div>

        <form onSubmit={onSubmit}>
          {section('Dane osobowe')}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Imię *" name="first_name" autoComplete="given-name"
              value={form.first_name} onChange={handleChange} required />
            <Input label="Nazwisko *" name="last_name" autoComplete="family-name"
              value={form.last_name} onChange={handleChange} required />
          </div>

          {section('Dane kontaktowe')}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Email *" name="email" type="email" autoComplete="email"
              value={form.email} onChange={handleChange} required />
            <Input label="Numer telefonu *" name="phone" type="tel" autoComplete="tel"
              placeholder="+48 123456789" value={form.phone} onChange={handleChange} required />
          </div>

          {section('Zabezpieczenia')}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Hasło *" name="password" type="password" autoComplete="new-password"
              value={form.password} onChange={handleChange} required />
            <Input label="Powtórz hasło *" name="confirmPassword" type="password" autoComplete="new-password"
              value={form.confirmPassword} onChange={handleChange} required />
          </div>

          {section('Zgody i regulaminy')}
          <div className="flex flex-col gap-3 text-sm">
            <label className="flex gap-3 cursor-pointer">
              <input type="checkbox" name="infoClause" checked={consents.infoClause} onChange={handleChange}
                className="mt-0.5 shrink-0" />
              <span className="text-text">
                <span className="text-error">* </span>
                Potwierdzam, że zapoznałem(am) się z treścią klauzuli informacyjnej i przyjmuję do wiadomości informacje w niej zawarte.
              </span>
            </label>
            <label className="flex gap-3 cursor-pointer">
              <input type="checkbox" name="gdpr" checked={consents.gdpr} onChange={handleChange}
                className="mt-0.5 shrink-0" />
              <span className="text-text">
                <span className="text-error">* </span>
                Wyrażam zgodę na przetwarzanie moich danych osobowych w ramach procesu rekrutacji zgodnie z RODO.
              </span>
            </label>
            <label className="flex gap-3 cursor-pointer">
              <input type="checkbox" name="updates" checked={consents.updates} onChange={handleChange}
                className="mt-0.5 shrink-0" />
              <span className="text-text-muted">
                Chcę otrzymywać wiadomości o szkoleniach i studiach podyplomowych AGH (opcjonalne).
              </span>
            </label>
          </div>

          {error && <Alert variant="error" className="mt-4">{error}</Alert>}

          <Button type="submit" disabled={loading} className="mt-6 w-full">
            {loading ? 'Rejestracja...' : 'Zarejestruj się'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-text-muted">
          Masz już konto?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Zaloguj się
          </Link>
        </p>
      </div>
    </div>
  )
}
