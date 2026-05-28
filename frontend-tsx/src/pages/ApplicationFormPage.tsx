import { useEffect, useRef, useState } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api, type EditionDocument, type UserAddress, type DocItem } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { User, Mail, Home, GraduationCap, Phone, Upload, FileCheck } from 'lucide-react'

interface AddrFields {
  street: string; house: string; apartment: string; city: string; country: string; postalCode: string
}

interface FormFields {
  firstName: string; secondName: string; lastName: string; familyName: string; title: string
  birthdate: string; birthplace: string; pesel: string; citizenship: string
  email: string; phone: string
  residenceAddress: AddrFields
  correspondenceAddress: AddrFields
  educationUniversity: string; educationLocation: string; educationYear: string; maturityCountry: string
  emergencyName: string; emergencyLastName: string; emergencyPhone: string
  consents: { data: boolean; rules: boolean; rodo: boolean }
}

const emptyAddr = (): AddrFields => ({ street: '', house: '', apartment: '', city: '', country: 'Polska', postalCode: '' })
const emptyForm = (): FormFields => ({
  firstName: '', secondName: '', lastName: '', familyName: '', title: '',
  birthdate: '', birthplace: '', pesel: '', citizenship: 'Polska',
  email: '', phone: '',
  residenceAddress: emptyAddr(), correspondenceAddress: emptyAddr(),
  educationUniversity: '', educationLocation: '', educationYear: '', maturityCountry: 'Polska',
  emergencyName: '', emergencyLastName: '', emergencyPhone: '',
  consents: { data: false, rules: false, rodo: false },
})

const TITLE_OPTIONS = [
  { value: '', label: 'Wybierz...' }, { value: 'lic', label: 'Licencjat' },
  { value: 'inz', label: 'Inżynier' }, { value: 'mgr', label: 'Magister' },
  { value: 'mgr_inz', label: 'Magister Inżynier' }, { value: 'dr', label: 'Doktor' },
]

function SectionHead({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wide mt-6 mb-3 border-b border-(--color-outline) pb-1">
      {icon}{label}
    </div>
  )
}

function FieldErr({ msg }: { msg?: string }) {
  return msg ? <p className="text-error text-xs mt-1">{msg}</p> : null
}

