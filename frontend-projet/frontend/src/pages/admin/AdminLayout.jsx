import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { EtabProvider } from '../../context/EtablissementContext'
import Sidebar from '../../components/admin/Sidebar'
import Topbar from '../../components/admin/Topbar'
import Dashboard from './Dashboard'
import Users from './Users'
import Matieres from './Matieres'
import Promos from './Promos'
import Associations from './Associations'
import Archives from './Archives'
import Profile from './Profile'
import '../../styles/admin.css'

export default function AdminLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [activePage, setActivePage] = useState('dashboard')

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  function renderPage() {
    switch (activePage) {
      case 'dashboard':    return <Dashboard />
      case 'users':        return <Users />
      case 'matieres':     return <Matieres />
      case 'promos':       return <Promos />
      case 'associations': return <Associations />
      case 'archives':     return <Archives />
      case 'profile':      return <Profile />
      default:             return <Dashboard />
    }
  }

  return (
    <EtabProvider type="cycle_ing">
      <div className="admin-shell">
        <div className="app-layout">
          <Sidebar
            activePage={activePage}
            onNavigate={setActivePage}
            onLogout={handleLogout}
          />
          <div className="main-content">
            <Topbar activePage={activePage} onNavigate={setActivePage} />
            <div className="page-content">
              {renderPage()}
            </div>
          </div>
        </div>
      </div>
    </EtabProvider>
  )
}
