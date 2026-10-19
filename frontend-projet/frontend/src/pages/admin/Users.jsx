import React, { useState, useEffect, useCallback } from 'react'
import { usersApi, formatDateTime, timeAgo } from '../../services/adminApi'

function getInitials(prenom, nom) {
  const p = prenom || ''
  const n = nom || ''
  return ((p[0] ?? '') + (n[0] ?? '')).toUpperCase()
}

const avatarColors = ['#6c5ce7', '#4a90e2', '#00b894', '#f39c12', '#e17055', '#a29bfe']

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('tous')
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', role: 'enseignant', status: 'actif', password: '' })
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      const data = await usersApi.list()
      setUsers(data)
    } catch (err) {
      console.error('Erreur chargement utilisateurs:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

  const filtered = users.filter(u => {
    const matchSearch = `${u.nom || ''} ${u.prenom || ''} ${u.email || ''}`.toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole === 'tous' || u.role === filterRole
    return matchSearch && matchRole
  })

  function openCreate() {
    setEditUser(null)
    setForm({ nom: '', prenom: '', email: '', role: 'enseignant', status: 'actif', password: '' })
    setFormError('')
    setShowModal(true)
  }

  function openEdit(u) {
    setEditUser(u)
    setForm({ nom: u.nom || '', prenom: u.prenom || '', email: u.email || '', role: u.role, status: u.status, password: '' })
    setFormError('')
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.nom.trim() || !form.prenom.trim() || !form.email.trim()) {
      setFormError('Veuillez remplir tous les champs.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      if (editUser) {
        const updated = await usersApi.update(editUser.id, {
          nom: form.nom, prenom: form.prenom, email: form.email,
          role: form.role, status: form.status,
        })
        setUsers(prev => prev.map(u => u.id === editUser.id ? updated : u))
      } else {
        const created = await usersApi.create({
          nom: form.nom, prenom: form.prenom, email: form.email,
          role: form.role, status: form.status,
          password: form.password || undefined,
        })
        setUsers(prev => [created, ...prev])
      }
      setShowModal(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    const target = users.find(u => u.id === id)
    const admins = users.filter(u => u.role === 'admin')
    if (target?.role === 'admin' && admins.length <= 1) {
      alert('Impossible de supprimer le dernier administrateur.')
      return
    }
    if (!window.confirm('Supprimer cet utilisateur ?')) return
    try {
      await usersApi.delete(id)
      setUsers(prev => prev.filter(u => u.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur suppression')
    }
  }

  async function toggleStatus(u) {
    try {
      const result = await usersApi.toggleStatus(u.id)
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, status: result.status } : x))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur statut')
    }
  }

  async function promoteToAdmin(u) {
    if (!window.confirm(`Promouvoir ${u.prenom} ${u.nom} en administrateur ?`)) return
    try {
      const result = await usersApi.promote(u.id)
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: result.role } : x))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur promotion')
    }
  }

  const enseignants = users.filter(u => u.role === 'enseignant').length
  const admins = users.filter(u => u.role === 'admin').length

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Utilisateurs</div>
          <div className="page-subtitle">
            {loading ? 'Chargement...' : `${enseignants} enseignant${enseignants > 1 ? 's' : ''} · ${admins} administrateur${admins > 1 ? 's' : ''}`}
          </div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Nouvel utilisateur</button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1, maxWidth: 320 }}>
          <i className="search-icon" style={{ fontStyle: 'normal', fontSize: 13 }}>&#128269;</i>
          <input className="input" placeholder="Rechercher un utilisateur..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input" style={{ width: 160 }} value={filterRole} onChange={e => setFilterRole(e.target.value)}>
          <option value="tous">Tous les rôles</option>
          <option value="enseignant">Enseignants</option>
          <option value="admin">Admins</option>
        </select>
        <span style={{ fontSize: 12, color: '#9090b0', marginLeft: 'auto' }}>
          {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#8888aa' }}>Chargement...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Inscrit le</th>
                <th>Il y a</th>
                <th>Contenus</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-icon" style={{ fontSize: 24, fontWeight: 800 }}>USR</div>
                    <div>Aucun utilisateur trouvé</div>
                  </div>
                </td></tr>
              ) : filtered.map((u, i) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar" style={{ background: avatarColors[i % avatarColors.length] }}>
                        {getInitials(u.prenom, u.nom)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 13 }}>{u.prenom} {u.nom}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: '#9090b0', fontSize: 12 }}>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-purple' : 'badge-blue'}`}>
                      {u.role === 'admin' ? 'Admin' : 'Enseignant'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.status === 'actif' ? 'badge-green' : 'badge-red'}`}>
                      {u.status === 'actif' ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td style={{ fontSize: 11, color: '#4a4a6a', fontVariantNumeric: 'tabular-nums' }}>
                    {formatDateTime(u.created_at)}
                  </td>
                  <td style={{ fontSize: 11, color: '#9090b0', whiteSpace: 'nowrap' }}>
                    {timeAgo(u.created_at)}
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#6c5ce7' }}>{u.contentsCount ?? 0}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-icon" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => openEdit(u)}>Modifier</button>
                      <button className="btn-icon" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => toggleStatus(u)}>
                        {u.status === 'actif' ? 'Désactiver' : 'Activer'}
                      </button>
                      {u.role === 'enseignant' && (
                        <button className="btn-icon" style={{ fontSize: 11, padding: '4px 10px', color: '#5b4fcf', borderColor: '#5b4fcf' }} onClick={() => promoteToAdmin(u)}>
                          → Admin
                        </button>
                      )}
                      <button className="btn-icon danger" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => handleDelete(u.id)}>
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{editUser ? 'Modifier utilisateur' : 'Nouvel utilisateur'}</div>
              <button className="btn-icon" onClick={() => setShowModal(false)}>X</button>
            </div>
            {formError && <div className="alert alert-error">{formError}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Prénom</label>
                <input className="input" value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} placeholder="Prénom" />
              </div>
              <div className="form-group">
                <label className="form-label">Nom</label>
                <input className="input" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Nom" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@tekup.tn" />
            </div>
            {!editUser && (
              <div className="form-group">
                <label className="form-label">Mot de passe (optionnel)</label>
                <input className="input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Laisser vide pour le mot de passe par défaut" />
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Rôle</label>
                <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="enseignant">Enseignant</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Statut</label>
                <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Enregistrement...' : editUser ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
