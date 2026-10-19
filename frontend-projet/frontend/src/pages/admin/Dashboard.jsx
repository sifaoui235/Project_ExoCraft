import React, { useState, useEffect, useCallback } from 'react'
import { statsApi, timeAgo, formatDateTime } from '../../services/adminApi'
import { useAuth } from '../../context/AuthContext'

function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return now
}

const TYPE_COLORS = {
  Quiz: '#5b4fcf', Examen: '#e17055', Cours: '#00b894',
  Exercices: '#f39c12', 'Résumé': '#4a90e2',
}

export default function Dashboard() {
  const { user } = useAuth()
  const now = useClock()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const firstName = user?.prenom || user?.firstName || ''
  const lastName = user?.nom || user?.lastName || ''

  const loadStats = useCallback(async () => {
    try {
      const data = await statsApi.get()
      setStats(data)
    } catch (err) {
      console.error('Dashboard stats error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
    const t = setInterval(loadStats, 30000)
    return () => clearInterval(t)
  }, [loadStats])

  const totalGenerations = stats?.totalGenerations ?? 0
  const aiGenerations = stats?.recentActivity ?? []

  const countByType = stats?.contentsByType ?? [
    { type: 'Quiz', count: 0, color: '#5b4fcf' },
    { type: 'Examen', count: 0, color: '#e17055' },
    { type: 'Cours', count: 0, color: '#00b894' },
    { type: 'Exercices', count: 0, color: '#f39c12' },
    { type: 'Résumé', count: 0, color: '#4a90e2' },
  ]

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <div style={{ textAlign: 'center', color: '#8888aa' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #e0e2f0', borderTopColor: '#6c5ce7', borderRadius: '50%', animation: 'adminSpin 0.8s linear infinite', margin: '0 auto 16px' }} />
          Chargement du tableau de bord...
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Bannière */}
      <div style={{
        background: 'linear-gradient(135deg, #2d2a7a 0%, #3d3ab0 40%, #4a90e2 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(91,79,207,0.25)',
      }}>
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', top: -100, right: 100, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', bottom: -80, right: -40, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
            Tableau de bord · Administration
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#ffffff', marginBottom: 8, letterSpacing: -0.5 }}>
            Bonjour, {firstName} {lastName} 👋
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', maxWidth: 420, lineHeight: 1.6 }}>
            Supervisez la plateforme ExoCraft en temps réel.
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums', letterSpacing: -1 }}>
            {now.toLocaleTimeString('fr-FR')}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
            {now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Enseignants actifs', value: stats?.activeEnseignants ?? 0, total: stats?.totalEnseignants ?? 0, color: '#5b4fcf', bg: '#edeaff', tag: 'ENS', sub: `${stats?.totalEnseignants ?? 0} total` },
          { label: 'Générations IA', value: totalGenerations, total: null, color: '#4a90e2', bg: '#e6f0ff', tag: 'IA', sub: `${stats?.thisMonthGenerations ?? 0} ce mois` },
          { label: 'Documents archivés', value: stats?.totalDocs ?? 0, total: null, color: '#00b894', bg: '#e0faf3', tag: 'DOC', sub: `${stats?.totalMatieres ?? 0} matières` },
          { label: 'Utilisateurs total', value: stats?.totalUsers ?? 0, total: null, color: '#f39c12', bg: '#fff5e0', tag: 'USR', sub: `${stats?.totalArchives ?? 0} archives` },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #e0e2f0', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(91,79,207,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11 }}>
                {s.tag}
              </div>
              {s.total !== null && (
                <span style={{ fontSize: 11, color: '#8888aa', background: '#f0f2ff', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>/ {s.total}</span>
              )}
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#8888aa', marginTop: 4 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: s.color, marginTop: 8 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Graphe IA */}
          <div style={{ background: '#fff', border: '1px solid #e0e2f0', borderRadius: 14, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a3e' }}>Générations IA par type</div>
              <span style={{ background: '#edeaff', color: '#5b4fcf', padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{totalGenerations} total</span>
            </div>
            {totalGenerations === 0 ? (
              <div style={{ padding: '32px 0', textAlign: 'center' }}>
                <div style={{ fontWeight: 700, color: '#1a1a3e', marginBottom: 6 }}>Aucune génération pour l'instant</div>
                <div style={{ fontSize: 12, color: '#8888aa' }}>Le compteur se met à jour automatiquement</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {countByType.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                    <div style={{ width: 80, fontSize: 12, color: '#3a3a6a' }}>{item.type}</div>
                    <div style={{ flex: 1, height: 8, background: '#f0f2ff', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${totalGenerations > 0 ? (item.count / totalGenerations) * 100 : 0}%`, height: '100%', background: item.color, borderRadius: 4, transition: 'width 0.6s ease', minWidth: item.count > 0 ? 4 : 0 }} />
                    </div>
                    <div style={{ width: 28, textAlign: 'right', fontSize: 12, fontWeight: 700, color: item.color }}>{item.count}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tableau générations */}
          <div style={{ background: '#fff', border: '1px solid #e0e2f0', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #e0e2f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a3e' }}>Historique des générations IA</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#00b894', fontWeight: 700 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00b894', display: 'inline-block', animation: 'adminBlink 1.5s infinite' }} />
                Temps réel
              </div>
            </div>
            {aiGenerations.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: '#8888aa', fontSize: 13 }}>Aucune génération enregistrée</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Enseignant', 'Sujet généré', 'Type', 'Date & heure'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: '#8888aa', background: '#fafbff', borderBottom: '1px solid #e0e2f0', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {aiGenerations.slice(0, 8).map(g => (
                    <tr key={g.id} style={{ borderBottom: '1px solid #f0f2ff' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1a1a3e', fontSize: 13 }}>{g.enseignant}</td>
                      <td style={{ padding: '12px 16px', color: '#3a3a6a', fontSize: 13, maxWidth: 180 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.sujet}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: (TYPE_COLORS[g.type] ?? '#4a90e2') + '18', color: TYPE_COLORS[g.type] ?? '#4a90e2' }}>{g.type}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 11, color: '#8888aa', fontVariantNumeric: 'tabular-nums' }}>
                        <div>{formatDateTime(g.generatedAt)}</div>
                        <div style={{ color: '#b0b0cc', marginTop: 2 }}>{timeAgo(g.generatedAt)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Droite */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: '#fff', border: '1px solid #e0e2f0', borderRadius: 14, padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a3e', marginBottom: 14 }}>Répartition</div>
            {[
              { label: 'Enseignants actifs', count: stats?.activeEnseignants ?? 0, color: '#5b4fcf' },
              { label: 'Total enseignants', count: stats?.totalEnseignants ?? 0, color: '#4a90e2' },
              { label: 'Total utilisateurs', count: stats?.totalUsers ?? 0, color: '#f39c12' },
            ].map((item, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#3a3a6a', marginBottom: 5 }}>
                  <span>{item.label}</span>
                  <span style={{ fontWeight: 700, color: item.color }}>{item.count}</span>
                </div>
                <div style={{ height: 6, background: '#f0f2ff', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${(stats?.totalUsers ?? 0) > 0 ? (item.count / (stats?.totalUsers ?? 1)) * 100 : 0}%`, height: '100%', background: item.color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', border: '1px solid #e0e2f0', borderRadius: 14, padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a3e', marginBottom: 14 }}>Activité IA récente</div>
            {aiGenerations.length === 0 ? (
              <div style={{ fontSize: 13, color: '#8888aa', padding: '16px 0', textAlign: 'center' }}>Aucune activité récente</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {aiGenerations.slice(0, 6).map((g, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: TYPE_COLORS[g.type] ?? '#4a90e2', flexShrink: 0, marginTop: 4 }} />
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: 12, color: '#1a1a3e', fontWeight: 500, lineHeight: 1.4 }}>{g.enseignant} — {g.type}</div>
                      <div style={{ fontSize: 11, color: '#8888aa', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.sujet}</div>
                      <div style={{ fontSize: 10, color: '#b0b0cc', marginTop: 3 }}>{timeAgo(g.generatedAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
