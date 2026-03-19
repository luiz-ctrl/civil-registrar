import { useEffect, useState } from 'react'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import { Chart, registerables } from 'chart.js'
import api from '../utils/api'
import './Dashboard.css'

Chart.register(...registerables)

const GRID   = 'rgba(0,0,0,0.05)'
const FONT   = { family: "'Plus Jakarta Sans', sans-serif", size: 11 }

export default function Dashboard() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="spinner" />
  if (!data)   return <div className="alert alert-danger">Failed to load dashboard.</div>

  const { summary, today, month, completion_rate, status, charts, top_residents, recent_transactions } = data

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>{new Date().toLocaleDateString('en-PH',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total Transactions</div>
          <div className="kpi-value">{summary.total_transactions.toLocaleString()}</div>
          {month.change_pct !== null && (
            <div className={`kpi-change ${month.change_pct >= 0 ? 'positive' : 'negative'}`}>
              <i className={`bi bi-arrow-${month.change_pct >= 0 ? 'up' : 'down'}-short`}></i>
              {Math.abs(month.change_pct)}% vs last month
            </div>
          )}
          <i className="bi bi-clipboard-check kpi-icon text-primary"></i>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Completion Rate</div>
          <div className="kpi-value">{completion_rate}%</div>
          <div className="kpi-bar"><div style={{width:`${completion_rate}%`}}></div></div>
          <i className="bi bi-check-circle kpi-icon text-success"></i>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">This Month</div>
          <div className="kpi-value">{month.this}</div>
          <div className="kpi-sub">Last month: {month.last}</div>
          <i className="bi bi-calendar-month kpi-icon" style={{color:'#f59e0b'}}></i>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Services</div>
          <div className="kpi-value">{summary.total_services}</div>
          <div className="kpi-sub">{summary.total_achievements} achievements</div>
          <i className="bi bi-list-ul kpi-icon text-info"></i>
        </div>
      </div>

      {/* Today + Status + Top Residents */}
      <div className="dash-row dash-row-3 mt-4">
        <div className="card p-4">
          <div className="dash-section-title"><i className="bi bi-sun"></i> Today's Activity</div>
          <div className="today-total">{today.total} <span>transactions</span></div>
          <div className="today-grid">
            <div className="today-stat" style={{background:'#f0fdf4'}}>
              <div style={{color:'#16a34a',fontSize:'22px',fontWeight:800}}>{today.completed}</div>
              <div style={{fontSize:'12px',color:'#6b7280'}}>Completed</div>
            </div>
            <div className="today-stat" style={{background:'#fffbeb'}}>
              <div style={{color:'#d97706',fontSize:'22px',fontWeight:800}}>{today.processing}</div>
              <div style={{fontSize:'12px',color:'#6b7280'}}>Processing</div>
            </div>
            <div className="today-stat" style={{background:'#f8fafc'}}>
              <div style={{color:'#64748b',fontSize:'22px',fontWeight:800}}>{today.pending}</div>
              <div style={{fontSize:'12px',color:'#6b7280'}}>Pending</div>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="dash-section-title"><i className="bi bi-pie-chart"></i> Status Breakdown</div>
          <div style={{position:'relative',height:'180px'}}>
            <Doughnut data={{
              labels:['Pending','Processing','Completed'],
              datasets:[{data:[status.pending,status.processing,status.completed],
                backgroundColor:['#94a3b8','#eab308','#22c55e'],borderWidth:2,borderColor:'#fff'}]
            }} options={{responsive:true,maintainAspectRatio:false,cutout:'65%',
              plugins:{legend:{position:'bottom',labels:{boxWidth:10,padding:10,font:FONT}}}}} />
          </div>
        </div>

        <div className="card p-4">
          <div className="dash-section-title"><i className="bi bi-person-lines-fill"></i> Top Residents</div>
          <ol className="top-residents">
            {top_residents.map((r,i) => (
              <li key={i}>
                <span>{r.name}</span>
                <span className="badge badge-secondary">{r.count}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Daily + Weekly */}
      <div className="dash-row dash-row-2 mt-4">
        <div className="card p-4">
          <div className="dash-section-title"><i className="bi bi-graph-up"></i> Daily Visits <small>(last 30 days)</small></div>
          <div style={{position:'relative',height:'180px'}}>
            <Line data={{labels:charts.daily.labels,datasets:[{data:charts.daily.values,
              borderColor:'#3b82f6',backgroundColor:'rgba(59,130,246,0.08)',
              borderWidth:2,pointRadius:2,fill:true,tension:0.4}]}}
              options={{responsive:true,maintainAspectRatio:false,
                plugins:{legend:{display:false}},
                scales:{x:{grid:{display:false},ticks:{maxTicksLimit:8,font:FONT}},
                        y:{beginAtZero:true,ticks:{precision:0,font:FONT},grid:{color:GRID}}}}} />
          </div>
        </div>
        <div className="card p-4">
          <div className="dash-section-title"><i className="bi bi-bar-chart-steps"></i> Weekly Trend <small>(last 8 weeks)</small></div>
          <div style={{position:'relative',height:'180px'}}>
            <Line data={{labels:charts.weekly.labels,datasets:[{data:charts.weekly.values,
              borderColor:'#f59e0b',backgroundColor:'rgba(245,158,11,0.08)',
              borderWidth:2.5,pointRadius:3,fill:true,tension:0.35}]}}
              options={{responsive:true,maintainAspectRatio:false,
                plugins:{legend:{display:false}},
                scales:{x:{grid:{display:false},ticks:{font:FONT}},
                        y:{beginAtZero:false,ticks:{precision:0,font:FONT},grid:{color:GRID}}}}} />
          </div>
        </div>
      </div>

      {/* Monthly + Services */}
      <div className="dash-row dash-row-2 mt-4">
        <div className="card p-4">
          <div className="dash-section-title"><i className="bi bi-calendar3"></i> Monthly Transactions <small>(last 6 months)</small></div>
          <div style={{position:'relative',height:'180px'}}>
            <Bar data={{labels:charts.monthly.labels,datasets:[{data:charts.monthly.values,
              backgroundColor:'#22c55e',borderRadius:4}]}}
              options={{responsive:true,maintainAspectRatio:false,
                plugins:{legend:{display:false}},
                scales:{x:{grid:{display:false},ticks:{autoSkip:false,font:FONT}},
                        y:{beginAtZero:true,ticks:{precision:0,font:FONT},grid:{color:GRID}}}}} />
          </div>
        </div>
        <div className="card p-4">
          <div className="dash-section-title"><i className="bi bi-award"></i> Most Requested Services</div>
          <div style={{position:'relative',height:'180px'}}>
            <Bar data={{labels:charts.services.labels,datasets:[{data:charts.services.values,
              backgroundColor:['#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6'],borderRadius:4}]}}
              options={{indexAxis:'y',responsive:true,maintainAspectRatio:false,
                plugins:{legend:{display:false}},
                scales:{x:{beginAtZero:true,ticks:{precision:0,font:FONT},grid:{color:GRID}},
                        y:{grid:{display:false},ticks:{font:FONT}}}}} />
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card mt-4">
        <div className="p-4" style={{borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div className="dash-section-title mb-0"><i className="bi bi-clock-history"></i> Recent Transactions</div>
          <a href="/admin/transactions" className="btn btn-outline btn-sm">View All</a>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>Resident</th><th>Type</th><th>Status</th><th>Visit Date</th></tr></thead>
            <tbody>
              {recent_transactions.map(t => (
                <tr key={t.id}>
                  <td className="text-muted">#{t.id}</td>
                  <td style={{fontWeight:600}}>{t.resident_name}</td>
                  <td className="text-muted">{t.transaction_type}</td>
                  <td><StatusBadge status={t.status} /></td>
                  <td className="text-muted">{new Date(t.visit_date).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function StatusBadge({ status }) {
  const map = { Completed:'badge-success', Processing:'badge-warning', Pending:'badge-secondary' }
  return <span className={`badge ${map[status]||'badge-secondary'}`}>{status}</span>
}
