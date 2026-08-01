import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Deliveries from './pages/Deliveries'
import Drivers from './pages/Drivers'
import Layout from './components/Layout'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loader"><div className="spinner" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'dispatcher') return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/deliveries" replace />} />
            <Route path="deliveries" element={<Deliveries />} />
            <Route path="drivers" element={<Drivers />} />
          </Route>
          <Route path="*" element={<Navigate to="/deliveries" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
