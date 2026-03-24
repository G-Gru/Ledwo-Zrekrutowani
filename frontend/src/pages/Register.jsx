import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import '../styles/Style.css';

export default function Register() {
  const navigate = useNavigate();
  const { handleRegister } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    pesel: "",
    nationality: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [consents, setConsents] = useState({
    infoClause: false,
    gdpr: false,
    updates: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setConsents((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email.includes("@") || !/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Proszę podać poprawny adres email.");
      return;
    }

    if (!/^\d{11}$/.test(formData.pesel)) {
      setError("PESEL musi składać się z 11 cyfr.");
      return;
    }

    if (!/^\+?\d{9,12}$/.test(formData.phone.trim())) {
      setError("Niepoprawny numer telefonu");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Hasła nie są identyczne");
      return;
    }

    if (!consents.infoClause || !consents.gdpr) {
      setError("Musisz zaakceptować wymagane zgody, aby kontynuować.");
      return;
    }

    setLoading(true);

    try {
      const registerPayload = {
        ...formData,
        consents,
      };
      console.log("Rejestracja payload:", registerPayload);

      await handleRegister(formData.email, formData.password);
      navigate("/login");
    } catch (err) {
      setError(err?.message || "Błąd rejestracji");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-layout">
      <h2 className="page-title">Rejestracja</h2>
      <div className="bg-panel">
        <form onSubmit={onSubmit} autoComplete="off">
          <div className="section-title">Dane osobowe</div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">Imię</label>
              <input
                id="firstName"
                name="firstName"
                autoComplete="given-name"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Nazwisko</label>
              <input
                id="lastName"
                name="lastName"
                autoComplete="family-name"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pesel">PESEL</label>
              <input
                id="pesel"
                name="pesel"
                autoComplete="off"
                inputMode="numeric"
                pattern="\d{11}"
                value={formData.pesel}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="nationality">Obywatelstwo</label>
              <input
                id="nationality"
                name="nationality"
                autoComplete="country-name"
                value={formData.nationality}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="section-title">Dane kontaktowe</div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Numer telefonu</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="numeric"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="section-title">Zabezpieczenia</div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Hasło</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Powtórz hasło</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="section-title">Zgody i regulaminy</div>
          <div className="consent-box">
            <label className="consent-item">
              <input
                type="checkbox"
                name="infoClause"
                checked={consents.infoClause}
                onChange={handleChange}
              />
              Potwierdzam, że zapoznałem(am) się z treścią klauzuli informacyjnej i przyjmuję do wiadomości informacje w niej zawarte.
            </label>
            <label className="consent-item">
              <input
                type="checkbox"
                name="gdpr"
                checked={consents.gdpr}
                onChange={handleChange}
              />
              Zgodnie z Rozporządzeniem Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. w sprawie ochrony osób fizycznych w związku z przetwarzaniem danych osobowych i w sprawie swobodnego przepływu takich danych oraz uchylenia dyrektywy 95/46/WE (ogólne rozporządzenie o ochronie danych) [Dz. U. UE.L.2016.119.1 z dnia 4 maja 2016 r.], zwanego dalej RODO, wyrażam zgodę na przetwarzanie moich danych osobowych w ramach procesu rekrutacji na powyższe studia i dokumentowanie ich przebiegu.
            </label>
            <label className="consent-item">
              <input
                type="checkbox"
                name="updates"
                checked={consents.updates}
                onChange={handleChange}
              />
              Chcę otrzymywać wiadomości o szkoleniach, kursach dokształcających i studiach podyplomowych organizowanych przez Wydział Informatyki AGH.
            </label>
          </div>
          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? "Rejestracja..." : "Zarejestruj się"}
          </button>
        </form>

        <p className="auth-link">
          Masz już konto? <a href="/login">Zaloguj się</a>
        </p>
      </div>
    </div>
  );
}

