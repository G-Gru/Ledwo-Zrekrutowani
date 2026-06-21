import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import { api, type EditionDocument, type UserAddress, type DocItem } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { User, Mail, Home, GraduationCap, Phone, Upload, FileCheck } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddrFields {
  street: string
  house: string
  apartment: string
  city: string
  country: string
  postalCode: string
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

// ─── Constants ────────────────────────────────────────────────────────────────

const emptyAddr = (): AddrFields => ({
  street: '', house: '', apartment: '', city: '', country: 'Polska', postalCode: '',
})

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
  { value: '', label: 'Wybierz...' },
  { value: 'lic', label: 'Licencjat' },
  { value: 'inz', label: 'Inżynier' },
  { value: 'mgr', label: 'Magister' },
  { value: 'mgr_inz', label: 'Magister Inżynier' },
  { value: 'dr', label: 'Doktor' },
]


// ─── Small UI helpers ─────────────────────────────────────────────────────────

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

// ─── AddressBlock — reusable address form section ─────────────────────────────

function AddressBlock({
  label, fields, savedAddresses, selectedId, postalCodeError, onChange, onSelect,
}: {
  label: string
  fields: AddrFields
  savedAddresses: UserAddress[]
  selectedId: number | null
  postalCodeError?: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSelect: (addr: UserAddress) => void
}) {
  return (
    <>
      <SectionHead icon={<Home size={14} />} label={label} />
      {savedAddresses.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {savedAddresses.map(a => (
            <button
              key={a.id} type="button" onClick={() => onSelect(a)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                selectedId === a.id
                  ? 'bg-primary-container border-primary text-primary'
                  : 'border-(--color-outline) hover:bg-surface-low'
              }`}
            >
              {a.street} {a.house_number}, {a.city}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="block text-xs font-medium mb-1">Ulica *</label><Input name="street" value={fields.street} onChange={onChange} /></div>
        <div><label className="block text-xs font-medium mb-1">Numer domu *</label><Input name="house" value={fields.house} onChange={onChange} /></div>
        <div><label className="block text-xs font-medium mb-1">Numer mieszkania</label><Input name="apartment" value={fields.apartment} onChange={onChange} /></div>
        <div>
          <label className="block text-xs font-medium mb-1">Kod pocztowy *</label>
          <Input name="postalCode" value={fields.postalCode} onChange={onChange} inputMode="numeric" maxLength={6} className={postalCodeError ? 'border-error' : ''} />
          <FieldErr msg={postalCodeError} />
        </div>
        <div><label className="block text-xs font-medium mb-1">Miasto *</label><Input name="city" value={fields.city} onChange={onChange} /></div>
        <div><label className="block text-xs font-medium mb-1">Kraj *</label><Input name="country" value={fields.country} onChange={onChange} /></div>
      </div>
    </>
  )
}

// ─── useApplicationForm hook ───────────────────────────────────────────────────

function useApplicationForm(editionId: string | null) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState<FormFields>(emptyForm())
  const [files, setFiles] = useState<Record<number, File | null>>({})
  const [documents, setDocuments] = useState<EditionDocument[]>([])
  const [existingDocs, setExistingDocs] = useState<Record<number, DocItem>>({})
  const [enrollmentId, setEnrollmentId] = useState<number | null>(null)
  const [courseName, setCourseName] = useState('Nieznany kierunek')
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([])
  const [selectedResAddrId, setSelectedResAddrId] = useState<number | null>(null)
  const [selectedCorrAddrId, setSelectedCorrAddrId] = useState<number | null>(null)
  const [hasDiffCorr, setHasDiffCorr] = useState(false)
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
  useEffect(() => { if (editionId) load() }, [editionId])

  async function resolveAddrFields(addrId: number, addresses: UserAddress[]): Promise<AddrFields | null> {
    const saved = addresses.find(a => a.id === addrId)
    const a = saved ?? (await api.getAddressById(addrId)).data
    if (!a) return null
    return { street: a.street, house: a.house_number, apartment: a.flat_number || '', city: a.city, country: a.country, postalCode: a.postal_code }
  }

  async function load() {
    setLoading(true)
    try {
      const [editionRes, existingRes, prevRes, docsRes, addrRes] = await Promise.all([
        api.getEdition(editionId!),
        api.getExistingApplication(editionId!),
        api.getPreviousApplication(),
        api.getEditionDocuments(editionId!),
        api.getAddresses(),
      ])

      const addresses: UserAddress[] = addrRes.error ? [] : addrRes.data
      if (!editionRes.error) setCourseName(editionRes.data.name)
      setSavedAddresses(addresses)
      if (!docsRes.error) setDocuments(docsRes.data.filter((d: EditionDocument) => !d.is_read_only))

      const src = (!existingRes.error && existingRes.data)
        ? existingRes.data
        : (!prevRes.error && prevRes.data ? { ...prevRes.data, enrollment: undefined } : null)

      let merged: FormFields = {
        ...emptyForm(),
        firstName: user?.first_name || '',
        lastName: user?.last_name || '',
        email: user?.email || '',
      }

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
          consents: emptyForm().consents,
          residenceAddress: emptyAddr(),
          correspondenceAddress: emptyAddr(),
        }

        if (src.emergency_name || src.emergency_last_name || src.emergency_phone) setHasEmergency(true)

        if (src.residential_address) {
          const fields = await resolveAddrFields(src.residential_address as number, addresses)
          if (fields) { merged.residenceAddress = fields; setSelectedResAddrId(src.residential_address as number) }
        }
        if (src.registered_address && src.registered_address !== src.residential_address) {
          setHasDiffCorr(true)
          const fields = await resolveAddrFields(src.registered_address as number, addresses)
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
        const match = enrollRes.data.find((e: { studies_edition: number | { id: number }; status: string }) => {
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
    section?: 'residenceAddress' | 'correspondenceAddress' | 'consents',
  ) {
    const { name, type } = e.target
    const value = type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
    setSaved(false)
    setForm(prev =>
      section
        ? { ...prev, [section]: { ...(prev[section] as object), [name]: value } }
        : { ...prev, [name]: value }
    )
    if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n })
  }

  function selectSavedAddress(type: 'res' | 'corr', addr: UserAddress) {
    const fields: AddrFields = {
      street: addr.street, house: addr.house_number, apartment: addr.flat_number || '',
      city: addr.city, country: addr.country, postalCode: addr.postal_code,
    }
    if (type === 'res') {
      setSelectedResAddrId(addr.id!)
      setForm(prev => ({ ...prev, residenceAddress: fields, ...(!hasDiffCorr ? { correspondenceAddress: fields } : {}) }))
    } else {
      setSelectedCorrAddrId(addr.id!)
      setForm(prev => ({ ...prev, correspondenceAddress: fields }))
    }
  }

  function isValidPesel(pesel: string) {
    const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3]
    const digits = pesel.split('').map(Number)
    return ((10 - (weights.reduce((acc, w, i) => acc + w * digits[i], 0) % 10)) % 10) === digits[10]
  }

  function validate(isFinal: boolean): boolean {
    const errs: Record<string, string> = {}
    if (form.pesel) {
      if (!/^\d{11}$/.test(form.pesel)) errs.pesel = 'PESEL musi mieć 11 cyfr.'
      else if (!isValidPesel(form.pesel)) errs.pesel = 'PESEL jest niepoprawny.'
    }
    if (form.phone && form.phone.length < 9) errs.phone = 'Numer telefonu jest za krótki.'
    if (form.educationYear && !/^\d{4}$/.test(form.educationYear)) errs.educationYear = 'Rok zakończenia jest niepoprawny.'
    if (form.residenceAddress.postalCode && !/^\d{2}-\d{3}$/.test(form.residenceAddress.postalCode))
      errs.residenceAddress_postalCode = 'Błędny kod pocztowy.'
    if (hasDiffCorr && form.correspondenceAddress.postalCode && !/^\d{2}-\d{3}$/.test(form.correspondenceAddress.postalCode))
      errs.correspondenceAddress_postalCode = 'Błędny kod pocztowy.'
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
      country: fields.country || 'Polska', postal_code: fields.postalCode || '00-000',
    }
    const existing = await api.getAddresses()
    if (!existing.error) {
      const match = existing.data.find((a: UserAddress) =>
        a.street === payload.street && a.house_number === payload.house_number &&
        a.city === payload.city && a.postal_code === payload.postal_code
      )
      if (match?.id) return match.id
    }
    const created = await api.addAddress(payload)
    return created.error ? null : (created.data.id ?? null)
  }

  async function submitForm(action: 'SAVE' | 'ENROLL') {
    setError(null)
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

  return {
    form, setForm, files, setFiles, documents, existingDocs,
    courseName, savedAddresses, selectedResAddrId, selectedCorrAddrId,
    hasDiffCorr, setHasDiffCorr, hasEmergency, setHasEmergency,
    alreadyEnrolled, blockingStatus, errors, error, saving, saved, loading,
    fileInputRefs, handleChange, selectSavedAddress, submitForm,
  }
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function ApplicationFormPage() {
  usePageTitle('Formularz Aplikacji')
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editionId = searchParams.get('edition_id')

  const f = useApplicationForm(editionId)

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full"><CardContent className="pt-6">
        <Alert variant="warning">Musisz być zalogowany, żeby złożyć wniosek.</Alert>
        <Button className="mt-4 w-full" onClick={() => navigate(`/login?redirect=${encodeURIComponent(window.location.href)}`)}>
          Zaloguj się
        </Button>
      </CardContent></Card>
    </div>
  )

  if (user.is_employee) return <Navigate to="/studies" replace />
  if (f.loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-text-muted">Ładowanie formularza...</p></div>
  if (f.alreadyEnrolled) return <Navigate to="/my-applications" replace />

  const errList = Object.values(f.errors)

  return (
    <div className="min-h-screen bg-surface-low py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Wniosek o rekrutację na studia podyplomowe</CardTitle>
            <p className="text-sm text-text-muted font-medium uppercase tracking-wide mt-1">{f.courseName}</p>
          </CardHeader>
          <CardContent>

            {/* DANE OSOBOWE */}
            <SectionHead icon={<User size={14} />} label="Dane osobowe" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium mb-1">Imię *</label><Input name="firstName" value={f.form.firstName} onChange={f.handleChange} autoComplete="given-name" /></div>
              <div><label className="block text-xs font-medium mb-1">Drugie imię</label><Input name="secondName" value={f.form.secondName} onChange={f.handleChange} /></div>
              <div><label className="block text-xs font-medium mb-1">Nazwisko *</label><Input name="lastName" value={f.form.lastName} onChange={f.handleChange} autoComplete="family-name" /></div>
              <div><label className="block text-xs font-medium mb-1">Nazwisko rodowe *</label><Input name="familyName" value={f.form.familyName} onChange={f.handleChange} /></div>
              <div>
                <label className="block text-xs font-medium mb-1">Tytuł *</label>
                <select name="title" value={f.form.title} onChange={f.handleChange} className="w-full border border-(--color-outline) rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary">
                  {TITLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div><label className="block text-xs font-medium mb-1">Obywatelstwo *</label><Input name="citizenship" value={f.form.citizenship} onChange={f.handleChange} /></div>
              <div><label className="block text-xs font-medium mb-1">Data urodzenia *</label><Input type="date" name="birthdate" value={f.form.birthdate} onChange={f.handleChange} autoComplete="bday" /></div>
              <div><label className="block text-xs font-medium mb-1">Miejsce urodzenia *</label><Input name="birthplace" value={f.form.birthplace} onChange={f.handleChange} /></div>
              <div>
                <label className="block text-xs font-medium mb-1">PESEL *</label>
                <Input name="pesel" value={f.form.pesel} onChange={f.handleChange} inputMode="numeric" maxLength={11} className={f.errors.pesel ? 'border-error' : ''} />
                <FieldErr msg={f.errors.pesel} />
              </div>
            </div>

            {/* DANE KONTAKTOWE */}
            <SectionHead icon={<Mail size={14} />} label="Dane kontaktowe" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium mb-1">Email *</label><Input type="email" name="email" value={f.form.email} onChange={f.handleChange} autoComplete="email" /></div>
              <div>
                <label className="block text-xs font-medium mb-1">Telefon *</label>
                <Input type="tel" name="phone" value={f.form.phone} onChange={f.handleChange} autoComplete="tel" className={f.errors.phone ? 'border-error' : ''} />
                <FieldErr msg={f.errors.phone} />
              </div>
            </div>

            {/* ADRESY */}
            <AddressBlock
              label="Adres zamieszkania"
              fields={f.form.residenceAddress}
              savedAddresses={f.savedAddresses}
              selectedId={f.selectedResAddrId}
              postalCodeError={f.errors.residenceAddress_postalCode}
              onChange={e => f.handleChange(e, 'residenceAddress')}
              onSelect={addr => f.selectSavedAddress('res', addr)}
            />

            <label className="flex items-center gap-2 mt-3 cursor-pointer text-sm">
              <input type="checkbox" checked={f.hasDiffCorr} onChange={e => {
                f.setHasDiffCorr(e.target.checked)
                if (!e.target.checked) f.setForm(prev => ({ ...prev, correspondenceAddress: { ...prev.residenceAddress } }))
              }} className="rounded" />
              Adres korespondencyjny jest inny niż zamieszkania
            </label>

            {f.hasDiffCorr && (
              <AddressBlock
                label="Adres korespondencyjny"
                fields={f.form.correspondenceAddress}
                savedAddresses={f.savedAddresses}
                selectedId={f.selectedCorrAddrId}
                postalCodeError={f.errors.correspondenceAddress_postalCode}
                onChange={e => f.handleChange(e, 'correspondenceAddress')}
                onSelect={addr => f.selectSavedAddress('corr', addr)}
              />
            )}

            {/* WYKSZTAŁCENIE */}
            <SectionHead icon={<GraduationCap size={14} />} label="Wykształcenie" />
            <p className="text-xs text-text-muted mb-2">* dane pobierane tylko dla celów statystycznych</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium mb-1">Nazwa uczelni wyższej *</label><Input name="educationUniversity" value={f.form.educationUniversity} onChange={f.handleChange} /></div>
              <div><label className="block text-xs font-medium mb-1">Lokalizacja *</label><Input name="educationLocation" value={f.form.educationLocation} onChange={f.handleChange} /></div>
              <div>
                <label className="block text-xs font-medium mb-1">Rok zakończenia *</label>
                <Input name="educationYear" value={f.form.educationYear} onChange={f.handleChange} inputMode="numeric" maxLength={4} className={f.errors.educationYear ? 'border-error' : ''} />
                <FieldErr msg={f.errors.educationYear} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Miejsce uzyskania świadectwa dojrzałości *</label>
                <select name="maturityCountry" value={f.form.maturityCountry} onChange={f.handleChange} className="w-full border border-(--color-outline) rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="Polska">Polska</option>
                  <option value="Poza Polską">Poza Polską</option>
                </select>
              </div>
            </div>

            {/* KONTAKT AWARYJNY */}
            <SectionHead icon={<Phone size={14} />} label="Kontakt awaryjny" />
            <label className="flex items-center gap-2 mb-3 cursor-pointer text-sm">
              <input type="checkbox" checked={f.hasEmergency} onChange={e => {
                f.setHasEmergency(e.target.checked)
                if (!e.target.checked) f.setForm(prev => ({ ...prev, emergencyName: '', emergencyLastName: '', emergencyPhone: '' }))
              }} className="rounded" />
              Chcę dodać kontakt awaryjny
            </label>
            {f.hasEmergency && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="block text-xs font-medium mb-1">Imię kontaktu</label><Input name="emergencyName" value={f.form.emergencyName} onChange={f.handleChange} /></div>
                <div><label className="block text-xs font-medium mb-1">Nazwisko kontaktu</label><Input name="emergencyLastName" value={f.form.emergencyLastName} onChange={f.handleChange} /></div>
                <div><label className="block text-xs font-medium mb-1">Telefon kontaktu</label><Input type="tel" name="emergencyPhone" value={f.form.emergencyPhone} onChange={f.handleChange} /></div>
              </div>
            )}

            {/* DOKUMENTY */}
            {f.documents.length > 0 && (
              <>
                <SectionHead icon={<Upload size={14} />} label="Dokumenty" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {f.documents.map(doc => {
                    const hasExisting = !!f.existingDocs[doc.id]
                    const hasNew = !!f.files[doc.id]
                    return (
                      <div key={doc.id} className={`border rounded-lg p-3 text-sm ${f.errors[`doc_${doc.id}`] ? 'border-error' : 'border-(--color-outline)'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <FileCheck size={14} className={hasExisting || hasNew ? 'text-success' : 'text-text-muted'} />
                          <span className="font-medium">{doc.name}{doc.required && <span className="text-error ml-1">*</span>}</span>
                        </div>
                        {hasExisting && !hasNew && <p className="text-xs text-success mb-2">Poprzednio przesłany</p>}
                        {hasNew && <p className="text-xs text-success mb-2">Wybrany: {f.files[doc.id]?.name}</p>}
                        <input
                          ref={el => { f.fileInputRefs.current[doc.id] = el }}
                          type="file" accept=".pdf,.doc,.docx" className="hidden"
                          onChange={e => { const file = e.target.files?.[0] || null; f.setFiles(prev => ({ ...prev, [doc.id]: file })) }}
                        />
                        <Button type="button" variant="secondary" size="sm" onClick={() => f.fileInputRefs.current[doc.id]?.click()}>
                          {hasNew || hasExisting ? 'Zmień plik' : 'Wybierz plik'}
                        </Button>
                        <FieldErr msg={f.errors[`doc_${doc.id}`]} />
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* ZGODY */}
            <SectionHead icon={<FileCheck size={14} />} label="Zgody i regulaminy" />
            <div className="space-y-3">
              {([
                { name: 'data' as const, error: f.errors.data, label: 'Potwierdzam, że wszystkie podane powyżej dane są zgodne z prawdą.', link: undefined },
                { name: 'rules' as const, error: f.errors.rules, label: 'Potwierdzam, że zapoznałem się z treścią regulaminu studiów AGH.', link: { href: '/assets/dokumenty/regulamin-studiow-podyplomowych-agh.pdf', text: 'Pełna treść' } },
                { name: 'rodo' as const, error: f.errors.rodo, label: 'Wyrażam zgodę na przetwarzanie moich danych osobowych w ramach procesu rekrutacji na studia.', link: { href: '/assets/dokumenty/zgoda_na_przetwarzanie_danych_osobowych.pdf', text: 'Pełna treść' } },
              ]).map(({ name, error, label, link }) => (
                <div key={name}>
                  <label className="flex items-start gap-3 cursor-pointer text-sm">
                    <input
                      type="checkbox" name={name}
                      checked={f.form.consents[name]}
                      onChange={e => f.handleChange(e, 'consents')}
                      className="mt-0.5 rounded shrink-0"
                    />
                    <span>
                      <span className="text-error">*</span> {label}{' '}
                      {link && <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-primary underline">{link.text}</a>}
                    </span>
                  </label>
                  <FieldErr msg={error} />
                </div>
              ))}
            </div>

            {/* BŁĘDY I PRZYCISKI */}
            {errList.length > 0 && (
              <Alert variant="error" className="mt-4">
                <strong>Formularz zawiera błędy:</strong>
                <ul className="list-disc list-inside mt-1">{errList.map((e, i) => <li key={i}>{e}</li>)}</ul>
              </Alert>
            )}
            {f.error && <Alert variant="error" className="mt-4">{f.error}</Alert>}

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-(--color-outline)">
              <Button type="button" variant="secondary" disabled={f.saving} onClick={() => f.submitForm('SAVE')}>
                {f.saved ? 'Zapisano!' : f.saving ? 'Zapisywanie...' : 'Zapisz formularz'}
              </Button>
              <Button type="button" disabled={f.saving} onClick={() => f.submitForm('ENROLL')}>
                {f.saving ? 'Wysyłanie...' : 'Wyślij wniosek'}
              </Button>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}
