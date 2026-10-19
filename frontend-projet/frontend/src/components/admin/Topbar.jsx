import React from 'react'
import { useEtab } from '../../context/EtablissementContext'
import { useAuth } from '../../context/AuthContext'

const pageNames = {
  dashboard:    'Tableau de bord',
  users:        'Utilisateurs',
  matieres:     'Matières',
  promos:       'Promotions',
  associations: 'Associations',
  archives:     'Archives',
  profile:      'Mon profil',
}

export default function Topbar({ activePage, onNavigate }) {
  const { badge, type } = useEtab()
  const { user } = useAuth()
  const firstName = user?.prenom || user?.firstName || ''
  const lastName = user?.nom || user?.lastName || ''

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="breadcrumb">
          <span>ExoCraft</span>
          <span className="breadcrumb-sep">›</span>
          <span style={{ color: '#9090b0' }}>{badge}</span>
          <span className="breadcrumb-sep">›</span>
          <span>{pageNames[activePage] ?? activePage}</span>
        </div>
      </div>

      <div className="topbar-right">
        <span
          className={`badge ${type === 'licence' ? 'badge-blue' : 'badge-purple'}`}
          style={{ fontSize: 11, padding: '5px 12px' }}
        >
          {badge}
        </span>

        <div
          onClick={() => onNavigate('profile')}
          title="Mon profil"
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg,#6c5ce7,#4a90e2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 12,
            cursor: 'pointer',
            border: activePage === 'profile' ? '2px solid #6c5ce7' : '2px solid transparent',
            boxShadow: activePage === 'profile'
              ? '0 0 0 3px rgba(108,92,231,0.25)'
              : '0 2px 8px rgba(108,92,231,0.3)',
            transition: 'all 0.2s',
            flexShrink: 0,
          }}
        >
          {(firstName[0] || 'A')}{(lastName[0] || 'D')}
        </div>
      </div>
    </div>
  )
}
