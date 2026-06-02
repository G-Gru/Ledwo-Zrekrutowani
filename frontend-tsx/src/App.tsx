import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, type ReactNode } from 'react'
import { AuthProvider } from '@/context/AuthContext'
import { isLoggedIn, getUser } from '@/services/auth'
import type { UserRole } from '@/types/auth'

import Header from '@/components/layout/Header'
import AccountSidebar from '@/components/layout/AccountSidebar'
import AdminSidebar from '@/components/layout/AdminSidebar'

// Public pages
import StudiesPage from '@/pages/StudiesPage'
import StudiesDetailPage from '@/pages/StudiesDetailPage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import ApplicationFormPage from '@/pages/ApplicationFormPage'
import ApplicationSentPage from '@/pages/ApplicationSentPage'
import FAQPage from '@/pages/FAQPage'
import ContactPage from '@/pages/ContactPage'

// Account pages
import MyApplicationsPage from '@/pages/account/MyApplicationsPage'
import MyPaymentsPage from '@/pages/account/MyPaymentsPage'
import MyDocumentsPage from '@/pages/account/MyDocumentsPage'
import MyProfilePage from '@/pages/account/MyProfilePage'

// Admin pages
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AdminCandidatesPage from '@/pages/admin/AdminCandidatesPage'
import AdminFinancesPage from '@/pages/admin/AdminFinancesPage'
import AdminExportPage from '@/pages/admin/AdminExportPage'
import AdminNotificationsPage from '@/pages/admin/AdminNotificationsPage'

// Manage pages (ADMIN only)
import ManageEditionsPage from '@/pages/manage/ManageEditionsPage'
import ManageOffersPage from '@/pages/manage/ManageOffersPage'
import ManageEmployeesPage from '@/pages/manage/ManageEmployeesPage'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function ProtectedRoute({ children, roles, redirect = '/studies' }: { children: ReactNode; roles?: UserRole[]; redirect?: string }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />
  if (roles?.length && !roles.includes(getUser()?.role as UserRole)) return <Navigate to={redirect} replace />
  return <>{children}</>
}

function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1">
      <AccountSidebar />
      <main className="flex-1 p-6 bg-background">{children}</main>
    </div>
  )
}

function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1">
      <AdminSidebar />
      <main className="flex-1 p-6 bg-background">{children}</main>
    </div>
  )
}

const STUDENT_ROLES: UserRole[] = ['CANDIDATE', 'STUDENT']
const COORD_ROLES: UserRole[] = ['ADMIN', 'STUDIES_DIRECTOR', 'ADMINISTRATIVE_COORDINATOR']
const FINANCE_ROLES: UserRole[] = ['ADMIN', 'FINANCE_COORDINATOR']
const ADMIN_ROLES: UserRole[] = ['ADMIN']

function AppRoutes() {
  return (
    <>
      <Header />
      <ScrollToTop />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Navigate to="/studies" replace />} />
        <Route path="/studies" element={<StudiesPage />} />
        <Route path="/studies/editions/:id" element={<StudiesDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/applicationForm" element={<ApplicationFormPage />} />
        <Route path="/applicationSent" element={<ApplicationSentPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* Account */}
        <Route path="/my-applications" element={<ProtectedRoute roles={STUDENT_ROLES} redirect="/my-profile"><AccountLayout><MyApplicationsPage /></AccountLayout></ProtectedRoute>} />
        <Route path="/my-payments"     element={<ProtectedRoute roles={STUDENT_ROLES} redirect="/my-profile"><AccountLayout><MyPaymentsPage /></AccountLayout></ProtectedRoute>} />
        <Route path="/my-documents"    element={<ProtectedRoute roles={STUDENT_ROLES} redirect="/my-profile"><AccountLayout><MyDocumentsPage /></AccountLayout></ProtectedRoute>} />
        <Route path="/my-profile"      element={<ProtectedRoute><AccountLayout><MyProfilePage /></AccountLayout></ProtectedRoute>} />

        {/* Admin / coordinator */}
        <Route path="/admin/dashboard"      element={<ProtectedRoute roles={COORD_ROLES}><AdminLayout><AdminDashboardPage /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/candidates"     element={<ProtectedRoute roles={COORD_ROLES}><AdminLayout><AdminCandidatesPage /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/candidates/:id" element={<ProtectedRoute roles={COORD_ROLES}><AdminLayout><AdminCandidatesPage /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/notifications"  element={<ProtectedRoute roles={COORD_ROLES}><AdminLayout><AdminNotificationsPage /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/export"         element={<ProtectedRoute roles={COORD_ROLES}><AdminLayout><AdminExportPage /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/finances"       element={<ProtectedRoute roles={FINANCE_ROLES}><AdminLayout><AdminFinancesPage /></AdminLayout></ProtectedRoute>} />

        {/* Manage (ADMIN only) */}
        <Route path="/manage-studies/editions"   element={<ProtectedRoute roles={ADMIN_ROLES}><AdminLayout><ManageEditionsPage /></AdminLayout></ProtectedRoute>} />
        <Route path="/manage-studies/offers"     element={<ProtectedRoute roles={ADMIN_ROLES}><AdminLayout><ManageOffersPage /></AdminLayout></ProtectedRoute>} />
        <Route path="/manage-studies/employees"  element={<ProtectedRoute roles={ADMIN_ROLES}><AdminLayout><ManageEmployeesPage /></AdminLayout></ProtectedRoute>} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
