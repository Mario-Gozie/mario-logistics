import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Drivers from './pages/Drivers'
import Dispatchers from './pages/Dispatchers'
import Analytics from './pages/Analytics'
import Layout from './components/Layout'

// Protects any route that requires login
// If not logged in → redirect to /login
function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loader"><div className="spinner" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="drivers" element={<Drivers />} />
            <Route path="dispatchers" element={<Dispatchers />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
