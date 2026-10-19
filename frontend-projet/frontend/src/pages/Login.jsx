import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/exocraft-logo.png";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Veuillez renseigner votre adresse email et votre mot de passe.");
      return;
    }

    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Email ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <header className="auth-header">
        <Link to="/" className="auth-logo-link">
          <img src={logo} alt="ExoCraft" className="auth-logo" />
        </Link>
        <div className="auth-header-text">
          <span>Pas encore de compte ?</span>
          <Link to="/register">Créer un compte</Link>
        </div>
      </header>

      <main className="auth-main">
        <div className="auth-container">

          <div className="auth-heading">
            <span className="auth-eyebrow">ESPACE ENSEIGNANT</span>
            <h1>Bon retour sur ExoCraft</h1>
            <p>Connectez-vous pour accéder à vos contenus pédagogiques et continuer votre travail.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>

            <div className="form-group">
              <label htmlFor="email">Adresse email</label>
              <input
                type="email"
                id="email"
                value={email}
                placeholder="exemple@email.com"
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>
              <input
                type="password"
                id="password"
                value={password}
                placeholder="Votre mot de passe"
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="forgot-password"
                onClick={() => alert("La récupération du mot de passe sera disponible prochainement.")}
              >
                Mot de passe oublié ?
              </button>
            </div>

            {error && <div className="auth-error" role="alert">{error}</div>}

            <button type="submit" className="auth-button" disabled={loading}>
              <span>{loading ? "Connexion..." : "Se connecter"}</span>
              {!loading && <span>→</span>}
            </button>

          </form>

          <div className="auth-bottom">
            <span>Vous n'avez pas encore de compte ?</span>
            <Link to="/register">Créer un compte</Link>
          </div>

          <div className="auth-security">
            <span>🔒</span>
            <p>Vos informations de connexion sont protégées.</p>
          </div>

        </div>
      </main>
    </div>
  );
}

export default Login;
