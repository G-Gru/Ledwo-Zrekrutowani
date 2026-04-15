import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Login from './pages/Login';
import Register from './pages/Register';
import MainPage from './pages/MainPage';
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
import ApplicationsReview from './pages/admin-pages/ApplicationsReview';
import ApplicationReviewDetails from './pages/admin-pages/ApplicationReviewDetails';

function App() {
  const token = localStorage.getItem('token');

  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/studies" element={<StudiesPage />} />
        <Route path="/studies/editions/:id" element={<StudiesDetailPage />} />
        <Route path="/manage-studies" element={<ManageStudiesOffers />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/applicationForm" element={<ApplicationForm />} />
        <Route path="/applicationSent" element={<ApplicationSent />} />

        <Route path="/my-applications" element={<MyApplications />} />
        <Route path="/my-payments" element={<Payments />} />
        <Route path="/my-documents" element={<Documents />} />
        <Route path="/my-profile" element={<Profile />} />

        <Route path="/admin/candidates" element={<Candidates />} />
        <Route path="/admin/applications" element={<ApplicationsReview />} />
        <Route path="/admin/applications/:id" element={<ApplicationReviewDetails />} />
        <Route path="/admin/finances" element={<Finanses />} />
        <Route path="/admin/export" element={<DataExport />} />

      </Routes>
    </Router>
  );
}

export default App
