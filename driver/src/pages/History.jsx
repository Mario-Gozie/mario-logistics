import { useEffect, useState } from 'react'
import api from '../lib/axios'

export default function History() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/driver/history').then(r => setHistory(r.data)).finally(() => setLoading(false))
  }, [])

  const delivered = history.filter(d => d.status === 'delivered').length
  const failed = history.filter(d => d.status === 'failed').length
  const rate = history.length ? Math.round((delivered / history.length) * 100) : 0

  return (
    <div className="page" style={{ animation: 'fadeIn .3s ease' }}>
      <div className="section-label">My Performance</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
        {[
          { label: 'Total', value: history.length, color: 'var(--navy)' },
          { label: 'Success Rate', value: `${rate}%`, color: 'var(--success)' },
          { label: 'Failed', value: failed, color: 'var(--danger)' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--white)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '10px 12px', animation: `fadeUp .3s ease ${i*.06}s both` }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--text-muted)', marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="section-label">Past Deliveries</div>

      {loading ? <div className="loader"><div className="spinner" /></div> : (
        history.length === 0 ? (
          <div className="empty-state"><p>No delivery history yet</p></div>
        ) : (
          history.map((d, i) => (
            <div key={d.id} className="delivery-card" style={{ padding: '12px 14px', animation: `fadeUp .25s ease ${i*.04}s both` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="tracking-code">{d.tracking_code}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)', margin: '3px 0 2px' }}>{d.recipient_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.address}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    {d.delivered_at ? new Date(d.delivered_at).toLocaleString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : new Date(d.created_at).toLocaleDateString('en-GB')}
                  </div>
                </div>
                <span className={`pill pill-${d.status}`}>{d.status === 'delivered' ? 'Delivered' : 'Failed'}</span>
              </div>
            </div>
          ))
        )
      )}
      <style>{'@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}'}</style>
    </div>
  )
}
