import { BASE_URL } from '@/api/client'
import { getAccessToken, isTokenExpired, refreshAccessToken } from './auth'

// ── helpers ──────────────────────────────────────────────────────────────────

type ApiResult<T> = { data: T; error: false } | { data: null; error: true; msg: string }

async function request<T>(
  endpoint: string,
  method = 'GET',
  body?: unknown,
  token?: string | null,
  isBlob = false
): Promise<ApiResult<T>> {
  if (token && isTokenExpired(token)) {
    token = await refreshAccessToken()
    if (!token) return { data: null, error: true, msg: 'Sesja wygasła' }
  }

  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (body !== undefined && !(body instanceof FormData)) headers['Content-Type'] = 'application/json'

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL.replace(/\/$/, '')}${endpoint}`

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
      let msg = `HTTP ${res.status}`
      try {
        const err = await res.json() as Record<string, unknown>
        msg = (err.detail as string) || Object.values(err).flat().join(', ') || msg
      } catch {}
      return { data: null, error: true, msg }
    }

    if (res.status === 204) return { data: null as unknown as T, error: false }
    if (isBlob) return { data: res as unknown as T, error: false }
    return { data: await res.json() as T, error: false }
  } catch (e) {
    return { data: null, error: true, msg: (e as Error).message }
  }
}

const tok = () => getAccessToken()

// ── types ─────────────────────────────────────────────────────────────────────

export interface StudiesEdition {
  id: number
  name: string
  price: string
  start_date: string
  end_date: string
  max_participants: number
  status: string
  syllabus_url?: string
  recruitment_start_date?: string
  recruitment_end_date?: string
  terms_count?: number
  description?: string
}

export interface StaffMember {
  id: number
  role: string
  user: { first_name: string; last_name: string; email: string; work_phones?: { phone: string }[] }
}

export interface Enrollment {
  id: number
  status: string
  studies_edition: { id: number; name: string } | number
  all_documents_accepted_date?: string | null
  has_missing_docs?: boolean
  is_fully_paid?: boolean
}

export interface Payment {
  id: number
  amount: string
  due_date: string
  paid_date?: string | null
  status: string
  fee_type?: string
  title?: string
}

export interface AdminEnrollment {
  id: number
  user_id: number
  student_name: string
  status: string
  status_note?: string
  enrollment_date?: string
  is_fully_paid: boolean
  missing_documents: boolean
  studies_name: string
  edition_name: string
  system_status?: string
}

export interface AdminEnrollmentDetail extends AdminEnrollment {
  personal: { first_name: string; second_name?: string; last_name: string; family_name?: string; pesel?: string; birth_date?: string; birth_place?: string; citizenship?: string; academic_title?: string }
  contact: { email: string; phone?: string }
  residential_address?: Address | null
  registered_address?: Address | null
  education?: { description?: string; country?: string }
  documents?: DocItem[]
  payments?: Payment[]
}

export interface Address {
  id?: number
  city: string
  street: string
  postal_code: string
  country: string
  building_number?: string
  apartment_number?: string
}

export interface DocItem {
  id: number
  title?: string
  studies_document?: { id?: number; name: string; due_date?: string }
  status: string
  file?: number | null
  submitted_date?: string
  note?: string
}

export interface RecruitmentStat {
  edition_id: number
  edition_name: string
  studies_name: string
  total: number
  candidate: number
  student: number
  rejected: number
  expelled: number
  reserve: number
}

export interface PendingTransfer {
  id: number
  enrollment_id: number
  student_name: string
  amount: string
  payment_date?: string
  file?: number | null
  fee_type?: string
  title?: string
}

export interface Notification {
  id: number
  title: string
  content: string
  created_at: string
  target_group?: string
}

export interface StudiesOffer {
  id: number
  name: string
  description?: string
  is_active: boolean
}

export interface Employee {
  id: number
  first_name: string
  last_name: string
  email: string
  is_active?: boolean
  roles?: string[]
}

export interface UserAddress {
  id?: number
  street: string
  house_number: string
  flat_number?: string
  city: string
  country: string
  postal_code: string
}

export interface ApplicationFormData {
  enrollment?: number
  first_name?: string
  second_name?: string
  last_name?: string
  family_name?: string
  academic_title?: string
  birth_date?: string
  birth_place?: string
  pesel?: string
  citizenship?: string
  email?: string
  phone?: string
  residential_address?: number | null
  registered_address?: number | null
  education_university?: string
  education_location?: string
  education_year?: string
  maturity_country?: string
  emergency_name?: string
  emergency_last_name?: string
  emergency_phone?: string
  status?: string | string[]
}

export interface EditionDocument {
  id: number
  name: string
  required: boolean
  is_read_only?: boolean
  description?: string
}

export interface AdminStudy {
  id: number
  name: string
  terms_count: number
  description?: string
  organizational_unit?: string
}

export interface AdminEdition {
  id: number
  studies_id?: number
  studies_name?: string
  name?: string
  price: string
  start_date: string
  end_date: string
  max_participants: number
  status: string
  syllabus_url?: string
  recruitment_start_date?: string
  recruitment_end_date?: string
  academic_year?: string
}

export interface AdminUser {
  id: number
  first_name: string
  last_name: string
  email: string
  academic_title?: string
  role?: string
  work_phones?: { phone: string }[]
}

// ── public ────────────────────────────────────────────────────────────────────

export const api = {
  // Studies
  getEditions: () => request<StudiesEdition[]>('/api/studies/editions/'),
  getEdition: (id: string | number) => request<StudiesEdition>(`/api/studies/editions/${id}/`),
  getEditionStaff: (id: string | number) => request<StaffMember[]>(`/api/studies/editions/${id}/staff/`),

  // Enrollments (user)
  getMyEnrollments: () => request<Enrollment[]>('/api/enrollments/active/', 'GET', undefined, tok()),
  resignEnrollment: (id: number) => request<null>(`/api/enrollments/${id}/`, 'DELETE', undefined, tok()),

  // Payments (user)
  getUpcomingPayments: () => request<Payment[]>('/api/payments/upcoming/', 'GET', undefined, tok()),
  getPaymentHistory: () => request<Payment[]>('/api/payments/history/', 'GET', undefined, tok()),
  payFee: (feeId: number, body: FormData | Record<string, unknown>) =>
    request<unknown>(`/api/payments/${feeId}/pay/`, 'POST', body, tok(), false),

  // Documents (user)
  getEnrollmentDocuments: (enrollmentId: number) =>
    request<DocItem[]>(`/api/enrollments/${enrollmentId}/documents/`, 'GET', undefined, tok()),

  // Files
  downloadFile: (fileId: number) =>
    request<Response>(`/api/files/${fileId}/`, 'GET', undefined, tok(), true),

  // Admin — enrollments
  getAdminEnrollments: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<AdminEnrollment[] | { results: AdminEnrollment[] }>(`/api/admin/enrollments/${qs}`, 'GET', undefined, tok())
  },
  getAdminEnrollmentDetail: (id: number) =>
    request<AdminEnrollmentDetail>(`/api/admin/enrollments/${id}/details/`, 'GET', undefined, tok()),
  acceptEnrollment: (id: number, note = '') =>
    request<unknown>(`/api/admin/enrollments/${id}/accept/`, 'POST', { status_note: note }, tok()),
  rejectEnrollment: (id: number, note = '') =>
    request<unknown>(`/api/admin/enrollments/${id}/reject/`, 'POST', { status_note: note }, tok()),

  // Admin — documents
  acceptDocument: (enrollmentId: number, docId: number, note = '') =>
    request<unknown>(`/api/admin/enrollments/${enrollmentId}/documents/${docId}/accept/`, 'POST', note ? { note } : {}, tok()),
  rejectDocument: (enrollmentId: number, docId: number, note = '') =>
    request<unknown>(`/api/admin/enrollments/${enrollmentId}/documents/${docId}/reject/`, 'POST', note ? { note } : {}, tok()),

  // Admin — stats & export
  getRecruitmentStats: () =>
    request<RecruitmentStat[]>('/api/admin/enrollments/recruitment-stats/', 'GET', undefined, tok()),
  getUsosExport: () =>
    request<Record<string, unknown>[]>('/api/admin/enrollments/usos-export/', 'GET', undefined, tok()),

  // Admin — finances (pending transfers)
  getPendingTransfers: () =>
    request<PendingTransfer[]>('/api/payments/pending/', 'GET', undefined, tok()),
  approveTransfer: (paymentId: number) =>
    request<unknown>(`/api/payments/${paymentId}/approve/`, 'POST', {}, tok()),

  // Admin — notifications
  getNotifications: () =>
    request<Notification[]>('/api/notifications/', 'GET', undefined, tok()),
  sendNotification: (data: { title: string; content: string; target_group?: string }) =>
    request<Notification>('/api/notifications/', 'POST', data, tok()),

  // Admin — manage offers
  getOffers: () => request<StudiesOffer[]>('/api/studies/offers/', 'GET', undefined, tok()),
  createOffer: (data: Partial<StudiesOffer>) =>
    request<StudiesOffer>('/api/studies/offers/', 'POST', data, tok()),
  updateOffer: (id: number, data: Partial<StudiesOffer>) =>
    request<StudiesOffer>(`/api/studies/offers/${id}/`, 'PATCH', data, tok()),
  deleteOffer: (id: number) =>
    request<null>(`/api/studies/offers/${id}/`, 'DELETE', undefined, tok()),

  // Admin — manage editions
  createEdition: (data: Partial<StudiesEdition>) =>
    request<StudiesEdition>('/api/studies/editions/', 'POST', data, tok()),
  updateEdition: (id: number, data: Partial<StudiesEdition>) =>
    request<StudiesEdition>(`/api/studies/editions/${id}/`, 'PATCH', data, tok()),
  deleteEdition: (id: number) =>
    request<null>(`/api/studies/editions/${id}/`, 'DELETE', undefined, tok()),

  // Admin — employees
  getEmployees: () => request<Employee[]>('/api/employees/', 'GET', undefined, tok()),
  createEmployee: (data: Partial<Employee>) =>
    request<Employee>('/api/employees/', 'POST', data, tok()),
  updateEmployee: (id: number, data: Partial<Employee>) =>
    request<Employee>(`/api/employees/${id}/`, 'PATCH', data, tok()),

  // User profile
  getProfile: () => request<Record<string, unknown>>('/api/auth/me', 'GET', undefined, tok()),
  getAddresses: () => request<UserAddress[]>('/api/enrollments/addresses/', 'GET', undefined, tok()),
  getAddressById: (id: number) => request<UserAddress>(`/api/enrollments/addresses/${id}/`, 'GET', undefined, tok()),
  addAddress: (data: Partial<UserAddress>) => request<UserAddress>('/api/enrollments/addresses/', 'POST', data, tok()),
  deleteAddress: (id: number) => request<null>(`/api/enrollments/addresses/${id}/`, 'DELETE', undefined, tok()),
  sendPaymentReminder: (enrollmentId: number) =>
    request<unknown>(`/api/admin/enrollments/${enrollmentId}/send-payment-reminder/`, 'POST', {}, tok()),

  // Application form
  getExistingApplication: (editionId: string | number) =>
    request<ApplicationFormData>(`/api/enrollments/editions/${editionId}/form/`, 'GET', undefined, tok()),
  getPreviousApplication: () =>
    request<ApplicationFormData>('/api/enrollments/form/previous/', 'GET', undefined, tok()),
  getEditionDocuments: (editionId: string | number) =>
    request<EditionDocument[]>(`/api/studies/editions/${editionId}/documents/`, 'GET', undefined, tok()),
  submitEnrollmentForm: (editionId: string | number, form: FormData, isNew: boolean) =>
    isNew
      ? request<{ enrollment: number }>(`/api/enrollments/editions/${editionId}/`, 'POST', form, tok())
      : request<{ enrollment: number }>(`/api/enrollments/editions/${editionId}/form/`, 'PUT', form, tok()),

  // Admin — studies (programs)
  getAdminStudies: () => request<AdminStudy[]>('/api/admin/studies/', 'GET', undefined, tok()),
  createAdminStudy: (data: Partial<AdminStudy>) => request<AdminStudy>('/api/admin/studies/', 'POST', data, tok()),
  updateAdminStudy: (id: number, data: Partial<AdminStudy>) =>
    request<AdminStudy>(`/api/admin/studies/${id}/`, 'PUT', data, tok()),
  deleteAdminStudy: (id: number) => request<null>(`/api/admin/studies/${id}/`, 'DELETE', undefined, tok()),

  // Admin — editions (extended)
  getAdminEditions: () =>
    request<AdminEdition[]>('/api/admin/studies/editions/', 'GET', undefined, tok()),
  createAdminEdition: (data: Partial<AdminEdition>) =>
    request<AdminEdition>('/api/admin/studies/editions/', 'POST', data, tok()),
  updateAdminEdition: (id: number, data: Partial<AdminEdition>) =>
    request<AdminEdition>(`/api/admin/studies/editions/${id}/`, 'PUT', data, tok()),
  deleteAdminEdition: (id: number) =>
    request<null>(`/api/admin/studies/editions/${id}/`, 'DELETE', undefined, tok()),
  cancelAdminEdition: (id: number) =>
    request<unknown>(`/api/admin/studies/editions/${id}/cancel/`, 'POST', {}, tok()),
  getAdminEditionStaff: (id: number) =>
    request<StaffMember[]>(`/api/admin/studies/editions/${id}/staff/`, 'GET', undefined, tok()),
  addAdminEditionStaff: (editionId: number, data: { user_id: number; role: string }) =>
    request<unknown>(`/api/admin/studies/editions/${editionId}/staff/`, 'POST', data, tok()),
  deleteAdminEditionStaff: (editionId: number, staffId: number) =>
    request<null>(`/api/admin/studies/editions/${editionId}/staff/${staffId}/`, 'DELETE', undefined, tok()),

  // Admin — users
  getAdminUsers: () => request<AdminUser[]>('/api/admin/users/', 'GET', undefined, tok()),
  getAdminEmployeesList: () => request<AdminUser[]>('/api/admin/users/employees/', 'GET', undefined, tok()),
  createAdminEmployee: (data: {
    first_name: string; last_name: string; email: string; password: string
    role?: string; work_phones?: string[]; academic_title?: string; phone?: string
  }) => request<AdminUser>('/api/admin/users/employees/', 'POST', data, tok()),
}
