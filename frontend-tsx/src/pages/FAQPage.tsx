import { useState } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { ChevronDown } from 'lucide-react'

const FAQ_DATA = [
  {
    question: 'Jakie dokumenty są wymagane do zapisu na studia podyplomowe?',
    answer: 'Standardowo wymagane jest przesłanie skanu dyplomu ukończenia studiów wyższych, wypełnionego podania o przyjęcie wygenerowanego z systemu oraz zdjęcia dowodowego. Szczegółowa lista dokumentów pojawia się w panelu "Moje Dokumenty" po wybraniu konkretnego kierunku.',
  },
  {
    question: 'Czy muszę mieć wykształcenie informatyczne, żeby się zapisać?',
    answer: 'To zależy od kierunku. Część programów jest otwarta dla absolwentów dowolnych kierunków technicznych lub ścisłych, inne wymagają konkretnego przygotowania (np. programowania lub matematyki). Wymagania wstępne są podane w opisie każdego kierunku na stronie oferty.',
  },
  {
    question: 'W jaki sposób mogę uiścić opłatę rekrutacyjną?',
    answer: 'Opłatę należy wpłacić na indywidualny numer konta widoczny w zakładce "Płatności" po utworzeniu wniosku. W tytule przelewu prosimy podać imię, nazwisko oraz nazwę wybranego kierunku. Obsługujemy też płatności online za pomocą systemu PayU dostępnego w panelu "Płatności".',
  },
  {
    question: 'Czy studia podyplomowe na AGH są prowadzone stacjonarnie czy zdalnie?',
    answer: 'Większość kierunków realizowana jest w trybie hybrydowym - zjazdy odbywają się zazwyczaj w weekendy (sobota–niedziela) raz lub dwa razy w miesiącu na terenie kampusu AGH w Krakowie. Część zajęć, zwłaszcza wykłady, może być prowadzona online. Szczegółowy tryb podany jest w opisie każdego kierunku.',
  },
  {
    question: 'Ile trwają studia podyplomowe i ile mają punktów ECTS?',
    answer: 'Standardowy program trwa dwa semestry (ok. 9 miesięcy) i obejmuje minimum 60 punktów ECTS, co odpowiada wymogom ustawowym. Niektóre kierunki są trzysemestralne. Po ukończeniu i obronie pracy/projektu końcowego absolwent otrzymuje świadectwo ukończenia studiów podyplomowych AGH.',
  },
  {
    question: 'Czy dokumenty muszę dostarczyć osobiście?',
    answer: 'W pierwszym etapie rekrutacji wystarczą skany wgrane do systemu. Po zakwalifikowaniu się, oryginały dokumentów do wglądu (lub poświadczone kopie) należy dostarczyć do sekretariatu odpowiedniego wydziału przed rozpoczęciem zajęć.',
  },
  {
    question: 'Czy można się zapisać na więcej niż jeden kierunek jednocześnie?',
    answer: 'Tak, system pozwala złożyć wnioski na kilka kierunków równocześnie. Każdy wniosek rozpatrywany jest osobno. Pamiętaj jednak, że opłata rekrutacyjna pobierana jest od każdego złożonego wniosku, a czesne - od każdego kierunku, na który zostaniesz przyjęty.',
  },
  {
    question: 'Kiedy otrzymam informację o przyjęciu na studia?',
    answer: 'Decyzja o uruchomieniu studiów i przyjęciu kandydatów zapada po zakończeniu zbierania zgłoszeń i weryfikacji dokumentów. Status Twojego wniosku zmieni się w systemie, o czym zostaniesz powiadomiony mailowo. Orientacyjny czas oczekiwania to 2-4 tygodnie po zamknięciu edycji.',
  },
  {
    question: 'Co się stanie, jeśli kierunek nie zostanie uruchomiony z powodu zbyt małej liczby kandydatów?',
    answer: 'Jeśli liczba zakwalifikowanych kandydatów nie osiągnie progu wymaganego do uruchomienia edycji, kierunek nie zostanie otwarty w danym roku. W takim przypadku zostajesz niezwłocznie poinformowany mailowo, a wniesione opłaty są zwracane w całości na wskazane konto bankowe.',
  },
  {
    question: 'Czy mogę uzyskać fakturę za czesne (np. dla pracodawcy)?',
    answer: 'Tak. Po uiszczeniu opłaty możesz złożyć wniosek o wystawienie faktury VAT w sekretariacie wydziału lub mailowo na adres podany w zakładce Kontakt. Wymagane są dane firmy (NIP, pełna nazwa i adres). Faktura wystawiana jest w ciągu 7 dni roboczych.',
  },
]

export default function FAQPage() {
  usePageTitle('FAQ')
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-surface-low px-4 py-10">
      <div className="max-w-3xl mx-auto">

        <h1 className="text-3xl font-bold mb-3">Często zadawane pytania</h1>
        <p className="text-sm text-text-muted" style={{ marginBottom: '1rem' }}>
          Znajdź odpowiedzi na najczęściej pojawiające się pytania dotyczące rekrutacji na AGH.
        </p>

        <div className="bg-white rounded-2xl shadow-sm border border-surface-high overflow-hidden">
          {FAQ_DATA.map((item, i) => {
            const isOpen = openIndex === i
            return (
              <div key={i} className={i > 0 ? 'border-t border-surface-high' : ''}>
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left font-semibold text-sm hover:bg-surface-low transition-colors cursor-pointer"
                >
                  <span className="pr-4">{item.question}</span>
                  <ChevronDown
                    size={18}
                    className="shrink-0 text-text-muted transition-transform duration-300"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  />
                </button>

                {/* Grid trick - płynne otwieranie bez skoku szerokości */}
                <div
                  className="transition-all duration-300 overflow-hidden"
                  style={{ display: 'grid', gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 text-sm text-text-muted leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
