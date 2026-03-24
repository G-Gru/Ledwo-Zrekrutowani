import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Login from './pages/Login';
import Register from './pages/Register';
import MainPage from './pages/MainPage';
import ApplicationForm from './pages/ApplicationForm';

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
      </Routes>
    </Router>
  );
}

export default App
