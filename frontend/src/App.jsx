import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Login from './pages/Login';
import Register from './pages/Register';
import MainPage from './pages/MainPage';
import ApplicationForm from './pages/ApplicationForm';
import ApplicationSent from './pages/ApplicationSent';
import MyApplications from './pages/MyApplications';
import Payments from './pages/Payments';

function App() {
  const token = localStorage.getItem('token');

  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/applicationForm" element={<ApplicationForm />} />
        <Route path="/applicationSent" element={<ApplicationSent />} />
        <Route path="/myapplications" element={<MyApplications />} />
        <Route path="/mypayments" element={<Payments />} />
      </Routes>
    </Router>
  );
}

export default App
