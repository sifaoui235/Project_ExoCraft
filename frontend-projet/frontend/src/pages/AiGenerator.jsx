import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth, defaultGroups } from "../context/AuthContext";
import { aiApi, exportApi } from "../services/api";

const CONTENT_TYPES = [
  { value: "quiz",   label: "Quiz",              icon: "☑" },
  { value: "cours",  label: "Cours",             icon: "📘" },
  { value: "resume", label: "Résumé",            icon: "📄" },
  { value: "serie",  label: "Série d'exercices", icon: "✎" },
  { value: "examen", label: "Examen",            icon: "📋" },
];

const NIVEAUX = [
  { value: "debutant",      label: "Débutant" },
  { value: "intermediaire", label: "Intermédiaire" },
  { value: "avance",        label: "Avancé" },
];

// ── Chat IA ──────────────────────────────────────────────────────────────────
function AiChat() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Bonjour ! Je suis ExoCraft IA. Posez-moi une question ou demandez-moi de générer un contenu pédagogique." }
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    const historique = messages.slice(1);
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const data = await aiApi.chat(userMsg.content, historique);
      setMessages((prev) => [...prev, { role: "assistant", content: data.reponse }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: `❌ Erreur : ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="ai-chat-section">
      <div className="ai-chat-heading">
        <span className="dashboard-eyebrow">ASSISTANT IA</span>
        <h2>Chat avec ExoCraft IA</h2>
        <p>Posez des questions libres ou demandez de l'aide pour créer du contenu.</p>
      </div>
      <div className="ai-chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`ai-message ai-message--${msg.role}`}>
            <span className="ai-message-avatar">{msg.role === "assistant" ? "🤖" : "👤"}</span>
            <div className="ai-message-bubble">
              <pre className="ai-message-text">{msg.content}</pre>
            </div>
          </div>
        ))}
        {loading && (
          <div className="ai-message ai-message--assistant">
            <span className="ai-message-avatar">🤖</span>
            <div className="ai-message-bubble ai-message-typing">
              <span>●</span><span>●</span><span>●</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form className="ai-chat-form" onSubmit={send}>
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="Écrivez votre message..." disabled={loading} autoFocus />
        <button type="submit" disabled={loading || !input.trim()}>
          {loading ? "..." : "Envoyer →"}
        </button>
      </form>
    </section>
  );
}

// ── Panneau d'export ─────────────────────────────────────────────────────────
function ExportPanel({ form, editedContent }) {
  const [exporting, setExporting] = useState(false);
  const [msg, setMsg]             = useState("");

  const doExport = async (format, avecCorrige) => {
    setExporting(true); setMsg("");
    const titre = `${form.type.charAt(0).toUpperCase() + form.type.slice(1)} — ${form.theme}`;
    try {
      if (format === "pdf") {
        await exportApi.directPdf({ titre, matiere: form.matiere, theme: form.theme, type: form.type, contenu: editedContent, avecCorrige });
      } else {
        await exportApi.directWord({ titre, matiere: form.matiere, theme: form.theme, type: form.type, contenu: editedContent, avecCorrige });
      }
      setMsg(`✓ ${format.toUpperCase()} ${avecCorrige ? "avec corrigé" : "sans corrigé"} téléchargé.`);
    } catch (err) {
      setMsg(`❌ ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="ai-export-panel">
      <h3 className="ai-export-title">📥 Télécharger le contenu</h3>

      {/* Pour les étudiants — sans corrigé */}
      <div className="ai-export-group">
        <div className="ai-export-group-label">
          <span className="ai-export-badge ai-export-badge--student">👨‍🎓 Version étudiants</span>
          <small>Sans les réponses correctes</small>
        </div>
        <div className="ai-export-buttons">
          <button
            className="ai-export-btn ai-export-btn--pdf"
            onClick={() => doExport("pdf", false)}
            disabled={exporting}
          >
            📄 PDF
          </button>
          <button
            className="ai-export-btn ai-export-btn--word"
            onClick={() => doExport("word", false)}
            disabled={exporting}
          >
            📝 Word
          </button>
        </div>
      </div>

      {/* Pour le professeur — avec corrigé */}
      <div className="ai-export-group">
        <div className="ai-export-group-label">
          <span className="ai-export-badge ai-export-badge--prof">👨‍🏫 Version professeur</span>
          <small>Avec les réponses et explications</small>
        </div>
        <div className="ai-export-buttons">
          <button
            className="ai-export-btn ai-export-btn--pdf"
            onClick={() => doExport("pdf", true)}
            disabled={exporting}
          >
            📄 PDF + Corrigé
          </button>
          <button
            className="ai-export-btn ai-export-btn--word"
            onClick={() => doExport("word", true)}
            disabled={exporting}
          >
            📝 Word + Corrigé
          </button>
        </div>
      </div>

      {exporting && <p className="ai-export-status">⏳ Génération du fichier...</p>}
      {msg && <p className={`ai-export-status${msg.startsWith("❌") ? " error" : ""}`}>{msg}</p>}
    </div>
  );
}

