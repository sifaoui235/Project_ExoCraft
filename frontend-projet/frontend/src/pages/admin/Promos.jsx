import React, { useState, useEffect, useCallback } from 'react'
import { promosApi } from '../../services/adminApi'
import { useEtab } from '../../context/EtablissementContext'

const NIVEAU_CONFIG_ING = {
  '1ere': { label: '1ère Prépa',         color: '#5b4fcf', bg: '#edeaff' },
  '2eme': { label: '2ème Prépa',         color: '#4a90e2', bg: '#e6f0ff' },
  '3eme': { label: '3ème Branche comm.', color: '#00b894', bg: '#e0faf3' },
  '4eme': { label: '4ème année',         color: '#f39c12', bg: '#fff5e0' },
  '5eme': { label: '5ème année',         color: '#e17055', bg: '#fff0ee' },
}
const NIVEAU_CONFIG_LICENCE = {
  '1ere': { label: '1ère Licence', color: '#5b4fcf', bg: '#edeaff' },
  '2eme': { label: '2ème Licence', color: '#4a90e2', bg: '#e6f0ff' },
  '3eme': { label: '3ème Licence', color: '#00b894', bg: '#e0faf3' },
  '4eme': { label: 'Master 1',     color: '#f39c12', bg: '#fff5e0' },
  '5eme': { label: 'Master 2',     color: '#e17055', bg: '#fff0ee' },
}
const SPEC_COLORS = {
  'Cloud Computing': '#4a90e2', 'Cybersécurité': '#e17055',
  'Data Science': '#00b894', 'Génie Logiciel': '#5b4fcf',
}
function specColor(s) { return SPEC_COLORS[s] ?? '#5b4fcf' }

