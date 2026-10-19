import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { archiveApi, quizApi, contentApi } from '../services/api';

export default function ArchivesAdmin() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── Onglet actif ─────────────────────────────────────
  const [tab, setTab] = useState('quiz'); // 'quiz' | 'contenus'

  // ── Archives fichiers ─────────────────────────────────
  const [archives, setArchives] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterMatiere, setFilterMatiere] = useState('');
  const [filterPromotion, setFilterPromotion] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({ file: null, matiere: '', promotion: '' });
  const [textPanel, setTextPanel] = useState({ archiveId: null, text: '' });

  // ── Quiz archivés ─────────────────────────────────────
  const [archivedQuizzes, setArchivedQuizzes] = useState([]);
  const [quizTotal, setQuizTotal] = useState(0);
  const [quizPage, setQuizPage] = useState(1);

  // ── Contenus archivés ─────────────────────────────────
  const [archivedContents, setArchivedContents] = useState([]);
  const [contentsTotal, setContentsTotal] = useState(0);
  const [contentsPage, setContentsPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const LIMIT = 10;

  // ── Chargements ───────────────────────────────────────
  const loadArchives = async () => {
    setLoading(true); setError('');
    try {
      const params = { page, limit: LIMIT };
      if (filterMatiere) params.matiere = filterMatiere;
      if (filterPromotion) params.promotion = filterPromotion;
      const result = await archiveApi.getAll(params);
      setArchives(result.data ?? []);
      setTotal(result.total ?? 0);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const loadArchivedQuizzes = async () => {
    setLoading(true); setError('');
    try {
      const result = await quizApi.getArchived({ page: quizPage, limit: LIMIT });
      setArchivedQuizzes(result.data ?? []);
      setQuizTotal(result.total ?? 0);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const loadArchivedContents = async () => {
    setLoading(true); setError('');
    try {
      const result = await contentApi.getArchived({ page: contentsPage, limit: LIMIT });
      setArchivedContents(result.data ?? []);
      setContentsTotal(result.total ?? 0);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (tab === 'fichiers') loadArchives(); }, [page, filterMatiere, filterPromotion, tab]);
  useEffect(() => { if (tab === 'quiz') loadArchivedQuizzes(); }, [quizPage, tab]);
  useEffect(() => { if (tab === 'contenus') loadArchivedContents(); }, [contentsPage, tab]);

  // ── Actions fichiers ──────────────────────────────────
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.file) { setError('Veuillez sélectionner un fichier.'); return; }
    setLoading(true); setError('');
    try {
      await archiveApi.upload(uploadForm.file, uploadForm.matiere, uploadForm.promotion);
      setNotice('Archive téléversée avec succès.');
      setUploadOpen(false);
      setUploadForm({ file: null, matiere: '', promotion: '' });
      loadArchives();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleViewText = async (id) => {
    if (textPanel.archiveId === id) { setTextPanel({ archiveId: null, text: '' }); return; }
    try {
      const result = await archiveApi.getTexte(id);
      setTextPanel({ archiveId: id, text: result.texte ?? '' });
    } catch (err) { alert(err.message); }
  };

  const handleDeleteArchive = async (id) => {
    if (!window.confirm('Supprimer cette archive ?')) return;
    try {
      await archiveApi.remove(id);
      if (textPanel.archiveId === id) setTextPanel({ archiveId: null, text: '' });
      loadArchives();
    } catch (err) { alert(err.message); }
  };

  // ── Désarchiver quiz ──────────────────────────────────
  const handleDesarchiverQuiz = async (id) => {
    try {
      await quizApi.desarchiver(id);
      setNotice('Quiz restauré dans "Mes Quiz".');
      loadArchivedQuizzes();
    } catch (err) { alert(err.message); }
  };

  const handleDeleteQuiz = async (id) => {
    if (!window.confirm('Supprimer définitivement ce quiz archivé ?')) return;
    try {
      await quizApi.remove(id);
      loadArchivedQuizzes();
    } catch (err) { alert(err.message); }
  };

  // ── Désarchiver contenu ───────────────────────────────
  const handleDesarchiverContent = async (id) => {
    try {
      await contentApi.desarchiver(id);
      setNotice('Contenu restauré dans "Mes Contenus".');
      loadArchivedContents();
    } catch (err) { alert(err.message); }
  };

  const handleDeleteContent = async (id) => {
    if (!window.confirm('Supprimer définitivement ce contenu archivé ?')) return;
    try {
      await contentApi.remove(id);
      loadArchivedContents();
    } catch (err) { alert(err.message); }
  };

  const totalPages      = Math.max(1, Math.ceil(total / LIMIT));
  const quizTotalPages  = Math.max(1, Math.ceil(quizTotal / LIMIT));
  const contTotalPages  = Math.max(1, Math.ceil(contentsTotal / LIMIT));

  return (
    <DashboardLayout activePage="archives">
      <div className="workspace-header">
        <div>
          <span className="dashboard-eyebrow">ARCHIVES</span>
          <h1>Archives</h1>
          <p>Consultez vos quiz et contenus archivés.</p>
        </div>
      </div>

      {notice && <p className="workspace-notice">{notice}</p>}
      {error  && <p className="workspace-error">{error}</p>}

      {/* ── Onglets ── */}
      <div className="tabs-row">
        <button className={`tab-btn${tab === 'quiz' ? ' active' : ''}`} onClick={() => setTab('quiz')}>
          📦 Quiz archivés {quizTotal > 0 && <span className="tab-count">{quizTotal}</span>}
        </button>
        <button className={`tab-btn${tab === 'contenus' ? ' active' : ''}`} onClick={() => setTab('contenus')}>
          📦 Contenus archivés {contentsTotal > 0 && <span className="tab-count">{contentsTotal}</span>}
        </button>
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/* ONGLET : QUIZ ARCHIVÉS                             */}
      {/* ══════════════════════════════════════════════════ */}
      {tab === 'quiz' && (
        <>
          {loading && <p>Chargement...</p>}
          {!loading && archivedQuizzes.length === 0 && (
            <div className="workspace-empty">
              <span>📦</span>
              <h3>Aucun quiz archivé</h3>
              <p>Les quiz que vous archivez depuis "Mes Quiz" apparaîtront ici.</p>
            </div>
          )}
          <div className="workspace-cards">
            {archivedQuizzes.map((q) => (
              <div key={q.id} className="workspace-card archived-card">
                <div className="workspace-card-top">
                  <span className="workspace-badge">{q.matiere}</span>
                  <span className="workspace-badge">{q.niveau}</span>
                  <span className="workspace-badge archived-badge">📦 Archivé</span>
                </div>
                <h3>{q.titre}</h3>
                <p>{q.theme}</p>
                <small>
                  Archivé le {q.archivedAt ? new Date(q.archivedAt).toLocaleDateString('fr-FR') : '—'}
                </small>
                <div className="workspace-card-actions">
                  <button onClick={() => handleDesarchiverQuiz(q.id)}>↩ Restaurer</button>
                  <button className="delete" onClick={() => handleDeleteQuiz(q.id)}>Supprimer définitivement</button>
                </div>
              </div>
            ))}
          </div>
          {quizTotalPages > 1 && (
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24, alignItems: 'center' }}>
              <button className="workspace-button secondary" onClick={() => setQuizPage((p) => Math.max(1, p - 1))} disabled={quizPage <= 1}>← Précédent</button>
              <span style={{ color: '#69647b', fontSize: 14 }}>Page {quizPage} / {quizTotalPages}</span>
              <button className="workspace-button secondary" onClick={() => setQuizPage((p) => Math.min(quizTotalPages, p + 1))} disabled={quizPage >= quizTotalPages}>Suivant →</button>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* ONGLET : CONTENUS ARCHIVÉS                         */}
      {/* ══════════════════════════════════════════════════ */}
      {tab === 'contenus' && (
        <>
          {loading && <p>Chargement...</p>}
          {!loading && archivedContents.length === 0 && (
            <div className="workspace-empty">
              <span>📦</span>
              <h3>Aucun contenu archivé</h3>
              <p>Les contenus que vous archivez depuis "Mes Contenus" apparaîtront ici.</p>
            </div>
          )}
          <div className="workspace-cards">
            {archivedContents.map((c) => (
              <div key={c.id} className="workspace-card archived-card">
                <div className="workspace-card-top">
                  <span className="workspace-badge">{c.type}</span>
                  <span className="workspace-badge">{c.matiere}</span>
                  <span className="workspace-badge archived-badge">📦 Archivé</span>
                </div>
                <h3>{c.titre}</h3>
                <p>{c.theme}</p>
                <small>
                  Archivé le {c.archivedAt ? new Date(c.archivedAt).toLocaleDateString('fr-FR') : '—'}
                </small>
                <div className="workspace-card-actions">
                  <button onClick={() => handleDesarchiverContent(c.id)}>↩ Restaurer</button>
                  <button className="delete" onClick={() => handleDeleteContent(c.id)}>Supprimer définitivement</button>
                </div>
              </div>
            ))}
          </div>
          {contTotalPages > 1 && (
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24, alignItems: 'center' }}>
              <button className="workspace-button secondary" onClick={() => setContentsPage((p) => Math.max(1, p - 1))} disabled={contentsPage <= 1}>← Précédent</button>
              <span style={{ color: '#69647b', fontSize: 14 }}>Page {contentsPage} / {contTotalPages}</span>
              <button className="workspace-button secondary" onClick={() => setContentsPage((p) => Math.min(contTotalPages, p + 1))} disabled={contentsPage >= contTotalPages}>Suivant →</button>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
