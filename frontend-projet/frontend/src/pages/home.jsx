import { useNavigate } from "react-router-dom";
import logo from "../assets/exocraft-logo.png";

function Home() {
  const navigate = useNavigate();

  const contentTypes = [
    {
      icon: "📘",
      title: "Cours",
      description:
        "Rédigez et organisez vos cours dans votre tableau de bord.",
    },
    {
      icon: "📝",
      title: "Résumés",
      description:
        "Rédigez des résumés pédagogiques clairs et adaptés à vos besoins.",
    },
    {
      icon: "✎",
      title: "Séries d’exercices",
      description:
        "Préparez vos séries d’exercices et leurs consignes.",
    },
    {
      icon: "☑",
      title: "Quiz",
      description:
        "Rédigez vos questions et vos propositions de réponse.",
    },
    {
      icon: "📋",
      title: "Examens",
      description:
        "Préparez des examens structurés avec durée, barème et consignes.",
    },
  ];

  return (
    <div className="home-page">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="home-navbar">
        <div className="home-brand">
          <img
            src={logo}
            alt="ExoCraft"
            className="home-logo"
          />
        </div>

        <nav className="home-nav">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="home-login-button"
          >
            Connexion
          </button>

          <button
            type="button"
            onClick={() => navigate("/register")}
            className="home-register-button"
          >
            Créer un compte
          </button>
        </nav>
      </header>

      {/* =====================================================
          HERO
      ===================================================== */}

      <main>

        <section className="home-hero">

          <div className="home-hero-content">

            <span className="home-eyebrow">
              VOTRE ESPACE PÉDAGOGIQUE
            </span>

            <h1>
              Créez vos contenus
              <br />
              pédagogiques avec{" "}
              <span>ExoCraft</span>
            </h1>

            <p>
              Un espace pour rédiger, organiser et retrouver vos cours, résumés, exercices, quiz et examens.
            </p>

            <div className="home-hero-actions">

              <button
                type="button"
                className="home-primary-button"
                onClick={() => navigate("/register")}
              >
                Commencer gratuitement
                <span>→</span>
              </button>

              <button
                type="button"
                className="home-secondary-button"
                onClick={() => navigate("/login")}
              >
                Se connecter
              </button>

            </div>

          </div>

          {/* =================================================
              HERO VISUAL
          ================================================= */}

          <div className="home-hero-visual">

            <div className="home-ai-card">

              <div className="home-ai-header">
                <div className="home-ai-icon">
                  ✦
                </div>

                <div>
                  <strong>Mes contenus</strong>
                  <span>Tableau de bord</span>
                </div>
              </div>

              <div className="home-ai-line">
                <span>Thème</span>
                <strong>Cloud Computing</strong>
              </div>

              <div className="home-ai-line">
                <span>Contenu</span>
                <strong>Quiz</strong>
              </div>

              <div className="home-ai-line">
                <span>Statut</span>
                <strong className="home-ai-status">
                  Brouillon
                </strong>
              </div>

              <div className="home-ai-progress">
                <div className="home-ai-progress-bar"></div>
              </div>

            </div>

            <div className="home-floating-card home-floating-card-top">
              <span>✓</span>
              <div>
                <strong>Contenu structuré</strong>
                <small>Rédigé par vous</small>
              </div>
            </div>

            <div className="home-floating-card home-floating-card-bottom">
              <span>✎</span>
              <div>
                <strong>Modification manuelle</strong>
                <small>Avant validation</small>
              </div>
            </div>

          </div>

        </section>

        {/* =====================================================
            TYPES DE CONTENU
        ===================================================== */}

        <section className="home-content-section">

          <div className="home-section-header">

            <span className="home-eyebrow">
              VOS CONTENUS
            </span>

            <h2>
              Un seul espace pour tous
              <br />
              vos contenus pédagogiques
            </h2>

            <p>
              ExoCraft vous accompagne dans la création et
              la gestion de vos différents supports pédagogiques.
            </p>

          </div>

          <div className="home-content-grid">

            {contentTypes.map((content) => (
              <div
                className="home-content-card"
                key={content.title}
              >
                <div className="home-content-icon">
                  {content.icon}
                </div>

                <h3>{content.title}</h3>

                <p>{content.description}</p>
              </div>
            ))}

          </div>

        </section>

        {/* =====================================================
            WORKFLOW
        ===================================================== */}

        <section className="home-workflow-section">

          <div className="home-section-header">

            <span className="home-eyebrow">
              COMMENT ÇA MARCHE
            </span>

            <h2>
              De votre idée à votre
              <br />
              contenu pédagogique
            </h2>

          </div>

          <div className="home-workflow">

            <div className="home-workflow-step">
              <div className="home-workflow-number">
                01
              </div>

              <h3>Définissez votre contenu</h3>

              <p>
                Choisissez le type de contenu et saisissez
                votre thème ou votre plan.
              </p>
            </div>

            <div className="home-workflow-line"></div>

            <div className="home-workflow-step">
              <div className="home-workflow-number">
                02
              </div>

              <h3>Rédigez votre contenu</h3>

              <p>
                Rédigez ou collez votre texte directement depuis le tableau de bord.
              </p>
            </div>

            <div className="home-workflow-line"></div>

            <div className="home-workflow-step">
              <div className="home-workflow-number">
                03
              </div>

              <h3>Modifiez et validez</h3>

              <p>
                Relisez et modifiez le contenu avant de
                le valider.
              </p>
            </div>

            <div className="home-workflow-line"></div>

            <div className="home-workflow-step">
              <div className="home-workflow-number">
                04
              </div>

              <h3>Organisez et retrouvez</h3>

              <p>
                Retrouvez vos contenus dans le tableau de bord et restaurez ceux que vous avez archivés.
              </p>
            </div>

          </div>

        </section>

        {/* =====================================================
            ARCHIVES
        ===================================================== */}

        <section className="home-archive-section">

          <div className="home-archive-card">

            <div className="home-archive-icon">
              ▤
            </div>

            <div className="home-archive-content">

              <span className="home-eyebrow">
                ARCHIVES PÉDAGOGIQUES
              </span>

              <h2>
                Retrouvez vos contenus supprimés
              </h2>

              <p>
                Un contenu supprimé est conservé dans les archives. Vous pouvez le consulter et le restaurer dans votre tableau de bord à tout moment.
              </p>

            </div>

          </div>

        </section>

        {/* =====================================================
            CTA
        ===================================================== */}

        <section className="home-cta-section">

          <div className="home-cta">

            <span className="home-cta-icon">
              ✦
            </span>

            <h2>
              Prêt à créer vos contenus
              pédagogiques ?
            </h2>

            <p>
              Commencez à utiliser ExoCraft pour simplifier
              la préparation de vos supports pédagogiques.
            </p>

            <button
              type="button"
              className="home-primary-button"
              onClick={() => navigate("/register")}
            >
              Créer un compte
              <span>→</span>
            </button>

          </div>

        </section>

      </main>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="home-footer">

        <div className="home-footer-brand">
          <img
            src={logo}
            alt="ExoCraft"
            className="home-footer-logo"
          />

          <span>
            Espace de création et de gestion de contenus pédagogiques.
          </span>
        </div>

        <div className="home-footer-copy">
          © 2026 ExoCraft
        </div>

      </footer>

    </div>
  );
}

export default Home;