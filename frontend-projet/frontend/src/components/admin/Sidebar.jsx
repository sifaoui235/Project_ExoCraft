import React from 'react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { id: 'dashboard',    label: 'Tableau de bord', color: '#6c5ce7' },
  { id: 'users',        label: 'Utilisateurs',    color: '#5b8dee' },
  { id: 'matieres',     label: 'Matières',         color: '#4dabf7' },
  { id: 'promos',       label: 'Promotions',       color: '#38d9a9' },
  { id: 'associations', label: 'Associations',     color: '#845ef7' },
  { id: 'archives',     label: 'Archives',         color: '#748ffc' },
  { id: 'profile',      label: 'Mon profil',       color: '#9775fa' },
]

export default function Sidebar({ activePage, onNavigate, onLogout }) {
  const { user } = useAuth()
  const firstName = user?.prenom || user?.firstName || ''
  const lastName = user?.nom || user?.lastName || ''

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg,#6c5ce7,#4a90e2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 900, fontSize: 18,
        }}>E</div>
        <div>
          <div className="logo-text">Exo<span>Craft</span></div>
          <div className="role-badge">Admin</div>
        </div>
      </div>

      {/* Navigation */}
      <div className="sidebar-section">
        <div className="sidebar-label">Navigation</div>
        {navItems.map(item => {
          const isActive = activePage === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '9px 12px 9px 16px',
                marginBottom: 2,
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                textAlign: 'left',
                transition: 'all 0.15s',
                borderLeft: `3px solid ${isActive ? item.color : 'transparent'}`,
                background: isActive ? `${item.color}14` : 'transparent',
                color: isActive ? item.color : '#4a4a6a',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.borderLeft = `3px solid ${item.color}60`
                  e.currentTarget.style.background = `${item.color}08`
                  e.currentTarget.style.color = item.color
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.borderLeft = '3px solid transparent'
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#4a4a6a'
                }
              }}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      {/* Footer admin */}
      <div className="sidebar-footer">
        <div className="admin-info" style={{ marginBottom: 10 }}>
          <div
            className="avatar"
            onClick={() => onNavigate('profile')}
            style={{ background: 'linear-gradient(135deg,#5b4fcf,#4a90e2)', color: '#fff', width: 34, height: 34, fontSize: 12, cursor: 'pointer', flexShrink: 0 }}
          >
            {firstName[0]}{lastName[0]}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div className="admin-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {firstName} {lastName}
            </div>
            <div className="admin-role" style={{ fontSize: 11, color: '#8888aa' }}>
              Administrateur
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{
            width: '100%', background: '#fff0ee',
            border: '1px solid #ffd5cc', borderRadius: 8,
            padding: '8px 12px', color: '#e17055',
            fontWeight: 600, fontSize: 12, cursor: 'pointer',
          }}
        >
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
