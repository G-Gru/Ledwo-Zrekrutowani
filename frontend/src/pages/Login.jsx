import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import '../styles/Style.css';

export default function Login() {
  const navigate = useNavigate();
  const { handleLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await handleLogin(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Błąd logowania. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-layout">
      <h2 className="page-title">Logowanie</h2>
      <div className="bg-panel">
        {error && <div className="error-message">{error}</div>}
        <input type="text" style={{display: 'none'}} autoComplete="username" />
        <input type="password" style={{display: 'none'}} autoComplete="current-password" />
        <form onSubmit={onSubmit} autoComplete="off">
          <div className="form-group">
            <label htmlFor="email">EMAIL</label>
            <input
              id="email"
              name="username"
              type="email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">HASŁO</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="off"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? "Zaloguj się..." : "Zaloguj się"}
          </button>
        </form>

        <p className="auth-link">
          Nie masz konta? <a href="/register"><strong>Zarejestruj się</strong></a>
        </p>
      </div>
    </div>
  );
}