// ── Générateur ───────────────────────────────────────────────────────────────
function AiGeneratorForm() {
  const [searchParams] = useSearchParams();
  const archiveId = searchParams.get('archiveId');

  const [form, setForm] = useState({
    type: "quiz", matiere: "", theme: "", courseFourni: "",
    nombreQuestions: 5, niveau: "intermediaire",
    duree: "2 heures", bareme: "20 points",
  });
  const [generated, setGenerated] = useState("");
  const [editedContent, setEdited] = useState("");
  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");

  const update = (e) => setForm((cur) => ({ ...cur, [e.target.name]: e.target.value }));

  // Génération
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.matiere.trim() || !form.theme.trim()) {
      setError("La matière et le thème sont obligatoires."); return;
    }
    setError(""); setSuccess(""); setGenerated(""); setEdited("");
    setLoading(true);
    try {
      const payload = {
        matiere: form.matiere, type: form.type, theme: form.theme,
        ...(form.courseFourni.trim() ? { courseFourni: form.courseFourni } : {}),
        ...(form.type === "quiz"   ? { nombreQuestions: +form.nombreQuestions, niveau: form.niveau } : {}),
        ...(form.type === "examen" ? { duree: form.duree, bareme: form.bareme } : {}),
      };
      const data = archiveId ? await aiApi.generateFromArchive(archiveId, payload) : await aiApi.generate(payload);
      setGenerated(data.contenu);
      setEdited(data.contenu);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder en brouillon
  const handleSave = async () => {
    if (!editedContent.trim()) return;
    setSaving(true); setError(""); setSuccess("");
    try {
      const titre = `${form.type.charAt(0).toUpperCase() + form.type.slice(1)} — ${form.theme}`;
      await aiApi.save({ titre, type: form.type, matiere: form.matiere, theme: form.theme, contenu: editedContent });
      const isQuizType = ["quiz", "serie", "examen"].includes(form.type);
      setSuccess(
        isQuizType
          ? "✓ Sauvegardé en brouillon. Retrouvez-le dans \"Mes Exercices\"."
          : "✓ Sauvegardé en brouillon. Retrouvez-le dans \"Mes Cours\"."
      );
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  // Valider
  const handleValidate = async () => {
    if (!editedContent.trim()) return;
    setSaving(true); setError(""); setSuccess("");
    try {
      const titre = `${form.type.charAt(0).toUpperCase() + form.type.slice(1)} — ${form.theme}`;
      await aiApi.save({ titre, type: form.type, matiere: form.matiere, theme: form.theme, contenu: editedContent });
      const isQuizType = ["quiz", "serie", "examen"].includes(form.type);
      setSuccess(
        isQuizType
          ? "✓ Enregistré dans \"Mes Exercices\" ! Vous pouvez y ajouter des questions."
          : "✓ Enregistré dans \"Mes Cours\" ! Vous pouvez le valider depuis là-bas."
      );
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <section className="ai-generator-section">
      <div className="ai-generator-heading">
        <span className="dashboard-eyebrow">GÉNÉRATION IA</span>
        <h2>Générer un contenu pédagogique</h2>
        <p>Choisissez un type, saisissez une matière et un thème. L'IA génère le contenu en quelques secondes.</p>
      </div>

      {archiveId && (
        <div className="workspace-notice" role="status">
          📎 Génération depuis l'archive #{archiveId} — le contenu sera basé sur ce document.
        </div>
      )}

      <form className="ai-generator-form" onSubmit={handleGenerate}>

        {/* Sélecteur de type */}
        <div className="ai-type-selector">
          {CONTENT_TYPES.map((t) => (
            <label key={t.value} className={`ai-type-card${form.type === t.value ? " active" : ""}`}>
              <input type="radio" name="type" value={t.value} checked={form.type === t.value} onChange={update} />
              <span className="ai-type-icon">{t.icon}</span>
              <span>{t.label}</span>
            </label>
          ))}
        </div>

        {/* Matière + Thème */}
        <div className="ai-form-grid">
          <div className="form-group">
            <label htmlFor="matiere">Matière *</label>
            <input id="matiere" name="matiere" value={form.matiere} onChange={update}
              placeholder="Ex: Informatique, Mathématiques..." required />
          </div>
          <div className="form-group">
            <label htmlFor="theme">Thème *</label>
            <input id="theme" name="theme" value={form.theme} onChange={update}
              placeholder="Ex: Les algorithmes de tri..." required />
          </div>
        </div>

        {/* Paramètres quiz */}
        {form.type === "quiz" && (
          <div className="ai-form-grid">
            <div className="form-group">
              <label htmlFor="nombreQuestions">Nombre de questions</label>
              <input type="number" id="nombreQuestions" name="nombreQuestions"
                value={form.nombreQuestions} onChange={update} min={1} max={20} />
            </div>
            <div className="form-group">
              <label htmlFor="niveau">Niveau</label>
              <select id="niveau" name="niveau" value={form.niveau} onChange={update}>
                {NIVEAUX.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Paramètres examen */}
        {form.type === "examen" && (
          <div className="ai-form-grid">
            <div className="form-group">
              <label htmlFor="duree">Durée</label>
              <input id="duree" name="duree" value={form.duree} onChange={update} placeholder="Ex: 2 heures" />
            </div>
            <div className="form-group">
              <label htmlFor="bareme">Barème</label>
              <input id="bareme" name="bareme" value={form.bareme} onChange={update} placeholder="Ex: 20 points" />
            </div>
          </div>
        )}

        {/* Cours fourni */}
        <div className="form-group">
          <label htmlFor="courseFourni">
            Cours existant <small>(optionnel — si vide, l'IA génère depuis le thème)</small>
          </label>
          <textarea id="courseFourni" name="courseFourni" value={form.courseFourni} onChange={update}
            rows={4} placeholder="Collez ici le contenu d'un cours existant pour que l'IA s'en inspire..." />
        </div>

        {error && <p className="workspace-error" role="alert">{error}</p>}

        <button type="submit" className="workspace-button ai-generate-btn" disabled={loading}>
          {loading ? "⏳ Génération en cours..." : "✨ Générer avec l'IA"}
        </button>
      </form>

      {/* ── Zone résultat ── */}
      {generated && (
        <div className="ai-result">
          <div className="ai-result-heading">
            <h3>Contenu généré — modifiez-le si besoin avant de télécharger ou sauvegarder</h3>
          </div>

          <textarea
            className="ai-result-editor"
            value={editedContent}
            onChange={(e) => setEdited(e.target.value)}
            rows={20}
          />

          {/* ── Panneau d'export ── */}
          <ExportPanel form={form} editedContent={editedContent} />

          {/* ── Sauvegarde backend ── */}
          <div className="ai-result-actions">
            <button className="workspace-button secondary" onClick={handleSave} disabled={saving}>
              {saving ? "Sauvegarde..." : "💾 Sauvegarder en brouillon"}
            </button>
            <button className="workspace-button" onClick={handleValidate} disabled={saving}>
              {saving ? "Enregistrement..." : (
                ["quiz", "serie", "examen"].includes(form.type)
                  ? "✓ Enregistrer dans Mes Quiz"
                  : "✓ Enregistrer dans Mes Contenus"
              )}
            </button>
          </div>

          {success && (
            <div className="workspace-notice" role="status">
              <p>{success}</p>
              {["quiz", "serie", "examen"].includes(form.type)
                ? <a href="/quiz" className="workspace-button secondary" style={{display:"inline-block",marginTop:"8px"}}>→ Aller à Mes Exercices</a>
                : <a href="/contents" className="workspace-button secondary" style={{display:"inline-block",marginTop:"8px"}}>→ Aller à Mes Cours</a>
              }
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function AiGenerator() {
  const { user } = useAuth();
  const groups = user?.associations?.length ? user.associations : defaultGroups();
  const [tab, setTab] = useState("generate");

  return (
    <DashboardLayout activePage="ai" groups={groups}>
      <section className="ai-page-header">
        <div>
          <span className="dashboard-eyebrow">INTELLIGENCE ARTIFICIELLE</span>
          <h1>Assistant ExoCraft IA</h1>
          <p>Générez des cours, quiz, résumés, séries d'exercices et examens en quelques secondes.</p>
        </div>
      </section>

      <div className="ai-tabs">
        <button className={`ai-tab${tab === "generate" ? " active" : ""}`} onClick={() => setTab("generate")}>
          ✨ Générer un contenu
        </button>
        <button className={`ai-tab${tab === "chat" ? " active" : ""}`} onClick={() => setTab("chat")}>
          💬 Chat avec l'IA
        </button>
      </div>

      {tab === "generate" ? <AiGeneratorForm /> : <AiChat />}
    </DashboardLayout>
  );
}
