export type UserRole =
  | 'ADMIN'
  | 'STUDIES_DIRECTOR'
  | 'ADMINISTRATIVE_COORDINATOR'
  | 'FINANCE_COORDINATOR'
  | 'CANDIDATE'
  | 'STUDENT'

export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  role: UserRole
  is_employee: boolean
}
