import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './components/Header';
import Login from './pages/Login';
import Register from './pages/Register';
import StudiesPage from './pages/StudiesPage';
import StudiesDetailPage from './pages/StudiesDetailPage';
import ApplicationForm from './pages/ApplicationForm';
import ApplicationSent from './pages/ApplicationSent';
import ManageStudiesOffers from './pages/ManageStudiesOffers';
import ManageStudiesEditions from './pages/ManageStudiesEditions';

import MyApplications from './pages/account-pages/MyApplications';
import Payments from './pages/account-pages/MyPayments';
import Profile from './pages/account-pages/MyProfile';
import Documents from './pages/account-pages/MyDocuments';

import DataExport from './pages/admin-pages/DataExport';
import Finanses from './pages/admin-pages/Finances';
import Candidates from './pages/admin-pages/Candidates';
import CandidateDetails from './pages/admin-pages/CandidateDetails';
import ApplicationsReview from './pages/admin-pages/ApplicationsReview';
import ApplicationReviewDetails from './pages/admin-pages/ApplicationReviewDetails';
import CoordinatorRecruitmentStats from './pages/admin-pages/CoordinatorRecruitmentStats';
import { getUser, isLoggedIn } from './services/authService';
import NavigationPage from './pages/NavigationPage';
import FAQ from './pages/FAQ';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function ProtectedRoute({ children, allowedRoles = [] }) {
  if (!isLoggedIn()) {
    return <Navigate to='/login' replace />;
  }

  if (allowedRoles.length === 0) {
    return children;
  }

  const userRole = getUser()?.role;
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to='/studies' replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Header />
      <Routes>
        <Route path='/' element={<Navigate to='/studies' replace />} />
        <Route path='/navigation' element={<NavigationPage/>} />
        <Route path="/studies" element={<StudiesPage />} />
        <Route path="/studies/editions/:id" element={<StudiesDetailPage />} />
        <Route
          path='/manage-studies/offers'
          element={(
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <ManageStudiesOffers />
            </ProtectedRoute>
          )}
        />
        <Route
          path='/manage-studies/editions'
          element={(
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <ManageStudiesEditions />
            </ProtectedRoute>
          )}
        />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/applicationForm" element={<ApplicationForm />} />
        <Route path="/applicationSent" element={<ApplicationSent />} />

        <Route
          path='/my-applications'
          element={(
            <ProtectedRoute>
              <MyApplications />
            </ProtectedRoute>
          )}
        />
        <Route
          path='/my-payments'
          element={(
            <ProtectedRoute>
              <Payments />
            </ProtectedRoute>
          )}
        />
        <Route
          path='/my-documents'
          element={(
            <ProtectedRoute>
              <Documents />
            </ProtectedRoute>
          )}
        />
        <Route
          path='/my-profile'
          element={(
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          )}
        />

        <Route
          path='/admin/recruitment-stats'
          element={(
            <ProtectedRoute allowedRoles={['ADMIN', 'STUDIES_DIRECTOR', 'ADMINISTRATIVE_COORDINATOR']}>
              <CoordinatorRecruitmentStats />
            </ProtectedRoute>
          )}
        />
        <Route
          path='/admin/candidates'
          element={(
            <ProtectedRoute allowedRoles={['ADMIN', 'STUDIES_DIRECTOR', 'ADMINISTRATIVE_COORDINATOR']}>
              <Candidates />
            </ProtectedRoute>
          )}
        />
        <Route
          path='/admin/candidates/:id'
          element={(
            <ProtectedRoute allowedRoles={['ADMIN', 'STUDIES_DIRECTOR', 'ADMINISTRATIVE_COORDINATOR']}>
              <CandidateDetails />
            </ProtectedRoute>
          )}
        />
        <Route
          path='/admin/applications'
          element={(
            <ProtectedRoute allowedRoles={['ADMIN', 'STUDIES_DIRECTOR', 'ADMINISTRATIVE_COORDINATOR']}>
              <ApplicationsReview />
            </ProtectedRoute>
          )}
        />
        <Route
          path='/admin/applications/:id'
          element={(
            <ProtectedRoute allowedRoles={['ADMIN', 'STUDIES_DIRECTOR', 'ADMINISTRATIVE_COORDINATOR']}>
              <ApplicationReviewDetails />
            </ProtectedRoute>
          )}
        />
        <Route
          path='/admin/finances'
          element={(
            <ProtectedRoute allowedRoles={['ADMIN', 'FINANCE_COORDINATOR']}>
              <Finanses />
            </ProtectedRoute>
          )}
        />
        <Route
          path='/admin/export'
          element={(
            <ProtectedRoute allowedRoles={['ADMIN', 'STUDIES_DIRECTOR', 'ADMINISTRATIVE_COORDINATOR']}>
              <DataExport />
            </ProtectedRoute>
          )}
        />

        <Route
          path='/faq'
          element={<FAQ/>}
        />

      </Routes>
    </Router>
  );
}

export default App
