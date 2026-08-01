import { useEffect, useState } from 'react'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js'
import api from '../lib/axios'

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
)

const CHART_OPTS = {
  responsive: true,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 } } },
    y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 } } },
  },
}

export default function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/analytics')
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loader"><div className="spinner" /></div>

  const labels = data?.dailyDeliveries?.map(d => d.date) ?? []
  const counts = data?.dailyDeliveries?.map(d => d.count) ?? []

  const lineData = {
    labels,
    datasets: [{
      label: 'Deliveries',
      data: counts,
      borderColor: '#1B2B4B',
      backgroundColor: 'rgba(27,43,75,0.06)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#C8A84B',
      pointRadius: 4,
    }],
  }

  const statusData = {
    labels: ['Delivered', 'In Transit', 'Pending', 'Failed'],
    datasets: [{
      data: [
        data?.statusBreakdown?.delivered ?? 0,
        data?.statusBreakdown?.in_transit ?? 0,
        data?.statusBreakdown?.pending ?? 0,
        data?.statusBreakdown?.failed ?? 0,
      ],
      backgroundColor: ['#1D9E75', '#1B5FA8', '#B07D1A', '#C0392B'],
      borderWidth: 0,
    }],
  }

  const hourData = {
    labels: data?.busyHours?.map(h => `${h.hour}:00`) ?? [],
    datasets: [{
      label: 'Deliveries',
      data: data?.busyHours?.map(h => h.count) ?? [],
      backgroundColor: '#1B2B4B',
      borderRadius: 4,
    }],
  }

  return (
    <div style={{ animation: 'fadeIn .3s ease' }}>
      <div className="page-header">
        <h1>Analytics</h1>
        <p>Performance overview for the last 30 days</p>
      </div>

      {/* Summary row */}
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total This Month', value: data?.monthTotal ?? 0 },
          { label: 'On-Time Deliveries', value: `${data?.onTimeRate ?? 0}%` },
          { label: 'Failed Deliveries', value: data?.statusBreakdown?.failed ?? 0 },
          { label: 'Avg Per Day', value: data?.avgPerDay ?? 0 },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ animation: `fadeUp .3s ease ${i * 0.06}s both` }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Deliveries — Last 30 Days</div>
          <Line data={lineData} options={CHART_OPTS} />
        </div>
        <div className="card">
          <div className="card-title">Status Breakdown</div>
          <div style={{ maxWidth: 220, margin: '0 auto' }}>
            <Doughnut data={statusData} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } } }} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Busiest Hours of Day</div>
        <Bar data={hourData} options={CHART_OPTS} />
      </div>

      <style>{`
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  )
}
