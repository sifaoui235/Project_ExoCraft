import React, { useState, useEffect, useRef, useCallback } from 'react'
import { profileApi, notesApi, usersApi, authApi, formatDateTime, timeAgo } from '../../services/adminApi'
import { useAuth } from '../../context/AuthContext'

const PWD_RULES = [
  { label: 'Au moins 8 caractères',              test: v => v.length >= 8 },
  { label: 'Une lettre majuscule (A-Z)',          test: v => /[A-Z]/.test(v) },
  { label: 'Une lettre minuscule (a-z)',          test: v => /[a-z]/.test(v) },
  { label: 'Un chiffre (0-9)',                   test: v => /[0-9]/.test(v) },
  { label: 'Un caractère spécial (!@#$%^&*...)', test: v => /[^A-Za-z0-9]/.test(v) },
]

function pwdStrength(v) {
  const score = PWD_RULES.filter(r => r.test(v)).length
  if (score <= 1) return { score, label: 'Très faible', color: '#e17055' }
  if (score === 2) return { score, label: 'Faible',      color: '#f39c12' }
  if (score === 3) return { score, label: 'Moyen',       color: '#fdcb6e' }
  if (score === 4) return { score, label: 'Fort',        color: '#00b894' }
  return { score, label: 'Très fort', color: '#00b894' }
}

const TAG_CONFIG = {
  info:   { label: 'Info',    color: '#4a90e2', bg: '#e8f2ff' },
  urgent: { label: 'Urgent',  color: '#e17055', bg: '#fff0ee' },
  todo:   { label: 'À faire', color: '#f39c12', bg: '#fff8e6' },
  done:   { label: 'Fait',    color: '#00b894', bg: '#e6faf5' },
}

const fields = [
  { label: 'Prénom',        key: 'prenom' },
  { label: 'Nom',           key: 'nom' },
  { label: 'Email',         key: 'email' },
  { label: 'Téléphone',     key: 'telephone' },
  { label: 'Poste',         key: 'poste' },
  { label: 'Département',   key: 'departement' },
  { label: 'Établissement', key: 'etablissement', full: true },
]

