import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Login from './pages/Login';
import Register from './pages/Register';
import StudiesPage from './pages/StudiesPage';
import StudiesDetailPage from './pages/StudiesDetailPage';
import ApplicationForm from './pages/ApplicationForm';
import ApplicationSent from './pages/ApplicationSent';
import ManageStudiesOffers from './pages/ManageStudiesOffers';

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
import { getUser, isLoggedIn } from './services/authService';

function ProtectedRoute({ children, allowedTypes = [] }) {
  if (!isLoggedIn()) {
    return <Navigate to='/login' replace />;
  }

  if (allowedTypes.length === 0) {
    return children;
  }

  const userType = getUser()?.type;
  if (!allowedTypes.includes(userType)) {
    return <Navigate to='/studies' replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path='/' element={<Navigate to='/studies' replace />} />
        <Route path="/studies" element={<StudiesPage />} />
        <Route path="/studies/editions/:id" element={<StudiesDetailPage />} />
        <Route
          path='/manage-studies'
          element={(
            <ProtectedRoute allowedTypes={['ADMIN', 'EMPLOYEE']}>
              <ManageStudiesOffers />
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
          path='/admin/candidates'
          element={(
            <ProtectedRoute allowedTypes={['ADMIN', 'EMPLOYEE']}>
              <Candidates />
            </ProtectedRoute>
          )}
        />
        <Route
          path='/admin/candidates/:id'
          element={(
            <ProtectedRoute allowedTypes={['ADMIN', 'EMPLOYEE']}>
              <CandidateDetails />
            </ProtectedRoute>
          )}
        />
        <Route
          path='/admin/applications'
          element={(
            <ProtectedRoute allowedTypes={['ADMIN', 'EMPLOYEE']}>
              <ApplicationsReview />
            </ProtectedRoute>
          )}
        />
        <Route
          path='/admin/applications/:id'
          element={(
            <ProtectedRoute allowedTypes={['ADMIN', 'EMPLOYEE']}>
              <ApplicationReviewDetails />
            </ProtectedRoute>
          )}
        />
        <Route
          path='/admin/finances'
          element={(
            <ProtectedRoute allowedTypes={['ADMIN']}>
              <Finanses />
            </ProtectedRoute>
          )}
        />
        <Route
          path='/admin/export'
          element={(
            <ProtectedRoute allowedTypes={['ADMIN']}>
              <DataExport />
            </ProtectedRoute>
          )}
        />

      </Routes>
    </Router>
  );
}

export default App