export default function Promos() {
  const { type: etabType, reload: reloadContext } = useEtab()
  const NIVEAU_CONFIG = etabType === 'licence' ? NIVEAU_CONFIG_LICENCE : NIVEAU_CONFIG_ING

  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPromo, setSelectedPromo] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ nom: '', code: '', niveau: '4eme', type: 'specialite', specialite: '', semestre: 'S1' })
  const [alertMsg, setAlertMsg] = useState('')
  const [saving, setSaving] = useState(false)

  const loadPromos = useCallback(async () => {
    try {
      setLoading(true)
      const data = await promosApi.list()
      setPromos(data)
    } catch (err) {
      console.error('Promos load error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadPromos() }, [loadPromos])

  const niveaux = ['1ere', '2eme', '3eme', '4eme', '5eme']

  function openCreate() {
    setEditItem(null)
    setForm({ nom: '', code: '', niveau: '4eme', type: 'specialite', specialite: '', semestre: 'S1' })
    setAlertMsg('')
    setShowModal(true)
  }

  function openEdit(p) {
    setEditItem(p)
    setForm({ nom: p.nom, code: p.code, niveau: p.niveau, type: p.type, specialite: p.specialite ?? '', semestre: p.semestre })
    setAlertMsg('')
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.nom.trim() || !form.code.trim()) { setAlertMsg('Nom et code requis.'); return }
    setSaving(true); setAlertMsg('')
    try {
      const payload = {
        nom: form.nom, code: form.code, niveau: form.niveau,
        type: form.type, semestre: form.semestre,
        specialite: form.specialite || null,
      }
      if (editItem) {
        const updated = await promosApi.update(editItem.id, payload)
        setPromos(prev => prev.map(p => p.id === editItem.id ? updated : p))
        if (selectedPromo?.id === editItem.id) setSelectedPromo(updated)
      } else {
        const created = await promosApi.create(payload)
        setPromos(prev => [...prev, created])
      }
      reloadContext()
      setShowModal(false)
    } catch (err) {
      setAlertMsg(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Supprimer cette promotion ?')) return
    try {
      await promosApi.delete(id)
      setPromos(prev => prev.filter(p => p.id !== id))
      if (selectedPromo?.id === id) setSelectedPromo(null)
      reloadContext()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur suppression')
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Promotions</div>
          <div className="page-subtitle">
            {loading ? 'Chargement...' : `${promos.length} promotion${promos.length > 1 ? 's' : ''}`}
          </div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Nouvelle promotion</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 28 }}>
        {niveaux.map(n => {
          const cfg = NIVEAU_CONFIG[n]
          const count = promos.filter(p => p.niveau === n).length
          return (
            <div key={n} className="card" style={{ textAlign: 'center', borderTop: `3px solid ${cfg.color}`, padding: '14px 10px' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: cfg.color }}>{count}</div>
              <div style={{ fontSize: 11, color: '#8888aa', marginTop: 4, lineHeight: 1.3 }}>{cfg.label}</div>
            </div>
          )
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#8888aa' }}>Chargement...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selectedPromo ? '380px 1fr' : '1fr', gap: 20, alignItems: 'start' }}>
          <div>
            {niveaux.map(n => {
              const group = promos.filter(p => p.niveau === n)
              if (group.length === 0) return null
              const cfg = NIVEAU_CONFIG[n]
              return (
                <div key={n} style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a3e' }}>{cfg.label}</div>
                    <span style={{ background: cfg.bg, color: cfg.color, padding: '1px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{group.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {group.map(p => {
                      const sc = specColor(p.specialite ?? '')
                      const isSelected = selectedPromo?.id === p.id
                      return (
                        <div key={p.id} onClick={() => setSelectedPromo(isSelected ? null : p)}
                          style={{ background: isSelected ? '#f5f3ff' : '#fff', border: `1.5px solid ${isSelected ? '#5b4fcf' : '#e0e2f0'}`, borderRadius: 10, padding: '12px 14px', cursor: 'pointer', transition: 'all 0.15s' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                                <span style={{ fontFamily: 'monospace', fontSize: 11, background: '#f0f2f8', color: '#3a3a6a', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>{p.code}</span>
                                <span style={{ fontSize: 10, background: '#f5f5f5', color: '#8888aa', padding: '1px 6px', borderRadius: 4 }}>{p.semestre}</span>
                                {p.specialite && <span style={{ fontSize: 10, background: sc + '18', color: sc, padding: '1px 8px', borderRadius: 4, fontWeight: 700 }}>{p.specialite}</span>}
                              </div>
                              <div style={{ fontWeight: 600, fontSize: 13, color: isSelected ? '#5b4fcf' : '#1a1a3e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nom}</div>
                              <div style={{ fontSize: 11, color: '#8888aa', marginTop: 3 }}>{(p.matieres || []).length} matière{(p.matieres || []).length !== 1 ? 's' : ''}</div>
                            </div>
                            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                              <button className="btn-icon" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => openEdit(p)}>Modifier</button>
                              <button className="btn-icon danger" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => handleDelete(p.id)}>Supp.</button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            {promos.length === 0 && (
              <div className="card">
                <div className="empty-state">
                  <div style={{ fontWeight: 800, fontSize: 20, color: '#5b4fcf', opacity: 0.3, marginBottom: 12 }}>PROMO</div>
                  <div>Aucune promotion créée</div>
                </div>
              </div>
            )}
          </div>

          {selectedPromo && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <button onClick={() => setSelectedPromo(null)} style={{ background: '#f0f2f8', border: '1px solid #e0e2f0', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, color: '#3a3a6a', fontWeight: 500 }}>Fermer</button>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 17, color: '#1a1a3e' }}>{selectedPromo.nom}</div>
                  <div style={{ fontSize: 12, color: '#8888aa', marginTop: 2 }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#3a3a6a' }}>{selectedPromo.code}</span>
                    {selectedPromo.specialite && <> · <span style={{ color: specColor(selectedPromo.specialite), fontWeight: 600 }}>{selectedPromo.specialite}</span></>}
                  </div>
                </div>
              </div>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #e0e2f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="section-title">Matières — {selectedPromo.code}</div>
                  <span className="badge badge-purple">{(selectedPromo.matieres || []).length}</span>
                </div>
                {(selectedPromo.matieres || []).length === 0 ? (
                  <div style={{ padding: '32px 20px', textAlign: 'center', color: '#8888aa', fontSize: 13 }}>Aucune matière associée</div>
                ) : (
                  <div style={{ padding: '8px 0' }}>
                    {(selectedPromo.matieres || []).map((mat, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: i < selectedPromo.matieres.length - 1 ? '1px solid #f0f2ff' : 'none' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: '#edeaff', color: '#5b4fcf', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 10, flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</div>
                        <div style={{ fontWeight: 500, fontSize: 13, color: '#1a1a3e' }}>{mat}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{editItem ? 'Modifier' : 'Nouvelle promotion'}</div>
              <button className="btn-icon" onClick={() => setShowModal(false)}>X</button>
            </div>
            {alertMsg && <div className="alert alert-error">{alertMsg}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Nom complet</label>
                <input className="input" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Ex: 4ème année — Cloud Computing" />
              </div>
              <div className="form-group">
                <label className="form-label">Code</label>
                <input className="input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="ING-4-J-CIM" style={{ fontFamily: 'monospace' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Semestre</label>
                <select className="input" value={form.semestre} onChange={e => setForm({ ...form, semestre: e.target.value })}>
                  <option value="S1">Semestre 1</option>
                  <option value="S2">Semestre 2</option>
                  <option value="S1-S2">S1 + S2</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Niveau</label>
                <select className="input" value={form.niveau} onChange={e => setForm({ ...form, niveau: e.target.value })}>
                  {etabType === 'cycle_ing' ? (
                    <>
                      <option value="1ere">1ère Prépa</option>
                      <option value="2eme">2ème Prépa</option>
                      <option value="3eme">Branche commune</option>
                      <option value="4eme">4ème année</option>
                      <option value="5eme">5ème année</option>
                    </>
                  ) : (
                    <>
                      <option value="1ere">1ère Licence</option>
                      <option value="2eme">2ème Licence</option>
                      <option value="3eme">3ème Licence</option>
                      <option value="4eme">Master 1</option>
                      <option value="5eme">Master 2</option>
                    </>
                  )}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {etabType === 'cycle_ing' && <option value="prepa">Prépa</option>}
                  {etabType === 'cycle_ing' && <option value="branche_commune">Branche commune</option>}
                  <option value="specialite">Spécialité</option>
                  <option value="general">Général</option>
                </select>
              </div>
              {form.type === 'specialite' && (
                <div className="form-group">
                  <label className="form-label">Spécialité</label>
                  <input className="input" value={form.specialite} onChange={e => setForm({ ...form, specialite: e.target.value })} placeholder="Ex: Cloud Computing" />
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Enregistrement...' : editItem ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
