import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const FAQ_DATA = [
  {
    question: 'Jakie dokumenty są wymagane do zapisu na studia podyplomowe?',
    answer: 'Standardowo wymagane jest przesłanie skanu dyplomu ukończenia studiów wyższych, wypełnionego podania o przyjęcie wygenerowanego z systemu oraz zdjęcia dowodowego. Szczegółowa lista dokumentów pojawia się w panelu "Moje Dokumenty" po wybraniu konkretnego kierunku.',
  },
  {
    question: 'W jaki sposób mogę uiścić opłatę rekrutacyjną?',
    answer: 'Opłatę należy wpłacić na indywidualny numer konta widoczny w zakładce "Płatności" po utworzeniu wniosku. W tytule przelewu prosimy podać imię, nazwisko oraz nazwę wybranego kierunku. Obsługujemy też płatności online za pomocą systemu PayU dostępnego w panelu "Płatności".',
  },
  {
    question: 'Czy dokumenty muszę dostarczyć osobiście?',
    answer: 'W pierwszym etapie rekrutacji wystarczą skany wgrane do systemu. Po zakwalifikowaniu się, oryginały dokumentów do wglądu (lub poświadczone kopie) należy dostarczyć do sekretariatu odpowiedniego wydziału przed rozpoczęciem zajęć.',
  },
  {
    question: 'Kiedy otrzymam informację o przyjęciu na studia?',
    answer: 'Decyzja o uruchomieniu studiów i przyjęciu kandydatów zapada po zakończeniu zbierania zgłoszeń i weryfikacji dokumentów. Status Twojego wniosku zmieni się w systemie, o czym zostaniesz powiadomiony mailowo.',
  },
]

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">Często zadawane pytania</h1>
      <p className="text-[var(--color-text-muted)] mb-8">
        Znajdź odpowiedzi na najczęściej pojawiające się pytania dotyczące rekrutacji na AGH.
      </p>

      <div className="flex flex-col gap-2">
        {FAQ_DATA.map((item, i) => (
          <div
            key={i}
            className="border border-[var(--color-surface-high)] rounded-xl overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-low)] transition-colors cursor-pointer bg-white"
            >
              <span>{item.question}</span>
              {openIndex === i ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {openIndex === i && (
              <div className="px-5 py-4 text-[var(--color-text-muted)] text-sm leading-relaxed bg-[var(--color-surface-low)] border-t border-[var(--color-surface-high)]">
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
