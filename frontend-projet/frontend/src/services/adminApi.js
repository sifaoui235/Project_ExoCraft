/**
 * API client admin — basé sur le client TypeScript de Malak
 * Converti en JS pur, API_BASE en chemin relatif /api
 */

const API_BASE = '/api'

// ── Token helpers ──────────────────────────────────────────────────────────
export function getToken() {
  return localStorage.getItem('exocraft_token')
}

export function clearToken() {
  localStorage.removeItem('exocraft_token')
  localStorage.removeItem('exocraft_user')
}

// ── Helpers date/heure ─────────────────────────────────────────────────────
export function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function timeAgo(iso) {
  if (!iso) return '—'
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 5)     return "À l'instant"
  if (diff < 60)    return `Il y a ${diff}s`
  if (diff < 3600)  return `Il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`
  return `Il y a ${Math.floor(diff / 86400)}j`
}

// ── Requête générique ──────────────────────────────────────────────────────
async function request(path, options = {}) {
  const token = getToken()
  const headers = { ...(options.headers || {}) }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    clearToken()
    window.location.reload()
    throw new Error('Session expirée')
  }

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data?.error ?? data?.message ?? `Erreur ${res.status}`)
  }

  return data
}

// ── Auth ───────────────────────────────────────────────────────────────────
export const authApi = {
  login(email, password, etablissementType) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, motDePasse: password, etablissementType }),
    })
  },
  logout() {
    return request('/auth/logout', { method: 'POST' }).catch(() => {})
  },
  me() {
    return request('/auth/me')
  },
  changePassword(currentPassword, newPassword) {
    // Le backend attend ancienMotDePasse / nouveauMotDePasse
    return request('/auth/password', {
      method: 'PATCH',
      body: JSON.stringify({
        ancienMotDePasse: currentPassword,
        nouveauMotDePasse: newPassword,
      }),
    })
  },
}

// ── Stats ──────────────────────────────────────────────────────────────────
export const statsApi = {
  get() {
    return request('/stats').then(res => {
      // Normaliser la réponse vers le format attendu par Dashboard.jsx
      return {
        totalUsers: res?.users?.total ?? 0,
        totalEnseignants: res?.users?.enseignants ?? 0,
        activeEnseignants: res?.users?.actifs ?? res?.users?.enseignants ?? 0,
        totalMatieres: res?.matieres?.total ?? 0,
        totalDocs: res?.archives?.total ?? 0,
        totalArchives: res?.archives?.total ?? 0,
        totalGenerations: res?.generations?.total ?? 0,
        thisMonthGenerations: 0,
        contentsByType: [
          { type: 'Quiz',      count: res?.quiz?.total ?? 0,         color: '#5b4fcf' },
          { type: 'Cours',     count: res?.contenus?.parType?.cours ?? 0,  color: '#00b894' },
          { type: 'Examen',    count: res?.contenus?.parType?.examen ?? 0, color: '#e17055' },
          { type: 'Exercices', count: res?.contenus?.parType?.serie ?? 0,  color: '#f39c12' },
          { type: 'Résumé',    count: res?.contenus?.parType?.resume ?? 0, color: '#4a90e2' },
        ],
        recentActivity: [],
      }
    })
  },
}

// ── Users ──────────────────────────────────────────────────────────────────
export const usersApi = {
  list(params) {
    const q = params ? new URLSearchParams(params).toString() : ''
    return request(`/admin/users${q ? `?${q}` : ''}`)
  },
  create(data) {
    // Le backend attend motDePasse (pas password)
    const payload = {
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      motDePasse: data.password || data.motDePasse || 'Exocraft@2024',
      role: data.role || 'enseignant',
      status: data.status,
    }
    return request('/admin/users', { method: 'POST', body: JSON.stringify(payload) })
  },
  update(id, data) {
    return request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  },
  delete(id) {
    return request(`/admin/users/${id}`, { method: 'DELETE' })
  },
  toggleStatus(id) {
    return request(`/admin/users/${id}/status`, { method: 'PATCH' })
  },
  promote(id) {
    return request(`/admin/users/${id}/promote`, { method: 'PATCH' })
  },
}

