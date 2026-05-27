import { useEffect, useState } from 'react'
import { api, type AdminStudy, type AdminEdition, type StaffMember, type AdminUser } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { toDateTimeLocal } from '@/utils/dateTime'
import { Plus, Pencil, Trash2, X, UserPlus, ChevronRight } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = { ACTIVE: 'Aktywna', HIDDEN: 'Ukryta', CANCELLED: 'Anulowana', CLOSED: 'Zamknięta' }
const STATUS_VARIANT: Record<string, string> = { ACTIVE: 'success', HIDDEN: 'warning', CANCELLED: 'danger', CLOSED: 'default' }
const ROLE_OPTIONS = [
  { value: 'STUDIES_DIRECTOR', label: 'Dyrektor kierunku' },
  { value: 'ADMINISTRATIVE_COORDINATOR', label: 'Koordynator administracyjny' },
  { value: 'FINANCE_COORDINATOR', label: 'Koordynator finansowy' },
]

const emptyEditionForm = {
  studies_id: '', price: '', start_date: '', end_date: '',
  max_participants: '', status: 'HIDDEN', syllabus_url: '',
  recruitment_start_date: '', recruitment_end_date: '', academic_year: '',
}

export default function ManageEditionsPage() {
  const [studies, setStudies] = useState<AdminStudy[]>([])
  const [editions, setEditions] = useState<AdminEdition[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [allUsers, setAllUsers] = useState<AdminUser[]>([])
  const [selectedStudy, setSelectedStudy] = useState<AdminStudy | null>(null)
  const [selectedEdition, setSelectedEdition] = useState<AdminEdition | null>(null)
  const [editionForm, setEditionForm] = useState<typeof emptyEditionForm>(emptyEditionForm)
  const [staffForm, setStaffForm] = useState({ user_id: '', role: 'STUDIES_DIRECTOR' })
  const [editMode, setEditMode] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([api.getAdminStudies(), api.getAdminEditions(), api.getAdminEmployeesList()]).then(([s, e, u]) => {
      if (!s.error) setStudies(s.data)
      if (!e.error) setEditions(Array.isArray(e.data) ? e.data : [])
      if (!u.error) setAllUsers(u.data)
    })
  }, [])

  function studyEditions(studyId: number) {
    return editions.filter(e => e.studies_id === studyId)
  }

  function selectEdition(edition: AdminEdition) {
    setSelectedEdition(edition)
    setEditionForm({
      studies_id: String(edition.studies_id || ''),
      price: edition.price || '',
      start_date: edition.start_date?.slice(0, 10) || '',
      end_date: edition.end_date?.slice(0, 10) || '',
      max_participants: String(edition.max_participants || ''),
      status: edition.status || 'HIDDEN',
      syllabus_url: edition.syllabus_url || '',
      recruitment_start_date: toDateTimeLocal(edition.recruitment_start_date),
      recruitment_end_date: toDateTimeLocal(edition.recruitment_end_date),
      academic_year: edition.academic_year || '',
    })
    setEditMode(true)
    fetchStaff(edition.id)
  }

  function newEdition() {
    setSelectedEdition(null)
    setEditionForm({ ...emptyEditionForm, studies_id: String(selectedStudy?.id || '') })
    setEditMode(true)
    setStaff([])
  }

  async function fetchStaff(editionId: number) {
    const res = await api.getAdminEditionStaff(editionId)
    if (!res.error) setStaff(res.data)
  }

  async function handleEditionSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload: Partial<AdminEdition> = {
        price: editionForm.price,
        start_date: editionForm.start_date,
        end_date: editionForm.end_date,
        max_participants: Number(editionForm.max_participants),
        status: editionForm.status,
        syllabus_url: editionForm.syllabus_url,
        recruitment_start_date: editionForm.recruitment_start_date || undefined,
        recruitment_end_date: editionForm.recruitment_end_date || undefined,
        academic_year: editionForm.academic_year,
      }
      if (!selectedEdition) payload.studies_id = Number(editionForm.studies_id)

      const res = selectedEdition
        ? await api.updateAdminEdition(selectedEdition.id, payload)
        : await api.createAdminEdition(payload)

      if (res.error) { setError(res.msg); return }

      const elist = await api.getAdminEditions()
      if (!elist.error) setEditions(Array.isArray(elist.data) ? elist.data : [])
      if (!selectedEdition && !res.error) {
        setSelectedEdition(res.data)
        fetchStaff(res.data.id)
      }
      alert(selectedEdition ? 'Edycja zaktualizowana.' : 'Edycja utworzona.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteEdition() {
    if (!selectedEdition) return
    if (!window.confirm('Czy na pewno usunąć tę edycję?')) return
    const res = await api.deleteAdminEdition(selectedEdition.id)
    if (res.error) { setError(res.msg); return }
    const elist = await api.getAdminEditions()
    if (!elist.error) setEditions(Array.isArray(elist.data) ? elist.data : [])
    setSelectedEdition(null); setEditMode(false); setStaff([])
  }

  async function handleCancelEdition() {
    if (!selectedEdition) return
    if (!window.confirm('Czy na pewno unieruchomić tę edycję? Kandydaci zostaną powiadomieni.')) return
    const res = await api.cancelAdminEdition(selectedEdition.id)
    if (res.error) { setError(res.msg); return }
    const elist = await api.getAdminEditions()
    if (!elist.error) setEditions(Array.isArray(elist.data) ? elist.data : [])
    alert('Edycja anulowana.')
  }

  async function handleAddStaff(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedEdition || !staffForm.user_id) return
    const res = await api.addAdminEditionStaff(selectedEdition.id, { user_id: Number(staffForm.user_id), role: staffForm.role })
    if (res.error) { setError(res.msg); return }
    fetchStaff(selectedEdition.id)
    setStaffForm({ user_id: '', role: 'STUDIES_DIRECTOR' })
    alert('Pracownik dodany do edycji.')
  }

  async function handleRemoveStaff(staffItem: StaffMember) {
    if (!selectedEdition) return
    const name = [staffItem.user.first_name, staffItem.user.last_name].filter(Boolean).join(' ')
    if (!window.confirm(`Czy na pewno usunąć ${name || 'tego pracownika'} z edycji?`)) return
    const res = await api.deleteAdminEditionStaff(selectedEdition.id, staffItem.id)
    if (res.error) { setError(res.msg); return }
    fetchStaff(selectedEdition.id)
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Zarządzanie edycjami studiów</h1>
      {error && <Alert variant="error" onClose={() => setError('')}>{error}</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* PANEL LEWEJ - KIERUNKI */}
        <Card>
          <CardHeader><CardTitle className="text-base">Kierunki studiów</CardTitle></CardHeader>
          <CardContent className="p-0">
            {studies.length === 0 && <p className="p-4 text-sm text-text-muted">Brak kierunków</p>}
            {studies.map(study => (
              <button key={study.id} onClick={() => { setSelectedStudy(study); setEditMode(false); setSelectedEdition(null) }}
                className={`w-full text-left px-4 py-3 text-sm border-b border-outline flex items-center justify-between transition-colors ${selectedStudy?.id === study.id ? 'bg-primary-container' : 'hover:bg-surface-low'}`}>
                <span className="font-medium">{study.name}</span>
                <ChevronRight size={14} className="text-text-muted" />
              </button>
            ))}
          </CardContent>
        </Card>

        {/* PANEL PRAWY - EDYCJE */}
        <div className="lg:col-span-2 space-y-4">
          {selectedStudy && !editMode && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Edycje: {selectedStudy.name}</CardTitle>
                <Button size="sm" onClick={newEdition}><Plus size={14} className="mr-1" />Nowa edycja</Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rok akademicki</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Cena</TableHead>
                      <TableHead>Maks. uczestników</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studyEditions(selectedStudy.id).length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-text-muted">Brak edycji dla tego kierunku</TableCell></TableRow>
                    )}
                    {studyEditions(selectedStudy.id).map(ed => (
                      <TableRow key={ed.id} className="cursor-pointer hover:bg-surface-low" onClick={() => selectEdition(ed)}>
                        <TableCell>{ed.academic_year || '-'}</TableCell>
                        <TableCell><Badge variant={STATUS_VARIANT[ed.status] as 'success' | 'warning' | 'danger'}>{STATUS_LABELS[ed.status] || ed.status}</Badge></TableCell>
                        <TableCell>{ed.price ? `${ed.price} zł` : '-'}</TableCell>
                        <TableCell>{ed.max_participants}</TableCell>
                        <TableCell><Pencil size={14} className="text-text-muted" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {editMode && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{selectedEdition ? 'Edytuj edycję' : 'Nowa edycja'}</CardTitle>
                <div className="flex gap-2">
                  {selectedEdition && (
                    <>
                      <Button size="sm" variant="warning" onClick={handleCancelEdition}>Unieruchom</Button>
                      <Button size="sm" variant="danger" onClick={handleDeleteEdition}><Trash2 size={14} /></Button>
                    </>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => { setEditMode(false); setSelectedEdition(null) }}><X size={14} /></Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEditionSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {!selectedEdition && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium mb-1">Kierunek studiów *</label>
                      <select value={editionForm.studies_id} onChange={e => setEditionForm(p => ({ ...p, studies_id: e.target.value }))} required
                        className="w-full border border-outline rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
                        <option value="">Wybierz kierunek...</option>
                        {studies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  )}
                  <div><label className="block text-xs font-medium mb-1">Rok akademicki *</label><Input value={editionForm.academic_year} onChange={e => setEditionForm(p => ({ ...p, academic_year: e.target.value }))} placeholder="np. 2024/2025" required /></div>
                  <div><label className="block text-xs font-medium mb-1">Cena (zł) *</label><Input type="number" step="0.01" value={editionForm.price} onChange={e => setEditionForm(p => ({ ...p, price: e.target.value }))} required /></div>
                  <div><label className="block text-xs font-medium mb-1">Data rozpoczęcia *</label><Input type="date" value={editionForm.start_date} onChange={e => setEditionForm(p => ({ ...p, start_date: e.target.value }))} required /></div>
                  <div><label className="block text-xs font-medium mb-1">Data zakończenia *</label><Input type="date" value={editionForm.end_date} onChange={e => setEditionForm(p => ({ ...p, end_date: e.target.value }))} required /></div>
                  <div><label className="block text-xs font-medium mb-1">Maks. uczestników *</label><Input type="number" value={editionForm.max_participants} onChange={e => setEditionForm(p => ({ ...p, max_participants: e.target.value }))} required /></div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Status</label>
                    <select value={editionForm.status} onChange={e => setEditionForm(p => ({ ...p, status: e.target.value }))}
                      className="w-full border border-outline rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
                      {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-xs font-medium mb-1">Rekrutacja od</label><Input type="datetime-local" value={editionForm.recruitment_start_date} onChange={e => setEditionForm(p => ({ ...p, recruitment_start_date: e.target.value }))} /></div>
                  <div><label className="block text-xs font-medium mb-1">Rekrutacja do</label><Input type="datetime-local" value={editionForm.recruitment_end_date} onChange={e => setEditionForm(p => ({ ...p, recruitment_end_date: e.target.value }))} /></div>
                  <div className="md:col-span-2"><label className="block text-xs font-medium mb-1">URL sylabusa</label><Input value={editionForm.syllabus_url} onChange={e => setEditionForm(p => ({ ...p, syllabus_url: e.target.value }))} placeholder="https://..." /></div>
                  <div className="md:col-span-2">
                    <Button type="submit" disabled={saving}>{saving ? 'Zapisywanie...' : (selectedEdition ? 'Aktualizuj edycję' : 'Utwórz edycję')}</Button>
                  </div>
                </form>

                {/* PERSONEL */}
                {selectedEdition && (
                  <div className="mt-6 border-t pt-4">
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><UserPlus size={14} />Personel edycji</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Imię i nazwisko</TableHead>
                          <TableHead>Rola</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {staff.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-text-muted">Brak przypisanego personelu</TableCell></TableRow>}
                        {staff.map(s => (
                          <TableRow key={s.id}>
                            <TableCell>{s.user.first_name} {s.user.last_name}</TableCell>
                            <TableCell>{ROLE_OPTIONS.find(r => r.value === s.role)?.label || s.role}</TableCell>
                            <TableCell>{s.user.email}</TableCell>
                            <TableCell>
                              <button onClick={() => handleRemoveStaff(s)} className="text-[var(--color-error)] hover:opacity-70"><Trash2 size={14} /></button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <form onSubmit={handleAddStaff} className="flex gap-2 mt-3 flex-wrap">
                      <select value={staffForm.user_id} onChange={e => setStaffForm(p => ({ ...p, user_id: e.target.value }))}
                        className="border border-outline rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] flex-1 min-w-[180px]">
                        <option value="">Wybierz pracownika...</option>
                        {allUsers.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>)}
                      </select>
                      <select value={staffForm.role} onChange={e => setStaffForm(p => ({ ...p, role: e.target.value }))}
                        className="border border-outline rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
                        {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                      <Button type="submit" size="sm"><Plus size={14} className="mr-1" />Dodaj</Button>
                    </form>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!selectedStudy && !editMode && (
            <div className="flex items-center justify-center h-40 text-text-muted text-sm">
              Wybierz kierunek studiów z listy po lewej
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
