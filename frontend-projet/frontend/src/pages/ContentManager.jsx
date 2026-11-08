import { useState, useEffect, useRef, useMemo } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { contentApi, exportApi } from '../services/api';
import useMatieres from '../hooks/useMatieres';

const CONTENT_TYPES = [
  { value: '', label: 'Tous les types' },
  { value: 'cours', label: 'Cours' },
  { value: 'resume', label: 'Résumé' },
];

const COURSE_TYPES = [
  { value: 'cours',  label: 'Cours',   icon: '📘' },
  { value: 'resume', label: 'Résumé',  icon: '📄' },
];

// ── Formulaire création / édition ─────────────────────────────────────────────
function ContentForm({ initial, onSaved, onCancel }) {
  const { user } = useAuth();
  const { matieres: mesMatieres, promos: mesPromos } = useMatieres();

  const classeOptions = user?.associations?.length
    ? [...new Set(user.associations.map((a) => `${a.className}${a.section !== 'Tronc commun' ? ' — ' + a.section : ''}`))]
    : [];

  const [form, setForm] = useState(
    initial
      ? { titre: initial.titre || '', type: initial.type || 'cours', matiere: initial.matiere || '', classe: initial.theme || (classeOptions[0] ?? ''), contenu: initial.contenu || '' }
      : { titre: '', type: 'cours', matiere: '', classe: classeOptions[0] ?? '', contenu: '' }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [pendingFile, setPendingFile] = useState(null); // fichier original à conserver
  const fileInputRef = useRef(null);
  // Adresse locale du fichier choisi : permet de le télécharger avant l'enregistrement
  const pendingUrl = useMemo(() => (pendingFile ? URL.createObjectURL(pendingFile) : ''), [pendingFile]);
  useEffect(() => () => { if (pendingUrl) URL.revokeObjectURL(pendingUrl); }, [pendingUrl]);

  const update = (e) => setForm((cur) => ({ ...cur, [e.target.name]: e.target.value }));

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtracting(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const token = localStorage.getItem('exocraft_token');
      const res = await fetch('/api/ai/extract-text', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Erreur extraction');
      }
      const data = await res.json();
      setForm((cur) => ({ ...cur, contenu: data.texte }));
      setPendingFile(file);
    } catch (err) {
      setError("Impossible d'extraire le texte : " + err.message);
    } finally {
      setExtracting(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, theme: form.classe };
      let contentId = initial?.id;
      if (initial?.id) {
        await contentApi.update(initial.id, payload);
      } else {
        const created = await contentApi.create(payload);
        contentId = created?.id;
      }
      // Conserver le PDF / Word d'origine sur le serveur
      if (pendingFile && contentId) {
        await contentApi.uploadFichier(contentId, pendingFile);
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="workspace-editor">
      <h2 style={{ marginBottom: 20 }}>{initial?.id ? 'Modifier le cours' : 'Créer un cours'}</h2>
      <form onSubmit={handleSubmit}>

        {!initial?.id && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontWeight: 600, fontSize: 13, color: '#45405f', marginBottom: 10 }}>Type de contenu *</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {COURSE_TYPES.map((t) => (
                <label key={t.value} style={{
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                  padding: '10px 18px', borderRadius: 10,
                  border: form.type === t.value ? '2px solid #6c47ff' : '2px solid #dcd9e7',
                  background: form.type === t.value ? '#f3f0ff' : '#fff',
                  fontWeight: 600, fontSize: 14, color: '#30247d', transition: 'all 0.15s',
                }}>
                  <input type="radio" name="type" value={t.value} checked={form.type === t.value} onChange={update} style={{ display: 'none' }} />
                  <span>{t.icon}</span><span>{t.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="workspace-form-grid">
          <label>
            Titre *
            <input name="titre" value={form.titre} onChange={update} placeholder="Ex : Introduction aux algorithmes" required />
          </label>
          <label>
            Matière *
            {mesMatieres.length > 0 ? (
              <select name="matiere" value={form.matiere} onChange={update} required>
                <option value="">— Choisir une matière —</option>
                {mesMatieres.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            ) : (
              <input name="matiere" value={form.matiere} onChange={update} placeholder="Ex : Informatique" required />
            )}
          </label>
          <label>
            Classe *
            {mesPromos.length > 0 ? (
              <select name="classe" value={form.classe} onChange={update} required>
                <option value="">— Choisir une classe —</option>
                {mesPromos.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            ) : classeOptions.length > 0 ? (
              <select name="classe" value={form.classe} onChange={update} required>
                {classeOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : (
              <input name="classe" value={form.classe} onChange={update} placeholder="Ex : 3ème A, L2 Info..." required />
            )}
          </label>
        </div>

        <div className="workspace-body-field">
          <label>
            Contenu
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={extracting}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8,
                  border: '1.5px dashed #6252ed', background: '#f5f3ff',
                  color: '#6252ed', fontWeight: 600, fontSize: 12,
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                {extracting ? '⏳ Extraction...' : '📎 Importer un PDF ou Word'}
              </button>
              <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx"
                style={{ display: 'none' }} onChange={handleFileUpload} />
            </div>
            <textarea name="contenu" value={form.contenu} onChange={update}
              rows={form.contenu ? 18 : 14}
              placeholder="Rédigez le contenu ici, importez un PDF/Word ci-dessus, ou laissez vide..."
              style={{ transition: 'height 0.3s ease' }} />
          </label>
        </div>

        {pendingFile && (
          <div className="quiz-export-panel" style={{ marginTop: 16 }}>
            <strong style={{ width: '100%', color: '#4c416d', fontSize: 14 }}>📎 Fichier importé</strong>
            <a className="quiz-export-btn" style={{ textDecoration: 'none' }}
              href={pendingUrl} download={pendingFile.name} title="Cliquer pour télécharger">
              {fileIcon(pendingFile.name)} {pendingFile.name}
            </a>
            <span style={{ fontSize: 12, color: '#00b894', fontWeight: 600, alignSelf: 'center' }}>
              ✓ sera conservé à l'enregistrement
            </span>
          </div>
        )}

        {initial?.id && (
          <div className="quiz-export-panel" style={{ marginTop: 20 }}>
            <strong style={{ width: '100%', color: '#4c416d', fontSize: 14 }}>📥 Télécharger</strong>
            <button type="button" className="quiz-export-btn"
              onClick={() => exportApi.download(exportApi.contentPdfUrl(initial.id))}>📄 PDF</button>
            <button type="button" className="quiz-export-btn"
              onClick={() => exportApi.download(exportApi.contentWordUrl(initial.id))}>📝 Word</button>
            {initial.fichierNom && (
              <a className="quiz-export-btn" style={{ textDecoration: 'none' }}
                href={contentApi.fichierUrl(initial.id)} download={initial.fichierNom}
                title="Télécharger le fichier d'origine">
                {fileIcon(initial.fichierNom)} Fichier original
              </a>
            )}
          </div>
        )}

        {error && <p className="workspace-error" style={{ marginTop: 12 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button type="submit" className="workspace-button" disabled={saving}>
            {saving ? 'Enregistrement...' : initial?.id ? '💾 Enregistrer' : 'Créer'}
          </button>
          <button type="button" className="workspace-button secondary" onClick={onCancel}>Annuler</button>
        </div>
      </form>
    </div>
  );
}

// Icône selon le type du fichier d'origine
const fileIcon = (nom = '') => (nom.toLowerCase().endsWith('.pdf') ? '📕' : '📘');

// ── Vue lecture seule ─────────────────────────────────────────────────────────
function ContentView({ item, onBack }) {
  return (
    <div>
      <button className="workspace-button secondary" onClick={onBack} style={{ marginBottom: 20 }}>
        ← Retour à la liste
      </button>
      <div className="workspace-preview">
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <span className="workspace-badge">{item.type}</span>
          <span className="workspace-badge">{item.matiere}</span>
          {item.theme && <span className="workspace-badge">{item.theme}</span>}
          <span className={`workspace-badge${item.statut === 'valide' ? ' valid' : ''}`}>{item.statut}</span>
        </div>
        <h2 style={{ marginBottom: 16 }}>{item.titre}</h2>
        {item.fichierNom && (
          <a className="quiz-export-btn" href={contentApi.fichierUrl(item.id)} download={item.fichierNom}
            style={{ display: 'inline-block', marginBottom: 16, textDecoration: 'none' }}
            title="Cliquer pour télécharger">
            {fileIcon(item.fichierNom)} {item.fichierNom}
          </a>
        )}
        <div className="workspace-preview-body" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
          {item.contenu
            ? item.contenu
            : <em style={{ color: '#69647b' }}>Aucun contenu. Cliquez sur "Modifier" pour en ajouter.</em>
          }
        </div>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function ContentManager() {
  const { user } = useAuth();
  const { promos: mesPromos } = useMatieres();

  // Classes du filtre = classes associées par l'admin
  const classeOptions = mesPromos;

  const [panel, setPanel] = useState(null); // null | 'view' | 'create' | 'edit'
  const [selected, setSelected] = useState(null);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [matiere, setMatiere] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [classeFilter, setClasseFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const LIMIT = 10;

  const loadContents = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: LIMIT };
      if (typeFilter) params.type = typeFilter;
      const result = await contentApi.getMesContenus(params);
      let data = result.data ?? [];

      if (matiere.trim()) {
        data = data.filter((c) =>
          c.matiere?.toLowerCase().includes(matiere.toLowerCase()) ||
          c.titre?.toLowerCase().includes(matiere.toLowerCase())
        );
      }
      if (classeFilter) {
        data = data.filter((c) =>
          c.theme?.toLowerCase().includes(classeFilter.toLowerCase())
        );
      }

      setItems(data);
      setTotal(result.total ?? 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadContents(); }, [page, typeFilter, classeFilter, matiere]);

  const handleAction = async (action, id) => {
    try {
      if (action === 'archiver') {
        if (!window.confirm('Archiver ce contenu ? Il sera déplacé vers les Archives.')) return;
        await contentApi.archiver(id);
      }
      loadContents();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce contenu ?')) return;
    try {
      await contentApi.remove(id);
      loadContents();
    } catch (err) { alert(err.message); }
  };

  const openView = async (id) => {
    try {
      const data = await contentApi.getOne(id);
      setSelected(data);
      setPanel('view');
    } catch (err) { alert(err.message); }
  };

  const openEdit = async (id) => {
    try {
      const data = await contentApi.getOne(id);
      setSelected(data);
      setPanel('edit');
    } catch (err) { alert(err.message); }
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <DashboardLayout activePage="contents">
      <div className="workspace-header">
        <div>
          <span className="dashboard-eyebrow">CONTENUS</span>
          <h1>Mes Cours</h1>
          <p>Créez, organisez et exportez vos contenus pédagogiques.</p>
        </div>
        {panel === null && (
          <button className="workspace-button" onClick={() => setPanel('create')}>
            + Créer un cours
          </button>
        )}
      </div>

      {panel === 'create' && (
        <ContentForm initial={null}
          onSaved={() => { setPanel(null); loadContents(); }}
          onCancel={() => setPanel(null)} />
      )}

      {panel === 'edit' && selected && (
        <ContentForm initial={selected}
          onSaved={() => { setPanel(null); setSelected(null); loadContents(); }}
          onCancel={() => { setPanel(null); setSelected(null); }} />
      )}

      {panel === 'view' && selected && (
        <ContentView item={selected} onBack={() => { setPanel(null); setSelected(null); }} />
      )}

      {panel === null && (
        <>
          {/* Filtres — même structure que QuizManager */}
          <div className="workspace-filters">
            <label>
              Matière
              <input type="text" value={matiere}
                onChange={(e) => { setMatiere(e.target.value); setPage(1); }}
                placeholder="Filtrer par matière..." />
            </label>
            <label>
              Type
              <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
                {CONTENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </label>
            <label>
              Classe
              {classeOptions.length > 0 ? (
                <select value={classeFilter} onChange={(e) => { setClasseFilter(e.target.value); setPage(1); }}>
                  <option value="">Toutes les classes</option>
                  {classeOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <input type="text" value={classeFilter}
                  onChange={(e) => { setClasseFilter(e.target.value); setPage(1); }}
                  placeholder="Filtrer par classe..." />
              )}
            </label>
          </div>

          {error && <p className="workspace-error">{error}</p>}
          {loading && <p>Chargement...</p>}

          {!loading && items.length === 0 && (
            <div className="workspace-empty">
              <span>📘</span>
              <h3>Aucun cours trouvé</h3>
              <p>Créez votre premier cours en cliquant sur « + Créer un cours ».</p>
            </div>
          )}

          {/* Cartes — identiques à QuizManager */}
          <div className="workspace-cards">
            {items.map((c) => (
              <div key={c.id} className="workspace-card">
                <div className="workspace-card-top">
                  <span className="workspace-badge">{c.type}</span>
                  {c.theme && <span className="workspace-badge">{c.theme}</span>}
                  <span className={`workspace-badge${c.statut === 'valide' ? ' valid' : ''}`}>{c.statut}</span>
                </div>
                <h3>{c.titre}</h3>
                <p>{c.matiere}</p>
                {c.fichierNom && (
                  <a className="quiz-export-btn" href={contentApi.fichierUrl(c.id)} download={c.fichierNom}
                    style={{ display: 'inline-block', textDecoration: 'none', margin: '6px 0' }}
                    title="Télécharger le fichier original">
                    {fileIcon(c.fichierNom)} {c.fichierNom}
                  </a>
                )}
                <small>{c.dateCreation ? new Date(c.dateCreation).toLocaleDateString('fr-FR') : ''}</small>
                <div className="workspace-card-actions">
                  <button onClick={() => openView(c.id)}>Voir</button>
                  <button onClick={() => openEdit(c.id)}>Modifier</button>
                  <button className="archive" onClick={() => handleAction('archiver', c.id)}>📦 Archiver</button>
                  <button className="delete" onClick={() => handleDelete(c.id)}>Supprimer</button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24, alignItems: 'center' }}>
              <button className="workspace-button secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                ← Précédent
              </button>
              <span style={{ color: '#69647b', fontSize: 14 }}>Page {page} / {totalPages}</span>
              <button className="workspace-button secondary"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                Suivant →
              </button>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
