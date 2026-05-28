import { useState } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { login } from '@/services/auth'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'

export default function LoginPage() {
  usePageTitle('Logowanie')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { refreshUser } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      await refreshUser()
      navigate(searchParams.get('redirect') || '/studies')
    } catch (err) {
      setError((err as Error).message || 'Błąd logowania. Spróbuj ponownie.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-[var(--color-surface-low)] px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-[var(--color-surface-high)] p-8">
        <div className="mb-6 text-center">
          <img src="/assets/logo.png" alt="AGH" className="h-12 mx-auto mb-4"
            onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
          <h1 className="text-2xl font-bold">Logowanie</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Zaloguj się na swoje konto</p>
        </div>

        {error && <Alert variant="error" className="mb-4">{error}</Alert>}

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Input label="Email" id="email" type="email" autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Hasło" id="password" type="password" autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit" disabled={loading} className="mt-2 w-full">
            {loading ? 'Logowanie...' : 'Zaloguj się'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          Nie masz konta?{' '}
          <Link to="/register" className="font-semibold text-[var(--color-primary)] hover:underline">
            Zarejestruj się
          </Link>
        </p>
      </div>
    </div>
  )
}
