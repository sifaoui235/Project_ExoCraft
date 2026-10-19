import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminRoute({ children }) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const role = user.role?.toLowerCase()
  if (role !== 'administrateur' && role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
