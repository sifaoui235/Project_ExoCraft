import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { adminApi, matiereApi, promotionApi } from '../services/api';

// ── Inline assign form ───────────────────────────────────────────────────────
function AssignForm({ label, onSave, onClose }) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(value.split(',').map((s) => s.trim()).filter(Boolean));
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="admin-assign-form" onSubmit={handleSubmit}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={`${label} séparés par des virgules`}
      />
      <button type="submit" className="workspace-button" style={{ padding: '7px 12px', minHeight: 'auto', fontSize: 12 }} disabled={saving}>
        {saving ? '...' : 'Sauvegarder'}
      </button>
      <button type="button" className="workspace-button secondary" style={{ padding: '7px 12px', minHeight: 'auto', fontSize: 12 }} onClick={onClose}>
        Annuler
      </button>
    </form>
  );
}

// ── Inline CRUD row for matieres/promotions ──────────────────────────────────
function CrudRow({ item, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ nom: item.nom || '', description: item.description || '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onUpdate(item.id, form);
      setEditing(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <tr>
        <td>{item.id}</td>
        <td>
          <input
            value={form.nom}
            onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
            style={{ border: '1px solid #dcd9e7', borderRadius: 6, padding: '5px 8px', fontSize: 13, width: '100%' }}
          />
        </td>
        <td>
          <input
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            style={{ border: '1px solid #dcd9e7', borderRadius: 6, padding: '5px 8px', fontSize: 13, width: '100%' }}
          />
        </td>
        <td>
          <button
            className="workspace-button"
            style={{ padding: '5px 10px', minHeight: 'auto', fontSize: 12, marginRight: 6 }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '...' : 'Sauvegarder'}
          </button>
          <button
            className="workspace-button secondary"
            style={{ padding: '5px 10px', minHeight: 'auto', fontSize: 12 }}
            onClick={() => setEditing(false)}
          >
            Annuler
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td>{item.id}</td>
      <td>{item.nom}</td>
      <td>{item.description}</td>
      <td>
        <button
          className="workspace-button secondary"
          style={{ padding: '5px 10px', minHeight: 'auto', fontSize: 12, marginRight: 6 }}
          onClick={() => setEditing(true)}
        >
          Modifier
        </button>
        <button
          className="workspace-button secondary"
          style={{ padding: '5px 10px', minHeight: 'auto', fontSize: 12, color: '#b43c47', borderColor: '#efd7da' }}
          onClick={() => onDelete(item.id)}
        >
          Supprimer
        </button>
      </td>
    </tr>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user } = useAuth();

  // Guard: only administrators
  if (user?.role !== 'administrateur') {
    return <Navigate to="/dashboard" replace />;
  }

  const [dashStats, setDashStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Inline assign panels per user
  const [assignPanel, setAssignPanel] = useState({}); // { userId: 'matieres' | 'promotions' | null }

  // New matiere/promotion form
  const [newMatiere, setNewMatiere] = useState({ nom: '', description: '' });
  const [newPromotion, setNewPromotion] = useState({ nom: '', description: '' });

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [stats, usersData, matieresData, promotionsData] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getUsers(),
        matiereApi.getAll(),
        promotionApi.getAll(),
      ]);
      setDashStats(stats);
      setUsers(usersData ?? []);
      setMatieres(matieresData ?? []);
      setPromotions(promotionsData ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return;
    try {
      await adminApi.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleAssign = (userId, type) => {
    setAssignPanel((prev) => ({
      ...prev,
      [userId]: prev[userId] === type ? null : type,
    }));
  };

  const handleCreateMatiere = async (e) => {
    e.preventDefault();
    try {
      await matiereApi.create(newMatiere);
      setNewMatiere({ nom: '', description: '' });
      const data = await matiereApi.getAll();
      setMatieres(data ?? []);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreatePromotion = async (e) => {
    e.preventDefault();
    try {
      await promotionApi.create(newPromotion);
      setNewPromotion({ nom: '', description: '' });
      const data = await promotionApi.getAll();
      setPromotions(data ?? []);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteMatiere = async (id) => {
    if (!window.confirm('Supprimer cette matière ?')) return;
    try {
      await matiereApi.remove(id);
      setMatieres((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeletePromotion = async (id) => {
    if (!window.confirm('Supprimer cette promotion ?')) return;
    try {
      await promotionApi.remove(id);
      setPromotions((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <DashboardLayout activePage="admin">
      <div className="workspace-header">
        <div>
          <span className="dashboard-eyebrow">ADMINISTRATION</span>
          <h1>Tableau de bord admin</h1>
          <p>Gérez les utilisateurs, les matières et les promotions.</p>
        </div>
      </div>

      {error && <p className="workspace-error">{error}</p>}
      {loading && <p>Chargement...</p>}

      {/* Stats */}
      {dashStats && (
        <div className="workspace-stats">
          {Object.entries(dashStats).map(([key, value]) => (
            <div key={key}>
              <span>{key}</span>
              <strong>{typeof value === 'object' ? JSON.stringify(value) : value}</strong>
            </div>
          ))}
        </div>
      )}

      {/* Users section */}
      <div className="admin-section">
        <h2>Utilisateurs</h2>
        {users.length === 0 && !loading && <p style={{ color: '#69647b' }}>Aucun utilisateur.</p>}
        {users.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Prénom</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.lastName || u.nom}</td>
                    <td>{u.firstName || u.prenom}</td>
                    <td>{u.email}</td>
                    <td><span className="workspace-badge">{u.role}</span></td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button
                            className="workspace-button secondary"
                            style={{ padding: '5px 10px', minHeight: 'auto', fontSize: 12, color: '#b43c47', borderColor: '#efd7da' }}
                            onClick={() => handleDeleteUser(u.id)}
                          >
                            Supprimer
                          </button>
                          <button
                            className="workspace-button secondary"
                            style={{ padding: '5px 10px', minHeight: 'auto', fontSize: 12 }}
                            onClick={() => toggleAssign(u.id, 'matieres')}
                          >
                            Assigner matières
                          </button>
                          <button
                            className="workspace-button secondary"
                            style={{ padding: '5px 10px', minHeight: 'auto', fontSize: 12 }}
                            onClick={() => toggleAssign(u.id, 'promotions')}
                          >
                            Assigner promotions
                          </button>
                        </div>

                        {assignPanel[u.id] === 'matieres' && (
                          <AssignForm
                            label="Matières"
                            onSave={(list) => adminApi.assignerMatieres(u.id, list)}
                            onClose={() => toggleAssign(u.id, 'matieres')}
                          />
                        )}
                        {assignPanel[u.id] === 'promotions' && (
                          <AssignForm
                            label="Promotions"
                            onSave={(list) => adminApi.assignerPromotions(u.id, list)}
                            onClose={() => toggleAssign(u.id, 'promotions')}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Matières section */}
      <div className="admin-section">
        <h2>Matières</h2>

        {/* Create form */}
        <form onSubmit={handleCreateMatiere} style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Nom de la matière *"
            value={newMatiere.nom}
            onChange={(e) => setNewMatiere((f) => ({ ...f, nom: e.target.value }))}
            required
            style={{ border: '1px solid #dcd9e7', borderRadius: 8, padding: '9px 12px', font: 'inherit', fontSize: 13, minWidth: 160 }}
          />
          <input
            type="text"
            placeholder="Description"
            value={newMatiere.description}
            onChange={(e) => setNewMatiere((f) => ({ ...f, description: e.target.value }))}
            style={{ border: '1px solid #dcd9e7', borderRadius: 8, padding: '9px 12px', font: 'inherit', fontSize: 13, minWidth: 200 }}
          />
          <button type="submit" className="workspace-button" style={{ padding: '9px 16px', minHeight: 'auto' }}>
            Créer
          </button>
        </form>

        {matieres.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nom</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {matieres.map((m) => (
                  <CrudRow
                    key={m.id}
                    item={m}
                    onUpdate={async (id, data) => {
                      await matiereApi.update(id, data);
                      const updated = await matiereApi.getAll();
                      setMatieres(updated ?? []);
                    }}
                    onDelete={handleDeleteMatiere}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
        {matieres.length === 0 && !loading && <p style={{ color: '#69647b' }}>Aucune matière.</p>}
      </div>

      {/* Promotions section */}
      <div className="admin-section">
        <h2>Promotions</h2>

        {/* Create form */}
        <form onSubmit={handleCreatePromotion} style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Nom de la promotion *"
            value={newPromotion.nom}
            onChange={(e) => setNewPromotion((f) => ({ ...f, nom: e.target.value }))}
            required
            style={{ border: '1px solid #dcd9e7', borderRadius: 8, padding: '9px 12px', font: 'inherit', fontSize: 13, minWidth: 160 }}
          />
          <input
            type="text"
            placeholder="Description"
            value={newPromotion.description}
            onChange={(e) => setNewPromotion((f) => ({ ...f, description: e.target.value }))}
            style={{ border: '1px solid #dcd9e7', borderRadius: 8, padding: '9px 12px', font: 'inherit', fontSize: 13, minWidth: 200 }}
          />
          <button type="submit" className="workspace-button" style={{ padding: '9px 16px', minHeight: 'auto' }}>
            Créer
          </button>
        </form>

        {promotions.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nom</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {promotions.map((p) => (
                  <CrudRow
                    key={p.id}
                    item={p}
                    onUpdate={async (id, data) => {
                      await promotionApi.update(id, data);
                      const updated = await promotionApi.getAll();
                      setPromotions(updated ?? []);
                    }}
                    onDelete={handleDeletePromotion}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
        {promotions.length === 0 && !loading && <p style={{ color: '#69647b' }}>Aucune promotion.</p>}
      </div>
    </DashboardLayout>
  );
}
