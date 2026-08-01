import { useEffect, useState } from 'react'
import api from '../lib/axios'

const EMPTY_FORM = { name: '', email: '', phone: '', password: '' }

export default function Dispatchers() {
  const [dispatchers, setDispatchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const load = () => {
    api.get('/admin/dispatchers')
      .then(r => setDispatchers(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post('/admin/dispatchers', { ...form, role: 'dispatcher' })
      showToast('Dispatcher created')
      setShowModal(false)
      setForm(EMPTY_FORM)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (d) => {
    if (!confirm(`Remove dispatcher ${d.name}?`)) return
    try {
      await api.delete(`/admin/dispatchers/${d.id}`)
      showToast('Dispatcher removed')
      load()
    } catch { showToast('Failed to remove') }
  }

  return (
    <div style={{ animation: 'fadeIn .3s ease' }}>
      {toast && (
        <div style={{ position:'fixed', top:20, right:24, zIndex:999, background:'var(--navy)', color:'#fff', padding:'10px 18px', borderRadius:8, fontSize:13, fontWeight:500, boxShadow:'0 4px 20px rgba(0,0,0,0.2)', animation:'slideIn .25s ease' }}>
          {toast}
        </div>
      )}

      <div className="topbar">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Dispatchers</h1>
          <p>Office staff who create and assign deliveries</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setError(''); setShowModal(true) }}>
          <PlusIcon /> Add Dispatcher
        </button>
      </div>

      {loading ? <div className="loader"><div className="spinner" /></div> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Phone</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {dispatchers.length === 0 && (
                <tr><td colSpan={5}><div className="empty-state"><p>No dispatchers yet</p></div></td></tr>
              )}
              {dispatchers.map((d, i) => (
                <tr key={d.id} style={{ animation: `fadeIn .25s ease ${i * 0.04}s both` }}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div className="avatar" style={{ width:32, height:32, fontSize:12, flexShrink:0, background:'var(--navy-light)' }}>
                        {d.name.slice(0,2).toUpperCase()}
                      </div>
                      <span style={{ fontWeight:600, color:'var(--navy)' }}>{d.name}</span>
                    </div>
                  </td>
                  <td>{d.email}</td>
                  <td>{d.phone || '—'}</td>
                  <td style={{ color:'var(--text-muted)', fontSize:12 }}>
                    {new Date(d.created_at).toLocaleDateString('en-GB')}
                  </td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" style={{ animation:'fadeIn .2s ease' }} onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="modal" style={{ animation:'slideUp .25s ease' }}>
            <div className="modal-header">
              <h3>Add New Dispatcher</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={form.name} onChange={e => setForm({...form, name:e.target.value})} required placeholder="Anna Mäkinen" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" value={form.email} onChange={e => setForm({...form, email:e.target.value})} required placeholder="anna@mariologistics.fi" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} placeholder="+358 40 000 0000" />
              </div>
              <div className="form-group">
                <label className="form-label">Temporary Password</label>
                <input type="password" className="form-input" value={form.password} onChange={e => setForm({...form, password:e.target.value})} required placeholder="••••••••" />
              </div>
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:20 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" style={{width:14,height:14,borderWidth:2}}/> : 'Create Dispatcher'}
                </button>
              </div>
            </form>
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
function PlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
}
