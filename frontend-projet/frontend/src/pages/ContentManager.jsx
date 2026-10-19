import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { contentApi, exportApi } from '../services/api';

const CONTENT_TYPES = [
  { value: '', label: 'Tous les types' },
  { value: 'cours', label: 'Cours' },
  { value: 'resume', label: 'Résumé' },
];

// ── Content form ──────────────────────────────────────────────────────────────
const COURSE_TYPES = [
  { value: 'cours',  label: 'Cours',   icon: '📘' },
  { value: 'resume', label: 'Résumé',  icon: '📄' },
];

function ContentForm({ initial, onSaved, onCancel }) {
  const { user } = useAuth();

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

  const update = (e) => setForm((cur) => ({ ...cur, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, theme: form.classe };
      if (initial?.id) {
        await contentApi.update(initial.id, payload);
      } else {
        await contentApi.create(payload);
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

        {/* Sélecteur de type — seulement à la création */}
        {!initial?.id && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontWeight: 600, fontSize: 13, color: '#45405f', marginBottom: 10 }}>Type de contenu *</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {COURSE_TYPES.map((t) => (
                <label
                  key={t.value}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                    padding: '10px 18px', borderRadius: 10,
                    border: form.type === t.value ? '2px solid #6c47ff' : '2px solid #dcd9e7',
                    background: form.type === t.value ? '#f3f0ff' : '#fff',
                    fontWeight: 600, fontSize: 14, color: '#30247d',
                    transition: 'all 0.15s',
                  }}
                >
                  <input type="radio" name="type" value={t.value} checked={form.type === t.value} onChange={update} style={{ display: 'none' }} />
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
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
            <input name="matiere" value={form.matiere} onChange={update} placeholder="Ex : Informatique" required />
          </label>
          <label>
            Classe *
            {classeOptions.length > 0 ? (
              <select name="classe" value={form.classe} onChange={update} required>
                {classeOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            ) : (
              <input name="classe" value={form.classe} onChange={update} placeholder="Ex : 3ème A, L2 Info..." required />
            )}
          </label>
        </div>

        <div className="workspace-body-field">
          <label>
            Contenu
            <textarea name="contenu" value={form.contenu} onChange={update} rows={14}
              placeholder="Rédigez le contenu ici, ou laissez vide pour le compléter plus tard..." />
          </label>
        </div>

        {/* Export — seulement en mode édition */}
        {initial?.id && (
          <div className="quiz-export-panel" style={{ marginTop: 20 }}>
            <strong style={{ width: '100%', color: '#4c416d', fontSize: 14 }}>📥 Télécharger</strong>
            <button type="button" className="quiz-export-btn"
              onClick={() => exportApi.download(exportApi.contentPdfUrl(initial.id))}>
              📄 PDF
            </button>
            <button type="button" className="quiz-export-btn"
              onClick={() => exportApi.download(exportApi.contentWordUrl(initial.id))}>
              📝 Word
            </button>
          </div>
        )}

        {error && <p className="workspace-error" style={{ marginTop: 12 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button type="submit" className="workspace-button" disabled={saving}>
            {saving ? 'Enregistrement...' : initial?.id ? '💾 Enregistrer' : 'Créer'}
          </button>
          <button type="button" className="workspace-button secondary" onClick={onCancel}>
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}

// ── View panel (lecture seule) ────────────────────────────────────────────────
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
        <div className="workspace-preview-body" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
          {item.contenu
            ? item.contenu
            : <em style={{ color: '#69647b' }}>Aucun contenu pour l'instant. Cliquez sur "Modifier" pour en ajouter.</em>
          }
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ContentManager() {
  const { user } = useAuth();

  // Classes de l'utilisateur pour le filtre
  const classeOptions = user?.associations?.length
    ? [...new Set(user.associations.map((a) => `${a.className}${a.section !== 'Tronc commun' ? ' — ' + a.section : ''}`))]
    : [];

  const [activeTab, setActiveTab] = useState('mes-contenus');
  const [panel, setPanel] = useState(null); // null | 'view' | 'create' | 'edit'
  const [selected, setSelected] = useState(null);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
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
      const apiFn = activeTab === 'public' ? contentApi.getPublic : contentApi.getMesContenus;
      const result = await apiFn(params);
      let data = result.data ?? [];

      // Filtre recherche côté client
      if (search.trim()) {
        data = data.filter((c) =>
          c.titre?.toLowerCase().includes(search.toLowerCase()) ||
          c.theme?.toLowerCase().includes(search.toLowerCase())
        );
      }
      // Filtre classe côté client (stockée dans theme)
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

  useEffect(() => { loadContents(); }, [page, activeTab, typeFilter, classeFilter, search]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setPanel(null);
    setSelected(null);
  };

  const handleAction = async (action, id) => {
    try {
      if (action === 'archiver') {
        if (!window.confirm('Archiver ce contenu ? Il sera déplacé vers les Archives.')) return;
        await contentApi.archiver(id);
      }
      loadContents();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce contenu ?')) return;
    try {
      await contentApi.remove(id);
      loadContents();
    } catch (err) {
      alert(err.message);
    }
  };

  const openView = async (id) => {
    try {
      const data = await contentApi.getOne(id);
      setSelected(data);
      setPanel('view');
    } catch (err) {
      alert(err.message);
    }
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
        {panel === null && activeTab === 'mes-contenus' && (
          <button className="workspace-button" onClick={() => setPanel('create')}>
            + Créer un cours
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs-row">
        <button className={`tab-btn${activeTab === 'mes-contenus' ? ' active' : ''}`} onClick={() => handleTabChange('mes-contenus')}>
          Mes cours
        </button>
        <button className={`tab-btn${activeTab === 'public' ? ' active' : ''}`} onClick={() => handleTabChange('public')}>
          Cours publics
        </button>
      </div>

      {panel === 'create' && (
        <ContentForm
          initial={null}
          onSaved={() => { setPanel(null); loadContents(); }}
          onCancel={() => setPanel(null)}
        />
      )}

      {panel === 'edit' && selected && (
        <ContentForm
          initial={selected}
          onSaved={() => { setPanel(null); setSelected(null); loadContents(); }}
          onCancel={() => { setPanel(null); setSelected(null); }}
        />
      )}

      {panel === 'view' && selected && (
        <ContentView
          item={selected}
          onBack={() => { setPanel(null); setSelected(null); }}
        />
      )}

      {panel === null && (
        <>
          {/* Filtres */}
          <div className="workspace-filters">
            <label>
              Recherche
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Rechercher par titre..."
              />
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
                  {classeOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={classeFilter}
                  onChange={(e) => { setClasseFilter(e.target.value); setPage(1); }}
                  placeholder="Filtrer par classe..."
                />
              )}
            </label>
          </div>

          {error && <p className="workspace-error">{error}</p>}
          {loading && <p>Chargement...</p>}

          {!loading && items.length === 0 && (
            <div className="workspace-empty">
              <span>📄</span>
              <h3>Aucun contenu trouvé</h3>
              <p>
                {activeTab === 'mes-contenus'
                  ? 'Créez votre premier cours en cliquant sur « + Créer un cours ».'
                  : 'Aucun cours public disponible pour le moment.'}
              </p>
            </div>
          )}

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
                <small>{c.dateCreation ? new Date(c.dateCreation).toLocaleDateString('fr-FR') : ''}</small>
                <div className="workspace-card-actions">
                  <button onClick={() => openView(c.id)}>Voir</button>
                  {activeTab === 'mes-contenus' && (
                    <button onClick={async () => {
                      try {
                        const data = await contentApi.getOne(c.id);
                        setSelected(data);
                        setPanel('edit');
                      } catch (err) { alert(err.message); }
                    }}>
                      Modifier
                    </button>
                  )}
                  {activeTab === 'mes-contenus' && (
                    <button className="archive" onClick={() => handleAction('archiver', c.id)}>📦 Archiver</button>
                  )}
                  {activeTab === 'mes-contenus' && (
                    <button className="delete" onClick={() => handleDelete(c.id)}>Supprimer</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24, alignItems: 'center' }}>
              <button className="workspace-button secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                ← Précédent
              </button>
              <span style={{ color: '#69647b', fontSize: 14 }}>Page {page} / {totalPages}</span>
              <button className="workspace-button secondary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                Suivant →
              </button>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
