const LOCALE = 'pl-PL'
const TZ = 'Europe/Warsaw'

function toDate(value: unknown): Date | null {
  if (!value) return null
  const d = new Date(value as string)
  return isNaN(d.getTime()) ? null : d
}

export function formatDate(value: unknown, fallback = '-'): string {
  const d = toDate(value)
  if (!d) return String(value || fallback)
  return new Intl.DateTimeFormat(LOCALE, { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: TZ }).format(d)
}

export function formatDateTime(value: unknown, fallback = '-'): string {
  const d = toDate(value)
  if (!d) return String(value || fallback)
  return new Intl.DateTimeFormat(LOCALE, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ }).format(d)
}

export function toDateTimeLocal(value: unknown): string {
  const d = toDate(value)
  if (!d) return ''
  const parts = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d)
  const p = (t: string) => parts.find(x => x.type === t)?.value || '00'
  return `${p('year')}-${p('month')}-${p('day')}T${p('hour')}:${p('minute')}`
}
