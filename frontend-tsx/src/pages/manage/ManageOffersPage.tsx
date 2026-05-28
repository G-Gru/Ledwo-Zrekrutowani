import { useEffect, useState } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { api, type AdminStudy } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

const emptyForm = { name: '', terms_count: '', description: '', organizational_unit: '' }

export default function ManageOffersPage() {
  usePageTitle('Zarządzaj Ofertami')
  const [studies, setStudies] = useState<AdminStudy[]>([])
  const [selected, setSelected] = useState<AdminStudy | null>(null)
  const [form, setForm] = useState<typeof emptyForm>(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function fetchStudies() {
    const res = await api.getAdminStudies()
    if (!res.error) setStudies(res.data)
    else setError('Brak uprawnień do zarządzania kierunkami studiów.')
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchStudies() }, [])

  function openNew() {
    setSelected(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEdit(study: AdminStudy) {
    setSelected(study)
    setForm({ name: study.name, terms_count: String(study.terms_count), description: study.description || '', organizational_unit: study.organizational_unit || '' })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload: Partial<AdminStudy> = { name: form.name, terms_count: Number(form.terms_count), description: form.description, organizational_unit: form.organizational_unit }
      const res = selected
        ? await api.updateAdminStudy(selected.id, payload)
        : await api.createAdminStudy(payload)
      if (res.error) { setError(res.msg); return }
      await fetchStudies()
      setShowForm(false)
      setSelected(null)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(study: AdminStudy) {
    if (!window.confirm(`Czy na pewno usunąć kierunek "${study.name}"?`)) return
    const res = await api.deleteAdminStudy(study.id)
    if (res.error) { setError(res.msg); return }
    await fetchStudies()
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Zarządzanie kierunkami studiów</h1>
        <Button onClick={openNew}><Plus size={14} className="mr-1" />Nowy kierunek</Button>
      </div>

      {error && <Alert variant="error" onClose={() => setError('')}>{error}</Alert>}

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{selected ? `Edytuj: ${selected.name}` : 'Nowy kierunek studiów'}</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}><X size={14} /></Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium mb-1">Nazwa kierunku *</label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Liczba semestrów *</label>
                <Input type="number" value={form.terms_count} onChange={e => setForm(p => ({ ...p, terms_count: e.target.value }))} required min={1} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Jednostka organizacyjna</label>
                <Input value={form.organizational_unit} onChange={e => setForm(p => ({ ...p, organizational_unit: e.target.value }))} placeholder="np. INF" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium mb-1">Opis</label>
                <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? 'Zapisywanie...' : (selected ? 'Aktualizuj kierunek' : 'Stwórz kierunek')}</Button>
                <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setSelected(null) }}>Anuluj</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Lista kierunków studiów</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nazwa</TableHead>
                <TableHead>Semestry</TableHead>
                <TableHead>Jednostka</TableHead>
                <TableHead>Opis</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studies.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-text-muted">Brak kierunków studiów</TableCell></TableRow>
              )}
              {studies.map(study => (
                <TableRow key={study.id}>
                  <TableCell className="font-medium">{study.name}</TableCell>
                  <TableCell>{study.terms_count}</TableCell>
                  <TableCell>{study.organizational_unit || '-'}</TableCell>
                  <TableCell className="text-text-muted max-w-xs truncate">{study.description || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-3 justify-end">
                      <Button size="sm" variant="secondary" onClick={() => openEdit(study)}><Pencil size={16} className="mr-1" />Edytuj</Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(study)}><Trash2 size={16} /></Button>
                    </div>
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
