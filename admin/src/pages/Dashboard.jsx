import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../lib/axios'

// Animated number counter
function CountUp({ value }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (!value) return
    let start = 0
    const end = parseInt(value)
    const duration = 800
    const step = Math.ceil(end / (duration / 16))
    const timer = setInterval(() => {
      start += step
      if (start >= end) { setDisplay(end); clearInterval(timer) }
      else setDisplay(start)
    }, 16)
    return () => clearInterval(timer)
  }, [value])
  return <>{display.toLocaleString()}</>
}

const STATUS_PILL = {
  pending: <span className="pill pill-pending">Pending</span>,
  in_transit: <span className="pill pill-transit">In Transit</span>,
  delivered: <span className="pill pill-delivered">Delivered</span>,
  failed: <span className="pill pill-failed">Failed</span>,
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [drivers, setDrivers] = useState([])
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/drivers'),
      api.get('/deliveries?limit=5'),
    ])
      .then(([s, d, r]) => {
        setStats(s.data)
        setDrivers(d.data.slice(0, 5))
        setRecent(r.data.deliveries || [])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loader"><div className="spinner" /></div>

  return (
    <div style={{ animation: 'fadeIn .3s ease' }}>
      <div className="topbar">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.name?.split(' ')[0]}</p>
        </div>
        <div className="topbar-user">
          <span style={{ fontSize: 12 }}>{new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' })}</span>
          <div className="avatar">{user?.name?.slice(0,2).toUpperCase()}</div>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="stat-grid">
        {[
          { label: 'Total Deliveries', value: stats?.totalDeliveries ?? 0, sub: '↑ 12% this month', subColor: 'var(--success)' },
          { label: 'Active Drivers', value: stats?.activeDrivers ?? 0, sub: `${stats?.onRouteNow ?? 0} on route now`, subColor: 'var(--info)' },
          { label: 'Success Rate', value: `${stats?.successRate ?? 0}%`, sub: '↑ 2% vs last month', subColor: 'var(--success)', noCount: true },
          { label: 'Avg Delivery Time', value: `${stats?.avgDeliveryMins ?? 0}m`, sub: '↓ 4 min faster', subColor: 'var(--success)', noCount: true },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ animation: `fadeUp .3s ease ${i * 0.07}s both` }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">
              {s.noCount ? s.value : <CountUp value={s.value} />}
            </div>
            <div className="stat-sub" style={{ color: s.subColor }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap: 16 }}>
        {/* DRIVER TABLE */}
        <div>
          <div className="card-title" style={{ marginBottom: 10 }}>Top Drivers</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Deliveries</th>
                  <th>Rate</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {drivers.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No drivers yet</td></tr>
                )}
                {drivers.map((d, i) => (
                  <tr key={d.id} style={{ animation: `fadeIn .3s ease ${i * 0.05}s both` }}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{d.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.email}</div>
                    </td>
                    <td>{d.delivery_count ?? 0}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>{d.success_rate ?? 0}%</td>
                    <td>
                      <span className={`pill ${d.is_active ? 'pill-active' : 'pill-inactive'}`}>
                        {d.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RECENT DELIVERIES */}
        <div>
          <div className="card-title" style={{ marginBottom: 10 }}>Recent Deliveries</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tracking</th>
                  <th>Recipient</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 && (
                  <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No deliveries yet</td></tr>
                )}
                {recent.map((d, i) => (
                  <tr key={d.id} style={{ animation: `fadeIn .3s ease ${i * 0.05}s both` }}>
                    <td className="font-mono" style={{ fontSize: 12 }}>{d.tracking_code}</td>
                    <td>{d.recipient_name}</td>
                    <td>{STATUS_PILL[d.status] ?? d.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
    </div>
  )
}
