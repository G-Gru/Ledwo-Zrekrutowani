import { usePageTitle } from '@/hooks/usePageTitle'
import { MapPin, Phone, Mail, Printer } from 'lucide-react'

export default function ContactPage() {
  usePageTitle('Kontakt')

  return (
    <div className="min-h-screen bg-surface-low px-4 py-10">
      <div className="max-w-5xl mx-auto">

        <h1 className="text-3xl font-bold mb-1">Kontakt</h1>
        <p className="text-sm text-text-muted" style={{ marginBottom: '1rem' }}>
          Skontaktuj się z nami w sprawie rekrutacji na studia podyplomowe.
        </p>

        <div className="bg-white rounded-2xl shadow-sm border border-surface-high overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ minHeight: '520px' }}>

            {/* Dane kontaktowe */}
            <div className="p-10 flex flex-col justify-between">
              <div className="flex flex-col gap-7">
                <div>
                  <h2 className="text-xl font-bold">Wydział Informatyki</h2>
                  <p className="text-sm text-text-muted mt-1">
                    Akademia Górniczo-Hutnicza im. Stanisława Staszica w Krakowie
                  </p>
                </div>

                <div className="flex flex-col gap-5">
                  <div className="flex gap-3">
                    <div className="mt-0.5 w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center shrink-0">
                      <MapPin size={15} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-0.5">Adres do korespondencji</p>
                      <p className="text-sm text-text-muted leading-relaxed">
                        al. A. Mickiewicza 30<br />30-059 Kraków
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="mt-0.5 w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center shrink-0">
                      <MapPin size={15} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-0.5">Adres siedziby Wydziału Informatyki</p>
                      <p className="text-sm text-text-muted leading-relaxed">
                        Budynek D17<br />ul. Kawiory 21<br />30-055 Kraków
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-surface-high flex flex-col gap-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-low flex items-center justify-center shrink-0">
                    <Phone size={14} className="text-text-muted" />
                  </div>
                  <span className="text-text-muted">podany przy każdym kierunku</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-low flex items-center justify-center shrink-0">
                    <Printer size={14} className="text-text-muted" />
                  </div>
                  <span className="text-text-muted">(12) 617-51-72</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-low flex items-center justify-center shrink-0">
                    <Mail size={14} className="text-text-muted" />
                  </div>
                  <a href="mailto:podyplomowe@informatyka.agh.edu.pl" className="text-primary hover:underline">
                    podyplomowe@informatyka.agh.edu.pl
                  </a>
                </div>
              </div>
            </div>

            {/* Mapa */}
            <div className="h-80 md:h-auto">
              <iframe
                title="Wydział Informatyki AGH"
                src="https://maps.google.com/maps?q=Kawiory+21,+30-055+Krak%C3%B3w&t=&z=16&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0, display: 'block', minHeight: '320px' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