export default function Profile() {
  const { user } = useAuth()
  const fileRef = useRef(null)

  const [profile, setProfile] = useState(null)
  const [notes, setNotes] = useState([])
  const [otherAdmins, setOtherAdmins] = useState([])
  const [loading, setLoading] = useState(true)

  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [saveAlert, setSaveAlert] = useState('')
  const [saving, setSaving] = useState(false)

  const [activeTab, setActiveTab] = useState('profile')
  const [newNote, setNewNote] = useState('')
  const [newTag, setNewTag] = useState('info')
  const [filterTag, setFilterTag] = useState('all')

  const [showPwdModal, setShowPwdModal] = useState(false)
  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' })
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwdAlert, setPwdAlert] = useState(null)
  const [pwdSaving, setPwdSaving] = useState(false)

  const strength = pwdStrength(pwdForm.next)

  const loadAll = useCallback(async () => {
    try {
      setLoading(true)
      const [p, n, u] = await Promise.all([
        profileApi.get(),
        notesApi.list(),
        usersApi.list({ role: 'admin' }),
      ])
      setProfile(p)
      setEditForm(p)
      setNotes(n)
      setOtherAdmins(u.filter(a => a.id !== user?.id))
    } catch (err) {
      console.error('Profile load error:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { loadAll() }, [loadAll])

  async function saveProfile() {
    if (!editForm) return
    setSaving(true)
    try {
      const updated = await profileApi.update(editForm)
      setProfile(updated)
      setEditForm(updated)
      setEditMode(false)
      setSaveAlert('Profil mis à jour !')
      setTimeout(() => setSaveAlert(''), 3000)
    } catch (err) {
      setSaveAlert(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const result = await profileApi.uploadAvatar(file)
      setProfile(prev => prev ? { ...prev, avatar: result.avatar } : prev)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur upload avatar')
    }
  }

  async function submitPwd() {
    setPwdAlert(null)
    if (!pwdForm.current) { setPwdAlert({ type: 'error', msg: 'Entrez votre mot de passe actuel.' }); return }
    const failed = PWD_RULES.filter(r => !r.test(pwdForm.next))
    if (failed.length > 0) { setPwdAlert({ type: 'error', msg: `Règle non respectée : ${failed[0].label}` }); return }
    if (pwdForm.next !== pwdForm.confirm) { setPwdAlert({ type: 'error', msg: 'Les mots de passe ne correspondent pas.' }); return }
    setPwdSaving(true)
    try {
      await authApi.changePassword(pwdForm.current, pwdForm.next)
      setPwdAlert({ type: 'success', msg: 'Mot de passe modifié avec succès !' })
      setTimeout(() => { setShowPwdModal(false); setPwdForm({ current: '', next: '', confirm: '' }); setPwdAlert(null) }, 1800)
    } catch (err) {
      setPwdAlert({ type: 'error', msg: err instanceof Error ? err.message : 'Erreur' })
    } finally {
      setPwdSaving(false)
    }
  }

  async function addNote() {
    if (!newNote.trim()) return
    try {
      const note = await notesApi.create(newNote.trim(), newTag)
      setNotes(prev => [note, ...prev])
      setNewNote('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur')
    }
  }

  async function deleteNote(id) {
    try {
      await notesApi.delete(id)
      setNotes(prev => prev.filter(n => n.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur')
    }
  }

  async function togglePin(id) {
    try {
      const updated = await notesApi.togglePin(id)
      setNotes(prev => prev.map(n => n.id === id ? updated : n))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur')
    }
  }

  const filteredNotes = notes
    .filter(n => filterTag === 'all' || n.tag === filterTag)
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))

  if (loading || !profile || !editForm) {
    return <div style={{ textAlign: 'center', padding: 60, color: '#8888aa' }}>Chargement du profil...</div>
  }

  const avatarSrc = profile.avatar
    ? (profile.avatar.startsWith('http') ? profile.avatar : `/api/uploads${profile.avatar}`)
    : null

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Mon profil</div>
          <div className="page-subtitle">Gérez vos informations et vos notes partagées</div>
        </div>
        {saveAlert && <div className={`alert ${saveAlert.includes('Erreur') ? 'alert-error' : 'alert-success'}`} style={{ margin: 0, padding: '8px 16px' }}>{saveAlert}</div>}
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid #e0e2f0' }}>
        {[{ key: 'profile', label: 'Profil' }, { key: 'notes', label: 'Notes partagées', count: notes.length }].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{ padding: '10px 20px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, fontWeight: activeTab === tab.key ? 700 : 500, color: activeTab === tab.key ? '#5b4fcf' : '#8888aa', borderBottom: activeTab === tab.key ? '2px solid #5b4fcf' : '2px solid transparent', marginBottom: -2, display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s' }}>
            {tab.label}
            {tab.count !== undefined && <span style={{ background: activeTab === tab.key ? '#5b4fcf' : '#e0e2f0', color: activeTab === tab.key ? '#fff' : '#8888aa', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>{tab.count}</span>}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
                <div style={{ width: 96, height: 96, borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg,#5b4fcf,#4a90e2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', border: '3px solid #e0e2f0', boxShadow: '0 4px 16px rgba(91,79,207,0.2)' }}>
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ color: '#fff', fontWeight: 800, fontSize: 28 }}>{(profile.prenom || '')[0]}{(profile.nom || '')[0]}</span>
                  )}
                </div>
                <button onClick={() => fileRef.current?.click()} style={{ position: 'absolute', bottom: 2, right: 2, width: 26, height: 26, borderRadius: '50%', background: '#5b4fcf', border: '2px solid #fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 700 }} title="Changer la photo">✎</button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
              </div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#1a1a3e' }}>{profile.prenom} {profile.nom}</div>
              <div style={{ fontSize: 12, color: '#5b4fcf', fontWeight: 600, marginTop: 4 }}>{profile.poste}</div>
              <div style={{ fontSize: 12, color: '#8888aa', marginTop: 2 }}>{profile.departement}</div>
              <div className="divider" />
              <div style={{ fontSize: 12, color: '#3a3a6a', lineHeight: 1.9, textAlign: 'left' }}>
                <div>✉ {profile.email}</div>
                <div>📞 {profile.telephone}</div>
                <div>🏛 {profile.etablissement}</div>
              </div>
            </div>

            <div className="card">
              <div className="section-title" style={{ marginBottom: 14 }}>Admins dans cette fac</div>
              {otherAdmins.length === 0 ? (
                <div style={{ fontSize: 12, color: '#8888aa', textAlign: 'center', padding: '12px 0' }}>
                  Vous êtes le seul administrateur.<br />
                  <span style={{ fontSize: 11 }}>Vous pouvez promouvoir un enseignant depuis Utilisateurs.</span>
                </div>
              ) : otherAdmins.map((a, i) => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div className="avatar" style={{ background: ['#4a90e2','#00b894','#f39c12'][i % 3], width: 34, height: 34, fontSize: 12 }}>
                    {(a.prenom || '')[0]}{(a.nom || '')[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1a3e' }}>{a.prenom} {a.nom}</div>
                    <div style={{ fontSize: 11, color: '#8888aa' }}>{a.email}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: a.status === 'actif' ? '#00b894' : '#8888aa' }}>
                    {a.status === 'actif' ? '● Actif' : '○ Inactif'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div className="section-title">Informations personnelles</div>
                {!editMode ? (
                  <button className="btn btn-secondary" style={{ fontSize: 12 }} onClick={() => { setEditForm({ ...profile }); setEditMode(true) }}>✎ Modifier</button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary" style={{ fontSize: 12 }} onClick={() => { setEditForm({ ...profile }); setEditMode(false) }}>Annuler</button>
                    <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={saveProfile} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
                  </div>
                )}
              </div>
              {!editMode ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  {fields.map((f, i) => (
                    <div key={i} style={f.full ? { gridColumn: '1/-1' } : {}}>
                      <div style={{ fontSize: 11, color: '#8888aa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{f.label}</div>
                      <div style={{ fontSize: 14, color: '#1a1a3e', fontWeight: 500 }}>{profile[f.key]}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {fields.map((f, i) => (
                    <div key={i} className="form-group" style={{ ...(f.full ? { gridColumn: '1/-1' } : {}), margin: 0 }}>
                      <label className="form-label">{f.label}</label>
                      <input className="input" value={editForm[f.key] ?? ''} onChange={e => setEditForm(prev => prev ? { ...prev, [f.key]: e.target.value } : prev)} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <div className="section-title" style={{ marginBottom: 14 }}>Sécurité</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a3e' }}>Mot de passe</div>
                  <div style={{ fontSize: 12, color: '#8888aa', marginTop: 2 }}>Modifiez votre mot de passe de connexion</div>
                </div>
                <button className="btn btn-secondary" style={{ fontSize: 12 }} onClick={() => { setPwdForm({ current: '', next: '', confirm: '' }); setPwdAlert(null); setShowPwdModal(true) }}>Changer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'notes' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="section-title" style={{ marginBottom: 14 }}>Nouvelle note</div>
              <textarea className="input" value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Écrivez une note..." rows={3} style={{ resize: 'vertical', marginBottom: 12, minHeight: 80 }} onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') addNote() }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {Object.entries(TAG_CONFIG).map(([key, cfg]) => (
                    <button key={key} onClick={() => setNewTag(key)} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: `1.5px solid ${newTag === key ? cfg.color : '#e0e2f0'}`, background: newTag === key ? cfg.bg : '#fff', color: newTag === key ? cfg.color : '#8888aa', cursor: 'pointer' }}>{cfg.label}</button>
                  ))}
                </div>
                <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={addNote}>Publier</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              <button onClick={() => setFilterTag('all')} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: `1.5px solid ${filterTag === 'all' ? '#5b4fcf' : '#e0e2f0'}`, background: filterTag === 'all' ? '#edeaff' : '#fff', color: filterTag === 'all' ? '#5b4fcf' : '#8888aa', cursor: 'pointer' }}>Toutes ({notes.length})</button>
              {Object.entries(TAG_CONFIG).map(([key, cfg]) => {
                const count = notes.filter(n => n.tag === key).length
                if (!count) return null
                return <button key={key} onClick={() => setFilterTag(key)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: `1.5px solid ${filterTag === key ? cfg.color : '#e0e2f0'}`, background: filterTag === key ? cfg.bg : '#fff', color: filterTag === key ? cfg.color : '#8888aa', cursor: 'pointer' }}>{cfg.label} ({count})</button>
              })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredNotes.map(note => {
                const cfg = TAG_CONFIG[note.tag] ?? TAG_CONFIG.info
                const isOwn = note.authorId === user?.id
                return (
                  <div key={note.id} className="card" style={{ borderLeft: `3px solid ${note.pinned ? '#f39c12' : cfg.color}`, background: note.pinned ? '#fffdf0' : '#fff', position: 'relative' }}>
                    {note.pinned && <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 11, color: '#f39c12', fontWeight: 700 }}>📌 Épinglée</div>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div className="avatar" style={{ background: '#5b4fcf', width: 30, height: 30, fontSize: 11 }}>
                        {note.author.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1a3e' }}>{note.author}</div>
                        <div style={{ fontSize: 11, color: '#8888aa' }}>{formatDateTime(note.createdAt)}</div>
                      </div>
                      <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#3a3a6a', lineHeight: 1.7, margin: 0 }}>{note.content}</p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid #f0f2ff' }}>
                      <button className="btn-icon" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => togglePin(note.id)}>{note.pinned ? 'Désépingler' : 'Épingler'}</button>
                      {isOwn && <button className="btn-icon danger" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => deleteNote(note.id)}>Supprimer</button>}
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: '#8888aa', alignSelf: 'center' }}>{timeAgo(note.createdAt)}</span>
                    </div>
                  </div>
                )
              })}
              {filteredNotes.length === 0 && <div style={{ textAlign: 'center', color: '#8888aa', padding: '32px 0', fontSize: 13 }}>Aucune note</div>}
            </div>
          </div>

          <div className="card">
            <div className="section-title" style={{ marginBottom: 14 }}>Résumé</div>
            {Object.entries(TAG_CONFIG).map(([key, cfg]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: '#3a3a6a' }}>{cfg.label}</span>
                <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color }}>{notes.filter(n => n.tag === key).length}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal mot de passe */}
      {showPwdModal && (
        <div className="modal-overlay" onClick={() => setShowPwdModal(false)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a3e' }}>Changer le mot de passe</div>
                <div style={{ fontSize: 12, color: '#8888aa', marginTop: 2 }}>Respectez toutes les règles de sécurité</div>
              </div>
              <button className="btn-icon" onClick={() => setShowPwdModal(false)}>✕</button>
            </div>
            {pwdAlert && <div className={`alert ${pwdAlert.type === 'success' ? 'alert-success' : 'alert-error'}`}>{pwdAlert.type === 'success' ? '✓' : '⚠'} {pwdAlert.msg}</div>}

            {[
              { label: 'Mot de passe actuel', key: 'current', show: showCurrent, toggle: () => setShowCurrent(v => !v), placeholder: 'Votre mot de passe actuel' },
              { label: 'Nouveau mot de passe', key: 'next', show: showNext, toggle: () => setShowNext(v => !v), placeholder: 'Nouveau mot de passe' },
              { label: 'Confirmer', key: 'confirm', show: showConfirm, toggle: () => setShowConfirm(v => !v), placeholder: 'Répétez le nouveau mot de passe' },
            ].map((f, i) => (
              <div key={i} className="form-group">
                <label className="form-label">{f.label}</label>
                <div style={{ position: 'relative' }}>
                  <input className="input" type={f.show ? 'text' : 'password'} value={pwdForm[f.key]} onChange={e => setPwdForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} style={{ paddingRight: 42 }} />
                  <button type="button" onClick={f.toggle} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#8888aa' }}>{f.show ? '🙈' : '👁'}</button>
                </div>
                {f.key === 'next' && pwdForm.next.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                      {[1,2,3,4,5].map(i => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= strength.score ? strength.color : '#e0e2f0', transition: 'background 0.3s' }} />)}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: strength.color }}>{strength.label}</div>
                  </div>
                )}
              </div>
            ))}

            <div style={{ background: '#fafbff', border: '1px solid #e0e2f0', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8888aa', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Règles de sécurité</div>
              {PWD_RULES.map((rule, i) => {
                const ok = rule.test(pwdForm.next)
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, background: ok ? '#00b894' : '#e0e2f0', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
                      <span style={{ fontSize: 10, color: ok ? '#fff' : '#8888aa', fontWeight: 700 }}>{ok ? '✓' : '·'}</span>
                    </div>
                    <span style={{ fontSize: 12, color: ok ? '#1a1a3e' : '#8888aa' }}>{rule.label}</span>
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowPwdModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={submitPwd} disabled={pwdSaving || strength.score < 5 || pwdForm.next !== pwdForm.confirm || !pwdForm.current}>
                {pwdSaving ? 'Modification...' : 'Changer le mot de passe'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
