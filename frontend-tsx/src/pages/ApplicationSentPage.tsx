import { Link } from 'react-router-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function ApplicationSentPage() {
  usePageTitle('Aplikacja Wysłana')
  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-surface-low px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-surface-high p-10 text-center flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-success-container flex items-center justify-center">
          <CheckCircle2 size={32} className="text-success" />
        </div>
        <h1 className="text-2xl font-bold">Wniosek wysłany!</h1>
        <p className="text-text-muted leading-relaxed">
          Twój wniosek rekrutacyjny został pomyślnie złożony. Możesz śledzić jego status w panelu "Moje wnioski".
        </p>
        <div className="flex gap-3 mt-2">
          <Link to="/my-applications">
            <Button>Moje wnioski</Button>
          </Link>
          <Link to="/studies">
            <Button variant="secondary">Oferty studiów</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
