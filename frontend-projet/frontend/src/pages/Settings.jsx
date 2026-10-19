import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";

function Settings() {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.lastName || "Utilisateur ExoCraft");

  const [email, setEmail] = useState(
    user?.email || "utilisateur@exocraft.com"
  );

  const [language, setLanguage] = useState("Français");

  const [notifications, setNotifications] =
    useState(true);

  const [saved, setSaved] = useState(false);

  const handleSave = (event) => {
    event.preventDefault();

    updateUser({ lastName: name.trim(), email: email.trim() });

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer votre compte ? Cette action est irréversible."
    );

    if (!confirmed) {
      return;
    }

    alert(
      "La suppression du compte sera disponible avec le backend."
    );
  };

  const handleChangePassword = () => {
    alert(
      "La modification du mot de passe sera disponible avec le backend."
    );
  };

  return (
    <DashboardLayout activePage="settings">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="settings-header">

        <div>

          <span className="dashboard-eyebrow">
            CONFIGURATION
          </span>

          <h1>
            Paramètres
          </h1>

          <p>
            Gérez votre profil et les préférences de
            votre espace ExoCraft.
          </p>

        </div>

      </section>


      {/* =====================================================
          SETTINGS LAYOUT
      ===================================================== */}

      <div className="settings-layout">


        {/* =====================================================
            PROFIL
        ===================================================== */}

        <section className="settings-card">

          <div className="settings-card-header">

            <div className="settings-card-icon purple">
              ◉
            </div>

            <div>

              <h2>
                Profil
              </h2>

              <p>
                Gérez vos informations personnelles.
              </p>

            </div>

          </div>


          <form
            className="settings-form"
            onSubmit={handleSave}
          >

            <div className="settings-field">

              <label htmlFor="name">
                Nom
              </label>

              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Votre nom"
              />

            </div>


            <div className="settings-field">

              <label htmlFor="email">
                Adresse email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="exemple@email.com"
              />

            </div>


            <div className="settings-field">

              <label htmlFor="language">
                Langue
              </label>

              <select
                id="language"
                value={language}
                onChange={(event) =>
                  setLanguage(event.target.value)
                }
              >

                <option value="Français">
                  Français
                </option>

                <option value="English">
                  English
                </option>

                <option value="العربية">
                  العربية
                </option>

              </select>

            </div>


            <div className="settings-save-row">

              <button
                type="submit"
                className="settings-save-button"
              >
                Enregistrer les modifications
              </button>

              {saved && (
                <span className="settings-saved">
                  ✓ Modifications enregistrées
                </span>
              )}

            </div>

          </form>

        </section>


        {/* =====================================================
            PRÉFÉRENCES
        ===================================================== */}

        <section className="settings-card">

          <div className="settings-card-header">

            <div className="settings-card-icon blue">
              ⚙
            </div>

            <div>

              <h2>
                Préférences
              </h2>

              <p>
                Personnalisez votre expérience ExoCraft.
              </p>

            </div>

          </div>


          <div className="settings-options">


            {/* NOTIFICATIONS */}

            <div className="settings-option">

              <div>

                <strong>
                  Notifications
                </strong>

                <span>
                  Recevoir les notifications concernant
                  vos contenus et votre espace.
                </span>

              </div>


              <button
                type="button"
                className={
                  notifications
                    ? "settings-toggle active"
                    : "settings-toggle"
                }
                onClick={() =>
                  setNotifications(!notifications)
                }
                aria-label={
                  notifications
                    ? "Désactiver les notifications"
                    : "Activer les notifications"
                }
              >

                <span></span>

              </button>

            </div>


            {/* GÉNÉRATION INTELLIGENTE */}

            <div className="settings-option">

              <div>

                <strong>
                  Organisation des contenus
                </strong>

                <span>
                  Vos contenus restent classés par classe et par section.
                </span>

              </div>

              <span className="settings-status">
                Activé
              </span>

            </div>


            {/* SAUVEGARDE AUTOMATIQUE */}

            <div className="settings-option">

              <div>

                <strong>
                  Sauvegarde automatique
                </strong>

                <span>
                  Conserver automatiquement vos contenus
                  enregistrés.
                </span>

              </div>

              <span className="settings-status">
                Activé
              </span>

            </div>

          </div>

        </section>


        {/* =====================================================
            SÉCURITÉ
        ===================================================== */}

        <section className="settings-card">

          <div className="settings-card-header">

            <div className="settings-card-icon green">
              ✓
            </div>

            <div>

              <h2>
                Sécurité
              </h2>

              <p>
                Gérez la sécurité de votre compte.
              </p>

            </div>

          </div>


          <div className="security-content">


            {/* MOT DE PASSE */}

            <div className="security-row">

              <div>

                <strong>
                  Mot de passe
                </strong>

                <span>
                  Dernière modification : jamais
                </span>

              </div>

              <button
                type="button"
                className="secondary-settings-button"
                onClick={handleChangePassword}
              >
                Modifier
              </button>

            </div>


            {/* SESSION */}

            <div className="security-row">

              <div>

                <strong>
                  Session actuelle
                </strong>

                <span>
                  Votre session ExoCraft est active.
                </span>

              </div>

              <span className="session-active">
                ● Active
              </span>

            </div>

          </div>

        </section>


        {/* =====================================================
            COMPTE
        ===================================================== */}

        <section className="settings-card danger-card">

          <div className="settings-card-header">

            <div className="settings-card-icon red">
              !
            </div>

            <div>

              <h2>
                Compte
              </h2>

              <p>
                Actions concernant votre compte ExoCraft.
              </p>

            </div>

          </div>


          <div className="account-danger">

            <div>

              <strong>
                Supprimer mon compte
              </strong>

              <span>
                Cette action supprimera définitivement
                votre compte et vos données.
              </span>

            </div>

            <button
              type="button"
              className="delete-account-button"
              onClick={handleDeleteAccount}
            >
              Supprimer
            </button>

          </div>

        </section>

      </div>

    </DashboardLayout>
  );
}

export default Settings;
