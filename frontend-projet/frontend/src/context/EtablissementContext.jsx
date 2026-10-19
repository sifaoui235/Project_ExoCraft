import React, { createContext, useContext, useEffect, useState } from 'react'
import { matieresApi } from '../services/adminApi'

// Requête directe pour les promotions (route backend = /promotions, pas /promos)
async function fetchPromotions() {
  const token = localStorage.getItem('exocraft_token')
  const res = await fetch('/api/promotions', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) return []
  return res.json()
}

const EtabContext = createContext({
  type: 'cycle_ing',
  label: "École d'ingénieurs — Cycle Ingénieur",
  badge: 'Cycle Ingénieur',
  promos: [],
  matieres: [],
  reload: () => {},
})

export function EtabProvider({ type = 'cycle_ing', children }) {
  const [promos, setPromos] = useState([])
  const [matieres, setMatieres] = useState([])

  async function fetchData() {
    try {
      const [p, m] = await Promise.all([fetchPromotions(), matieresApi.list()])
      setPromos(p)
      setMatieres(m)
    } catch (err) {
      console.error('[EtabProvider] fetch error:', err)
    }
  }

  useEffect(() => { fetchData() }, [type])

  const label = type === 'licence'
    ? 'Faculté — Licence / Master'
    : "École d'ingénieurs — Cycle Ingénieur"
  const badge = type === 'licence' ? 'FAC · Licence/Master' : 'Cycle Ingénieur'

  return (
    <EtabContext.Provider value={{ type, label, badge, promos, matieres, reload: fetchData }}>
      {children}
    </EtabContext.Provider>
  )
}

export function useEtab() {
  return useContext(EtabContext)
}

export default EtabContext