// ── Promos ─────────────────────────────────────────────────────────────────
export const promosApi = {
  list() { return request('/promotions') },
  get(id) { return request(`/promotions/${id}`) },
  create(data) {
    return request('/promotions', { method: 'POST', body: JSON.stringify(data) })
  },
  update(id, data) {
    return request(`/promotions/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  },
  delete(id) {
    return request(`/promotions/${id}`, { method: 'DELETE' })
  },
}

// ── Matieres ───────────────────────────────────────────────────────────────
export const matieresApi = {
  list(params) {
    const q = params
      ? new URLSearchParams(
          Object.fromEntries(
            Object.entries(params)
              .filter(([, v]) => v !== undefined)
              .map(([k, v]) => [k, String(v)])
          )
        ).toString()
      : ''
    return request(`/matieres${q ? `?${q}` : ''}`)
  },
  create(data) {
    return request('/matieres', { method: 'POST', body: JSON.stringify(data) })
  },
  update(id, data) {
    return request(`/matieres/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  },
  delete(id) {
    return request(`/matieres/${id}`, { method: 'DELETE' })
  },
  uploadDocument(matiereId, file, meta) {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('titre', meta.titre)
    fd.append('type', meta.type)
    fd.append('format', meta.format)
    fd.append('promo', meta.promo)
    return request(`/matieres/${matiereId}/documents`, { method: 'POST', body: fd })
  },
  updateDocument(matiereId, docId, data, file) {
    const fd = new FormData()
    if (file) fd.append('file', file)
    Object.entries(data).forEach(([k, v]) => { if (v !== undefined) fd.append(k, String(v)) })
    return request(`/matieres/${matiereId}/documents/${docId}`, { method: 'PUT', body: fd })
  },
  deleteDocument(matiereId, docId) {
    return request(`/matieres/${matiereId}/documents/${docId}`, { method: 'DELETE' })
  },
  downloadUrl(matiereId, docId) {
    return `${window.location.origin}/api/matieres/${matiereId}/documents/${docId}/download?token=${getToken()}`
  },
}

// ── Archives ───────────────────────────────────────────────────────────────
export const archivesApi = {
  list(params) {
    const q = params
      ? new URLSearchParams(
          Object.fromEntries(
            Object.entries(params)
              .filter(([, v]) => v !== undefined)
              .map(([k, v]) => [k, String(v)])
          )
        ).toString()
      : ''
    // Le backend retourne { data, total, page, limit } — on extrait data[]
    return request(`/archives${q ? `?${q}` : ''}`).then(res => {
      if (Array.isArray(res)) return res
      if (res && Array.isArray(res.data)) return res.data
      return []
    })
  },
  upload(file, meta) {
    // Le backend attend POST /archives/upload avec champ 'fichier'
    const fd = new FormData()
    fd.append('fichier', file)          // champ 'fichier' (pas 'file')
    fd.append('matiere', meta.matiere)
    fd.append('promotion', meta.promo)  // champ 'promotion'
    return request('/archives/upload', { method: 'POST', body: fd })
  },
  delete(id) {
    return request(`/archives/${id}`, { method: 'DELETE' })
  },
  downloadUrl(id) {
    // Ouvre le téléchargement direct via le backend
    return `${window.location.origin}/api/archives/${id}/download?token=${getToken()}`
  },
}

// ── Associations ───────────────────────────────────────────────────────────
export const associationsApi = {
  list() {
    return request('/associations').then(res => {
      // Normaliser : le backend retourne { matiereNoms, promoNoms }
      // La page attend { matieres: [], promos: [] }
      if (!Array.isArray(res)) return []
      return res.map(t => ({
        ...t,
        matieres: t.matiereNoms || t.matieres || [],
        promos:   t.promoNoms   || t.promos   || [],
      }))
    })
  },
  save(userId, matiereNoms, promoNoms) {
    return request(`/associations/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ matiereNoms, promoNoms }),
    })
  },
}

// ── AI Generations ─────────────────────────────────────────────────────────
export const generationsApi = {
  list(page = 1, limit = 20) {
    return request(`/generations?page=${page}&limit=${limit}`)
  },
  stats() {
    return request('/generations/stats')
  },
}

// ── Profile ────────────────────────────────────────────────────────────────
export const profileApi = {
  get() { return request('/profile') },
  update(data) {
    return request('/profile', { method: 'PUT', body: JSON.stringify(data) })
  },
  uploadAvatar(file) {
    const fd = new FormData()
    fd.append('avatar', file)
    return request('/profile/avatar', { method: 'POST', body: fd })
  },
}

// ── Notes ──────────────────────────────────────────────────────────────────
export const notesApi = {
  list() { return request('/notes') },
  create(content, tag) {
    return request('/notes', { method: 'POST', body: JSON.stringify({ content, tag }) })
  },
  togglePin(id) {
    return request(`/notes/${id}/pin`, { method: 'PATCH' })
  },
  delete(id) {
    return request(`/notes/${id}`, { method: 'DELETE' })
  },
}
