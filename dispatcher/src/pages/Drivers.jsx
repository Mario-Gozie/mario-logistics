import { useEffect, useState } from 'react'
import api from '../lib/axios'

export default function Drivers() {
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/drivers')
      .then(r => setDrivers(r.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ animation: 'fadeIn .3s ease' }}>
      <div className="page-header">
        <h1>Drivers</h1>
        <p>View available drivers to assign deliveries</p>
      </div>

      {loading ? <div className="loader"><div className="spinner" /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {drivers.map((d, i) => (
            <div
              key={d.id}
              className="card"
              style={{ animation: `fadeUp .3s ease ${i * 0.05}s both`, padding: '16px 20px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div className="avatar" style={{ width: 40, height: 40, fontSize: 14, flexShrink: 0 }}>
                  {d.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--navy)' }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.phone || d.email}</div>
                </div>
                <span className={`pill ${d.is_active ? 'pill-active' : 'pill-inactive'}`} style={{ marginLeft: 'auto' }}>
                  {d.is_active ? 'Active' : 'Off'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ background: 'var(--offwhite)', borderRadius: 6, padding: '8px 10px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Deliveries</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy)' }}>{d.delivery_count ?? 0}</div>
                </div>
                <div style={{ background: 'var(--offwhite)', borderRadius: 6, padding: '8px 10px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Success</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)' }}>{d.success_rate ?? 0}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  )
}