export default function ApplicationFormPage() {
  usePageTitle('Formularz Aplikacji')
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editionId = searchParams.get('edition_id')

  const [form, setForm] = useState<FormFields>(emptyForm())
  const [files, setFiles] = useState<Record<number, File | null>>({})
  const [documents, setDocuments] = useState<EditionDocument[]>([])
  const [existingDocs, setExistingDocs] = useState<Record<number, DocItem>>({})
  const [enrollmentId, setEnrollmentId] = useState<number | null>(null)
  const [courseName, setCourseName] = useState('Nieznany kierunek')
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([])
  const [selectedResAddrId, setSelectedResAddrId] = useState<number | null>(null)
  const [hasDiffCorr, setHasDiffCorr] = useState(false)
  const [selectedCorrAddrId, setSelectedCorrAddrId] = useState<number | null>(null)
  const [hasEmergency, setHasEmergency] = useState(false)
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false)
  const [blockingStatus, setBlockingStatus] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (editionId) bootstrap() }, [editionId])

  async function bootstrap() {
    setLoading(true)
    try {
      const [editionRes, existingRes, prevRes, docsRes, addrRes] = await Promise.all([
        api.getEdition(editionId!),
        api.getExistingApplication(editionId!),
        api.getPreviousApplication(),
        api.getEditionDocuments(editionId!),
        api.getAddresses(),
      ])

      if (!editionRes.error) setCourseName(editionRes.data.name)
      if (!addrRes.error) setSavedAddresses(addrRes.data)
      if (!docsRes.error) setDocuments(docsRes.data.filter((d: EditionDocument) => !d.is_read_only))

      let merged = emptyForm()
      if (user) {
        merged = { ...merged, firstName: user.first_name || '', lastName: user.last_name || '', email: user.email || '' }
      }

      const src = !existingRes.error && existingRes.data ? existingRes.data
        : (!prevRes.error && prevRes.data ? { ...prevRes.data, enrollment: undefined } : null)

      if (src) {
        merged = {
          ...merged,
          firstName: src.first_name || merged.firstName,
          secondName: src.second_name || '',
          lastName: src.last_name || merged.lastName,
          familyName: src.family_name || '',
          title: src.academic_title || '',
          birthdate: src.birth_date || '',
          birthplace: src.birth_place || '',
          pesel: src.pesel || '',
          citizenship: src.citizenship || 'Polska',
          email: src.email || merged.email,
          phone: src.phone || '',
          educationUniversity: src.education_university || '',
          educationLocation: src.education_location || '',
          educationYear: src.education_year || '',
          maturityCountry: src.maturity_country || 'Polska',
          emergencyName: src.emergency_name || '',
          emergencyLastName: src.emergency_last_name || '',
          emergencyPhone: src.emergency_phone || '',
          consents: merged.consents,
          residenceAddress: emptyAddr(),
          correspondenceAddress: emptyAddr(),
        }

        if (src.emergency_name || src.emergency_last_name || src.emergency_phone) setHasEmergency(true)

        const resolveAddrFields = async (addrId: number): Promise<AddrFields | null> => {
          const saved = !addrRes.error ? addrRes.data.find((a: UserAddress) => a.id === addrId) : null
          const a = saved || (!addrRes.error ? null : (await api.getAddressById(addrId)).data)
          if (!a) return null
          return { street: a.street, house: a.house_number, apartment: a.flat_number || '', city: a.city, country: a.country, postalCode: a.postal_code }
        }

        if (src.residential_address) {
          const fields = await resolveAddrFields(src.residential_address as number)
          if (fields) { merged.residenceAddress = fields; setSelectedResAddrId(src.residential_address as number) }
        }

        if (src.registered_address && src.registered_address !== src.residential_address) {
          setHasDiffCorr(true)
          const fields = await resolveAddrFields(src.registered_address as number)
          if (fields) { merged.correspondenceAddress = fields; setSelectedCorrAddrId(src.registered_address as number) }
        }

        if (src.enrollment) {
          setEnrollmentId(src.enrollment)
          const enrollDocsRes = await api.getEnrollmentDocuments(src.enrollment)
          if (!enrollDocsRes.error) {
            const mapped: Record<number, DocItem> = {}
            enrollDocsRes.data.forEach((d: DocItem) => { if (d.studies_document?.id) mapped[d.studies_document.id] = d })
            setExistingDocs(mapped)
          }
        }
      }

      const enrollRes = await api.getMyEnrollments()
      if (!enrollRes.error) {
        const match = enrollRes.data.find(e => {
          const eid = typeof e.studies_edition === 'object' ? e.studies_edition.id : e.studies_edition
          return String(eid) === String(editionId)
        })
        if (match && match.status !== 'DRAFT') {
          setAlreadyEnrolled(true)
          setBlockingStatus(match.status)
        }
      }

      setForm(merged)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    section?: 'residenceAddress' | 'correspondenceAddress' | 'consents'
  ) {
    const { name, type } = e.target
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
    setSaved(false)
    if (section) {
      setForm(prev => ({ ...prev, [section]: { ...(prev[section] as object), [name]: newValue } }))
    } else {
      setForm(prev => ({ ...prev, [name]: newValue }))
    }
    if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n })
  }

  function selectSavedAddress(type: 'res' | 'corr', addr: UserAddress) {
    const fields: AddrFields = { street: addr.street, house: addr.house_number, apartment: addr.flat_number || '', city: addr.city, country: addr.country, postalCode: addr.postal_code }
    if (type === 'res') {
      setSelectedResAddrId(addr.id!)
      setForm(prev => ({ ...prev, residenceAddress: fields, ...(!hasDiffCorr ? { correspondenceAddress: fields } : {}) }))
    } else {
      setSelectedCorrAddrId(addr.id!)
      setForm(prev => ({ ...prev, correspondenceAddress: fields }))
    }
  }

  function isValidPesel(pesel: string): boolean {
    const w = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3]
    const d = pesel.split('').map(Number)
    return ((10 - (w.reduce((acc, wi, i) => acc + wi * d[i], 0) % 10)) % 10) === d[10]
  }

  function validate(isFinal: boolean): boolean {
    const errs: Record<string, string> = {}
    if (form.pesel) {
      if (!/^\d{11}$/.test(form.pesel)) errs.pesel = 'PESEL musi mieć 11 cyfr.'
      else if (!isValidPesel(form.pesel)) errs.pesel = 'PESEL jest niepoprawny.'
    }
    if (form.phone && form.phone.length < 9) errs.phone = 'Numer telefonu jest za krótki.'
    if (form.educationYear && !/^\d{4}$/.test(form.educationYear)) errs.educationYear = 'Rok zakończenia jest niepoprawny.'
    if (form.residenceAddress.postalCode && !/^\d{2}-\d{3}$/.test(form.residenceAddress.postalCode)) errs.residenceAddress_postalCode = 'Błędny kod pocztowy.'
    if (hasDiffCorr && form.correspondenceAddress.postalCode && !/^\d{2}-\d{3}$/.test(form.correspondenceAddress.postalCode)) errs.correspondenceAddress_postalCode = 'Błędny kod pocztowy.'
    if (isFinal) {
      if (!form.consents.data) errs.data = 'Musisz potwierdzić poprawność danych.'
      if (!form.consents.rules) errs.rules = 'Musisz zaakceptować regulamin.'
      if (!form.consents.rodo) errs.rodo = 'Zgoda RODO jest wymagana.'
      documents.forEach(doc => {
        if (doc.required && !files[doc.id] && !existingDocs[doc.id]) errs[`doc_${doc.id}`] = `${doc.name} jest wymagany.`
      })
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function resolveAddr(fields: AddrFields): Promise<number | null> {
    const payload: UserAddress = {
      street: fields.street || 'Brak danych', house_number: fields.house || '0',
      flat_number: fields.apartment || '', city: fields.city || 'Brak danych',
      country: fields.country || 'Polska', postal_code: fields.postalCode || '00-000'
    }
    const existing = await api.getAddresses()
    if (!existing.error) {
      const match = existing.data.find(a => a.street === payload.street && a.house_number === payload.house_number && a.city === payload.city && a.postal_code === payload.postal_code)
      if (match?.id) return match.id
    }
    const created = await api.addAddress(payload)
    return created.error ? null : (created.data.id ?? null)
  }

  async function submitForm(action: 'SAVE' | 'ENROLL') {
    setError(null)
    if (alreadyEnrolled) { setError('Jesteś już zapisany na ten kierunek.'); return }
    if (!validate(action === 'ENROLL')) return

    setSaving(true)
    try {
      const resId = await resolveAddr(form.residenceAddress)
      const corrId = hasDiffCorr ? await resolveAddr(form.correspondenceAddress) : resId

      const fd = new FormData()
      fd.append('action', action)
      fd.append('first_name', form.firstName)
      fd.append('second_name', form.secondName)
      fd.append('last_name', form.lastName)
      fd.append('family_name', form.familyName)
      fd.append('academic_title', form.title)
      fd.append('birth_place', form.birthplace)
      fd.append('birth_date', form.birthdate)
      fd.append('pesel', form.pesel)
      fd.append('citizenship', form.citizenship)
      fd.append('email', form.email)
      fd.append('phone', form.phone)
      if (resId) fd.append('residential_address', String(resId))
      if (corrId) fd.append('registered_address', String(corrId))
      fd.append('education_university', form.educationUniversity)
      fd.append('education_year', form.educationYear)
      fd.append('education_location', form.educationLocation)
      fd.append('maturity_country', form.maturityCountry)
      fd.append('emergency_name', hasEmergency ? form.emergencyName : '')
      fd.append('emergency_last_name', hasEmergency ? form.emergencyLastName : '')
      fd.append('emergency_phone', hasEmergency ? form.emergencyPhone : '')
      Object.entries(files).forEach(([docId, file]) => {
        if (file) { fd.append('files_ids', docId); fd.append('files_uploads', file) }
      })

      const res = await api.submitEnrollmentForm(editionId!, fd, enrollmentId === null)
      if (res.error) { setError(`Błąd: ${res.msg}`); return }

      if (res.data?.enrollment) setEnrollmentId(res.data.enrollment)
      if (action === 'ENROLL') navigate(`/applicationSent?edition_id=${editionId}`)
      else { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    } catch {
      setError('Błąd komunikacji z serwerem.')
    } finally {
      setSaving(false)
    }
  }

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full"><CardContent className="pt-6">
        <Alert variant="warning">Musisz być zalogowany, żeby złożyć wniosek.</Alert>
        <Button className="mt-4 w-full" onClick={() => navigate(`/login?redirect=${encodeURIComponent(window.location.href)}`)}>Zaloguj się</Button>
      </CardContent></Card>
    </div>
  )

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-text-muted">Ładowanie formularza...</p>
    </div>
  )

  const errList = Object.values(errors)

  return (
    <div className="min-h-screen bg-surface-low py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Wniosek o rekrutację na studia podyplomowe</CardTitle>
            <p className="text-sm text-text-muted font-medium uppercase tracking-wide mt-1">{courseName}</p>
          </CardHeader>
          <CardContent>
            {alreadyEnrolled && (
              <Alert variant="warning" className="mb-4">
                <strong>Już uczestniczysz w rekrutacji do tego kierunku.</strong>
                {blockingStatus && (
                  <span className="ml-1">Status: <strong>{{
                    CANDIDATE: 'Kandydat',
                    STUDENT: 'Student',
                    RESERVE: 'Kandydat rezerwowy',
                    REJECTED: 'Odrzucony',
                    EXPELLED: 'Wydalony',
                  }[blockingStatus] ?? blockingStatus}</strong></span>
                )}
              </Alert>
            )}

            {/* DANE OSOBOWE */}
            <SectionHead icon={<User size={14} />} label="Dane osobowe" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium mb-1">Imię *</label><Input name="firstName" value={form.firstName} onChange={handleChange} autoComplete="given-name" /></div>
              <div><label className="block text-xs font-medium mb-1">Drugie imię</label><Input name="secondName" value={form.secondName} onChange={handleChange} /></div>
              <div><label className="block text-xs font-medium mb-1">Nazwisko *</label><Input name="lastName" value={form.lastName} onChange={handleChange} autoComplete="family-name" /></div>
              <div><label className="block text-xs font-medium mb-1">Nazwisko rodowe *</label><Input name="familyName" value={form.familyName} onChange={handleChange} /></div>
              <div>
                <label className="block text-xs font-medium mb-1">Tytuł *</label>
                <select name="title" value={form.title} onChange={handleChange} className="w-full border border-(--color-outline) rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary">
                  {TITLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div><label className="block text-xs font-medium mb-1">Obywatelstwo *</label><Input name="citizenship" value={form.citizenship} onChange={handleChange} /></div>
              <div><label className="block text-xs font-medium mb-1">Data urodzenia *</label><Input type="date" name="birthdate" value={form.birthdate} onChange={handleChange} autoComplete="bday" /></div>
              <div><label className="block text-xs font-medium mb-1">Miejsce urodzenia *</label><Input name="birthplace" value={form.birthplace} onChange={handleChange} /></div>
              <div>
                <label className="block text-xs font-medium mb-1">PESEL *</label>
                <Input name="pesel" value={form.pesel} onChange={handleChange} inputMode="numeric" maxLength={11} className={errors.pesel ? 'border-error' : ''} />
                <FieldErr msg={errors.pesel} />
              </div>
            </div>

            {/* KONTAKTOWE */}
            <SectionHead icon={<Mail size={14} />} label="Dane kontaktowe" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium mb-1">Email *</label><Input type="email" name="email" value={form.email} onChange={handleChange} autoComplete="email" /></div>
              <div>
                <label className="block text-xs font-medium mb-1">Telefon *</label>
                <Input type="tel" name="phone" value={form.phone} onChange={handleChange} autoComplete="tel" className={errors.phone ? 'border-error' : ''} />
                <FieldErr msg={errors.phone} />
              </div>
            </div>

            {/* ADRES ZAMIESZKANIA */}
            <SectionHead icon={<Home size={14} />} label="Adres zamieszkania" />
            {savedAddresses.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {savedAddresses.map(a => (
                  <button key={a.id} type="button" onClick={() => selectSavedAddress('res', a)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${selectedResAddrId === a.id ? 'bg-primary-container border-primary text-primary' : 'border-(--color-outline) hover:bg-surface-low'}`}>
                    {a.street} {a.house_number}, {a.city}
                  </button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium mb-1">Ulica *</label><Input name="street" value={form.residenceAddress.street} onChange={e => handleChange(e, 'residenceAddress')} /></div>
              <div><label className="block text-xs font-medium mb-1">Numer domu *</label><Input name="house" value={form.residenceAddress.house} onChange={e => handleChange(e, 'residenceAddress')} /></div>
              <div><label className="block text-xs font-medium mb-1">Numer mieszkania</label><Input name="apartment" value={form.residenceAddress.apartment} onChange={e => handleChange(e, 'residenceAddress')} /></div>
              <div>
                <label className="block text-xs font-medium mb-1">Kod pocztowy *</label>
                <Input name="postalCode" value={form.residenceAddress.postalCode} onChange={e => handleChange(e, 'residenceAddress')} inputMode="numeric" maxLength={6} className={errors.residenceAddress_postalCode ? 'border-error' : ''} />
                <FieldErr msg={errors.residenceAddress_postalCode} />
              </div>
              <div><label className="block text-xs font-medium mb-1">Miasto *</label><Input name="city" value={form.residenceAddress.city} onChange={e => handleChange(e, 'residenceAddress')} /></div>
              <div><label className="block text-xs font-medium mb-1">Kraj *</label><Input name="country" value={form.residenceAddress.country} onChange={e => handleChange(e, 'residenceAddress')} /></div>
            </div>

            <label className="flex items-center gap-2 mt-3 cursor-pointer text-sm">
              <input type="checkbox" checked={hasDiffCorr} onChange={e => {
                setHasDiffCorr(e.target.checked)
                if (!e.target.checked) setForm(prev => ({ ...prev, correspondenceAddress: { ...prev.residenceAddress } }))
              }} className="rounded" />
              Adres korespondencyjny jest inny niż zamieszkania
            </label>

            {hasDiffCorr && <>
              <SectionHead icon={<Home size={14} />} label="Adres korespondencyjny" />
              {savedAddresses.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {savedAddresses.map(a => (
                    <button key={a.id} type="button" onClick={() => selectSavedAddress('corr', a)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${selectedCorrAddrId === a.id ? 'bg-primary-container border-primary text-primary' : 'border-(--color-outline) hover:bg-surface-low'}`}>
                      {a.street} {a.house_number}, {a.city}
                    </button>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium mb-1">Ulica *</label><Input name="street" value={form.correspondenceAddress.street} onChange={e => handleChange(e, 'correspondenceAddress')} /></div>
                <div><label className="block text-xs font-medium mb-1">Numer domu *</label><Input name="house" value={form.correspondenceAddress.house} onChange={e => handleChange(e, 'correspondenceAddress')} /></div>
                <div><label className="block text-xs font-medium mb-1">Numer mieszkania</label><Input name="apartment" value={form.correspondenceAddress.apartment} onChange={e => handleChange(e, 'correspondenceAddress')} /></div>
                <div>
                  <label className="block text-xs font-medium mb-1">Kod pocztowy *</label>
                  <Input name="postalCode" value={form.correspondenceAddress.postalCode} onChange={e => handleChange(e, 'correspondenceAddress')} inputMode="numeric" maxLength={6} className={errors.correspondenceAddress_postalCode ? 'border-error' : ''} />
                  <FieldErr msg={errors.correspondenceAddress_postalCode} />
                </div>
                <div><label className="block text-xs font-medium mb-1">Miasto *</label><Input name="city" value={form.correspondenceAddress.city} onChange={e => handleChange(e, 'correspondenceAddress')} /></div>
                <div><label className="block text-xs font-medium mb-1">Kraj *</label><Input name="country" value={form.correspondenceAddress.country} onChange={e => handleChange(e, 'correspondenceAddress')} /></div>
              </div>
            </>}

            {/* WYKSZTALCENIE */}
            <SectionHead icon={<GraduationCap size={14} />} label="Wykształcenie" />
            <p className="text-xs text-text-muted mb-2">* dane pobierane tylko dla celów statystycznych</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium mb-1">Nazwa uczelni wyższej *</label><Input name="educationUniversity" value={form.educationUniversity} onChange={handleChange} /></div>
              <div><label className="block text-xs font-medium mb-1">Lokalizacja *</label><Input name="educationLocation" value={form.educationLocation} onChange={handleChange} /></div>
              <div>
                <label className="block text-xs font-medium mb-1">Rok zakończenia *</label>
                <Input name="educationYear" value={form.educationYear} onChange={handleChange} inputMode="numeric" maxLength={4} className={errors.educationYear ? 'border-error' : ''} />
                <FieldErr msg={errors.educationYear} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Miejsce uzyskania świadectwa dojrzałości *</label>
                <select name="maturityCountry" value={form.maturityCountry} onChange={handleChange} className="w-full border border-(--color-outline) rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="Polska">Polska</option>
                  <option value="Poza Polską">Poza Polską</option>
                </select>
              </div>
            </div>

            {/* KONTAKT AWARYJNY */}
            <SectionHead icon={<Phone size={14} />} label="Kontakt awaryjny" />
            <label className="flex items-center gap-2 mb-3 cursor-pointer text-sm">
              <input type="checkbox" checked={hasEmergency} onChange={e => {
                setHasEmergency(e.target.checked)
                if (!e.target.checked) setForm(prev => ({ ...prev, emergencyName: '', emergencyLastName: '', emergencyPhone: '' }))
              }} className="rounded" />
              Chcę dodać kontakt awaryjny
            </label>
            {hasEmergency && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="block text-xs font-medium mb-1">Imię kontaktu</label><Input name="emergencyName" value={form.emergencyName} onChange={handleChange} /></div>
                <div><label className="block text-xs font-medium mb-1">Nazwisko kontaktu</label><Input name="emergencyLastName" value={form.emergencyLastName} onChange={handleChange} /></div>
                <div><label className="block text-xs font-medium mb-1">Telefon kontaktu</label><Input type="tel" name="emergencyPhone" value={form.emergencyPhone} onChange={handleChange} /></div>
              </div>
            )}

            {/* DOKUMENTY */}
            {documents.length > 0 && <>
              <SectionHead icon={<Upload size={14} />} label="Dokumenty" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {documents.map(doc => {
                  const hasExisting = !!existingDocs[doc.id]
                  const hasNew = !!files[doc.id]
                  return (
                    <div key={doc.id} className={`border rounded-lg p-3 text-sm ${errors[`doc_${doc.id}`] ? 'border-error' : 'border-(--color-outline)'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <FileCheck size={14} className={hasExisting || hasNew ? 'text-success' : 'text-text-muted'} />
                        <span className="font-medium">{doc.name}{doc.required && <span className="text-error ml-1">*</span>}</span>
                      </div>
                      {hasExisting && !hasNew && <p className="text-xs text-success mb-2">Poprzednio przesłany</p>}
                      {hasNew && <p className="text-xs text-success mb-2">Wybrany: {files[doc.id]?.name}</p>}
                      <input ref={el => { fileInputRefs.current[doc.id] = el }} type="file" accept=".pdf,.doc,.docx" className="hidden"
                        onChange={e => { const f = e.target.files?.[0] || null; setFiles(prev => ({ ...prev, [doc.id]: f })); setSaved(false) }} />
                      <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRefs.current[doc.id]?.click()}>
                        {hasNew || hasExisting ? 'Zmień plik' : 'Wybierz plik'}
                      </Button>
                      <FieldErr msg={errors[`doc_${doc.id}`]} />
                    </div>
                  )
                })}
              </div>
            </>}

            {/* ZGODY */}
            <SectionHead icon={<FileCheck size={14} />} label="Zgody i regulaminy" />
            <div className="space-y-3">
              <div>
                <label className="flex items-start gap-3 cursor-pointer text-sm">
                  <input type="checkbox" name="data" checked={form.consents.data} onChange={e => handleChange(e, 'consents')} className="mt-0.5 rounded shrink-0" />
                  <span><span className="text-error">*</span> Potwierdzam, że wszystkie podane powyżej dane są zgodne z prawdą.</span>
                </label>
                <FieldErr msg={errors.data} />
              </div>
              <div>
                <label className="flex items-start gap-3 cursor-pointer text-sm">
                  <input type="checkbox" name="rules" checked={form.consents.rules} onChange={e => handleChange(e, 'consents')} className="mt-0.5 rounded shrink-0" />
                  <span>
                    <span className="text-error">*</span> Potwierdzam, że zapoznałem się z treścią regulaminu studiów AGH.{' '}
                    <a href="/assets/dokumenty/regulamin-studiow-podyplomowych-agh.pdf" target="_blank" rel="noopener noreferrer" className="text-primary underline">Pełna treść</a>
                  </span>
                </label>
                <FieldErr msg={errors.rules} />
              </div>
              <div>
                <label className="flex items-start gap-3 cursor-pointer text-sm">
                  <input type="checkbox" name="rodo" checked={form.consents.rodo} onChange={e => handleChange(e, 'consents')} className="mt-0.5 rounded shrink-0" />
                  <span>
                    <span className="text-error">*</span> Wyrażam zgodę na przetwarzanie moich danych osobowych w ramach procesu rekrutacji na studia.{' '}
                    <a href="/assets/dokumenty/zgoda_na_przetwarzanie_danych_osobowych.pdf" target="_blank" rel="noopener noreferrer" className="text-primary underline">Pełna treść</a>
                  </span>
                </label>
                <FieldErr msg={errors.rodo} />
              </div>
            </div>

            {errList.length > 0 && (
              <Alert variant="error" className="mt-4">
                <strong>Formularz zawiera błędy:</strong>
                <ul className="list-disc list-inside mt-1">{errList.map((e, i) => <li key={i}>{e}</li>)}</ul>
              </Alert>
            )}
            {error && <Alert variant="error" className="mt-4">{error}</Alert>}

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-(--color-outline)">
              <Button type="button" variant="secondary" disabled={saving || alreadyEnrolled}
                onClick={() => submitForm('SAVE')}>
                {saved ? 'Zapisano!' : saving ? 'Zapisywanie...' : 'Zapisz formularz'}
              </Button>
              <Button type="button" disabled={saving || alreadyEnrolled}
                onClick={() => submitForm('ENROLL')}>
                {saving ? 'Wysyłanie...' : 'Wyślij wniosek'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
