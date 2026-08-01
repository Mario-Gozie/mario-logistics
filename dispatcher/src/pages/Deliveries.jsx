/**
 * Deliveries.jsx — The core dispatcher screen
 *
 * HOW LIVE UPDATES WORK (Socket.io):
 * 1. This page connects to the backend WebSocket server on mount
 * 2. When a driver updates a delivery status on their app, the backend
 *    emits a 'delivery:updated' event via Socket.io
 * 3. This page receives that event and updates the delivery in the list
 *    WITHOUT needing to refresh the page
 */

import { useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import api from '../lib/axios'

const STATUS_FILTERS = ['all', 'pending', 'in_transit', 'delivered', 'failed']
const PRIORITY_COLORS = { high: 'var(--danger)', medium: 'var(--warning)', normal: 'var(--text-muted)' }

const EMPTY_FORM = {
  recipient_name: '', recipient_phone: '', address: '',
  notes: '', priority: 'normal', package_count: 1,
}

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState([])
  const [drivers, setDrivers] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showAssign, setShowAssign] = useState(null) // delivery to assign
  const [form, setForm] = useState(EMPTY_FORM)
  const [assignDriverId, setAssignDriverId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [liveCount, setLiveCount] = useState(0)
  const socketRef = useRef(null)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  // Load deliveries and drivers
  const load = () => {
    Promise.all([
      api.get('/deliveries'),
      api.get('/admin/drivers?active=true'),
    ]).then(([d, dr]) => {
      setDeliveries(d.data.deliveries ?? d.data)
      setDrivers(dr.data)
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    load()

    // SOCKET.IO — connect to backend for live updates
    const token = localStorage.getItem('ml_token')
    socketRef.current = io(
      import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000',
      { auth: { token } }
    )

    // When a driver updates a delivery status, update it in our list instantly
    socketRef.current.on('delivery:updated', (updated) => {
      setDeliveries(prev =>
        prev.map(d => d.id === updated.id ? { ...d, ...updated } : d)
      )
      setLiveCount(c => c + 1)
      showToast(`Delivery ${updated.tracking_code} → ${updated.status.replace('_', ' ')}`)
    })

    return () => socketRef.current?.disconnect()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post('/deliveries', form)
      showToast('Delivery created')
      setShowCreate(false)
      setForm(EMPTY_FORM)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create delivery')
    } finally { setSaving(false) }
  }

  const handleAssign = async () => {
    if (!assignDriverId) return
    setSaving(true)
    try {
      await api.patch(`/deliveries/${showAssign.id}/assign`, { driver_id: assignDriverId })
      showToast('Driver assigned successfully')
      setShowAssign(null)
      setAssignDriverId('')
      load()
    } catch { showToast('Failed to assign driver') }
    finally { setSaving(false) }
  }

  const handleCancel = async (delivery) => {
    if (!confirm(`Cancel delivery ${delivery.tracking_code}?`)) return
    try {
      await api.delete(`/deliveries/${delivery.id}`)
      showToast('Delivery cancelled')
      load()
    } catch { showToast('Cannot cancel — already picked up') }
  }

  const filtered = filter === 'all' ? deliveries : deliveries.filter(d => d.status === filter)

  const counts = {
    all: deliveries.length,
    pending: deliveries.filter(d => d.status === 'pending').length,
    in_transit: deliveries.filter(d => d.status === 'in_transit').length,
    delivered: deliveries.filter(d => d.status === 'delivered').length,
    failed: deliveries.filter(d => d.status === 'failed').length,
  }

  return (
    <div style={{ animation: 'fadeIn .3s ease' }}>
      {toast && (
        <div style={{ position:'fixed', top:20, right:24, zIndex:999, background:'var(--navy)', color:'#fff', padding:'10px 18px', borderRadius:8, fontSize:13, fontWeight:500, boxShadow:'0 4px 20px rgba(0,0,0,0.25)', animation:'slideIn .25s ease', maxWidth:320 }}>
          {toast}
        </div>
      )}

      <div className="topbar">
        <div>
          <div className="page-header" style={{ marginBottom: 4 }}>
            <h1>Deliveries</h1>
            <p>Create, assign and monitor all deliveries in real time</p>
          </div>
          {liveCount > 0 && (
            <span style={{ fontSize:11, color:'var(--success)', fontWeight:600 }}>
              ● {liveCount} live update{liveCount !== 1 ? 's' : ''} received
            </span>
          )}
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setError(''); setShowCreate(true) }}>
          <PlusIcon /> New Delivery
        </button>
      </div>

{/* Filter tabs */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        {STATUS_FILTERS.map(f => (
          <button
            key={f}
            className={`tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
            style={{ whiteSpace: 'nowrap' }}
          >
            {f === 'all' ? 'All' : f.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
            <span style={{ marginLeft:6, fontSize:10, opacity:.7 }}>({counts[f]})</span>
          </button>
        ))}
      </div>

      {loading ? <div className="loader"><div className="spinner" /></div> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tracking</th>
                <th>Recipient</th>
                <th>Address</th>
                <th>Driver</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7}><div className="empty-state"><p>No deliveries in this category</p></div></td></tr>
              )}
              {filtered.map((d, i) => (
                <tr key={d.id} style={{ animation: `fadeIn .2s ease ${i * 0.03}s both` }}>
                  <td className="font-mono" style={{ fontSize:12, color:'var(--navy)', fontWeight:600 }}>{d.tracking_code}</td>
                  <td>
                    <div style={{ fontWeight:500 }}>{d.recipient_name}</div>
                    {d.recipient_phone && <div style={{ fontSize:11, color:'var(--text-muted)' }}>{d.recipient_phone}</div>}
                  </td>
                  <td style={{ fontSize:12, color:'var(--text-sec)', maxWidth:160 }}>{d.address}</td>
                  <td style={{ fontSize:12 }}>
                    {d.driver_name ? (
                      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                        <div className="avatar" style={{ width:24, height:24, fontSize:9, flexShrink:0 }}>
                          {d.driver_name.slice(0,2).toUpperCase()}
                        </div>
                        {d.driver_name}
                      </div>
                    ) : (
                      <span style={{ color:'var(--text-muted)', fontStyle:'italic' }}>Unassigned</span>
                    )}
                  </td>
                  <td><StatusPill status={d.status} /></td>
                  <td>
                    <span style={{ fontSize:11, fontWeight:700, color: PRIORITY_COLORS[d.priority] }}>
                      {d.priority?.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:5 }}>
                      {d.status === 'pending' && (
                        <button className="btn btn-primary btn-sm" onClick={() => { setShowAssign(d); setAssignDriverId(d.driver_id || '') }}>
                          {d.driver_id ? 'Reassign' : 'Assign'}
                        </button>
                      )}
                      {['pending'].includes(d.status) && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleCancel(d)}>Cancel</button>
                      )}
                      {d.status === 'failed' && (
                        <button className="btn btn-outline btn-sm" onClick={() => { setShowAssign(d); setAssignDriverId('') }}>Reassign</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE DELIVERY MODAL */}
      {showCreate && (
        <div className="modal-overlay" style={{ animation:'fadeIn .2s ease' }} onClick={e => { if (e.target === e.currentTarget) setShowCreate(false) }}>
          <div className="modal" style={{ animation:'slideUp .25s ease', width:500 }}>
            <div className="modal-header">
              <h3>New Delivery</h3>
              <button className="modal-close" onClick={() => setShowCreate(false)}>×</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleCreate}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Recipient Name</label>
                  <input className="form-input" value={form.recipient_name} onChange={e => setForm({...form, recipient_name:e.target.value})} required placeholder="Timo Virtanen" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone (optional)</label>
                  <input className="form-input" value={form.recipient_phone} onChange={e => setForm({...form, recipient_phone:e.target.value})} placeholder="+358 40 000 0000" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Delivery Address</label>
                <input className="form-input" value={form.address} onChange={e => setForm({...form, address:e.target.value})} required placeholder="Kauppakatu 12, 70100 Kuopio" />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={form.priority} onChange={e => setForm({...form, priority:e.target.value})}>
                    <option value="normal">Normal</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Package Count</label>
                  <input type="number" className="form-input" min={1} value={form.package_count} onChange={e => setForm({...form, package_count:parseInt(e.target.value)})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes for Driver (optional)</label>
                <input className="form-input" value={form.notes} onChange={e => setForm({...form, notes:e.target.value})} placeholder="Leave at door if no answer..." />
              </div>
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:20 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" style={{width:14,height:14,borderWidth:2}}/> : 'Create Delivery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN DRIVER MODAL */}
      {showAssign && (
        <div className="modal-overlay" style={{ animation:'fadeIn .2s ease' }} onClick={e => { if (e.target === e.currentTarget) setShowAssign(null) }}>
          <div className="modal" style={{ animation:'slideUp .25s ease', width:380 }}>
            <div className="modal-header">
              <h3>Assign Driver</h3>
              <button className="modal-close" onClick={() => setShowAssign(null)}>×</button>
            </div>
            <p style={{ fontSize:13, color:'var(--text-sec)', marginBottom:16 }}>
              Assigning driver to <strong>{showAssign.tracking_code}</strong> — {showAssign.recipient_name}
            </p>
            <div className="form-group">
              <label className="form-label">Select Driver</label>
              <select className="form-select" value={assignDriverId} onChange={e => setAssignDriverId(e.target.value)}>
                <option value="">— Choose a driver —</option>
                {drivers.filter(d => d.is_active).map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:20 }}>
              <button className="btn btn-outline" onClick={() => setShowAssign(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAssign} disabled={!assignDriverId || saving}>
                {saving ? <span className="spinner" style={{width:14,height:14,borderWidth:2}}/> : 'Assign Driver'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
      `}</style>
    </div>
  )
}

function StatusPill({ status }) {
  const map = {
    pending: ['pill-pending', 'Pending'],
    in_transit: ['pill-transit', 'In Transit'],
    delivered: ['pill-delivered', 'Delivered'],
    failed: ['pill-failed', 'Failed'],
  }
  const [cls, label] = map[status] ?? ['', status]
  return <span className={`pill ${cls}`}>{label}</span>
}

function PlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
}
