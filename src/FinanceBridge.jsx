import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

const API = '/api/finance'
const cache = new Map()
const money = (value) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(Number(value || 0))

async function fetchJson(path, ttl = 15000) {
  const key = path
  const now = Date.now()
  const cached = cache.get(key)
  if (cached && now - cached.at < ttl) return cached.data
  const response = await fetch(`${API}${path}`, { credentials: 'same-origin', cache: 'no-store' })
  const text = await response.text()
  let data = {}
  try { data = text ? JSON.parse(text) : {} } catch { data = { detail: text } }
  if (!response.ok) throw new Error(data.detail || `HTTP ${response.status}`)
  cache.set(key, { at: now, data })
  return data
}

function Metric({ label, value, raw = false }) {
  return <article className="fx-card"><span>{label}</span><strong>{raw ? value : money(value)}</strong></article>
}

function DataTable({ rows = [], columns = [], moneyColumns = [] }) {
  if (!rows.length) return <div className="fx-empty">No records yet.</div>
  return <div className="fx-table-wrap"><table className="fx-table"><thead><tr>{columns.map((c) => <th key={c}>{c.replaceAll('_', ' ')}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row.id ?? index}>{columns.map((c) => <td key={c}>{moneyColumns.includes(c) ? money(row[c]) : String(row[c] ?? '—')}</td>)}</tr>)}</tbody></table></div>
}

function FinanceWorkspace({ onClose }) {
  const [tab, setTab] = useState('overview')
  const [state, setState] = useState({ loading: true, error: '', data: null })
  const tabs = useMemo(() => [
    ['overview', 'Overview'],
    ['payables', 'Payables'],
    ['receivables', 'Receivables'],
    ['cashflow', 'Cash Flow'],
    ['alerts', 'Alerts'],
    ['budgets', 'Budget'],
    ['executive', 'Executive Report'],
  ], [])

  useEffect(() => {
    let active = true
    setState({ loading: true, error: '', data: null })
    const load = async () => {
      try {
        let data
        if (tab === 'overview') {
          const [summary, aging, flow, alerts] = await Promise.all([
            fetchJson('/summary', 10000),
            fetchJson('/aging-summary', 10000),
            fetchJson('/cash-flow?days=90', 10000),
            fetchJson('/alerts?days=30', 10000),
          ])
          data = { summary, aging, flow, alerts }
        } else if (tab === 'payables') data = await fetchJson('/payables', 8000)
        else if (tab === 'receivables') data = await fetchJson('/receivables', 8000)
        else if (tab === 'cashflow') data = await fetchJson('/cash-flow?days=90', 8000)
        else if (tab === 'alerts') data = await fetchJson('/alerts?days=30', 8000)
        else if (tab === 'budgets') data = await fetchJson(`/budgets?fiscal_year=${new Date().getFullYear()}`, 8000)
        else if (tab === 'executive') data = await fetchJson(`/executive-report?fiscal_year=${new Date().getFullYear()}`, 8000)
        if (active) setState({ loading: false, error: '', data })
      } catch (error) {
        if (active) setState({ loading: false, error: error.message, data: null })
      }
    }
    load()
    return () => { active = false }
  }, [tab])

  const renderContent = () => {
    if (state.loading) return <div className="fx-loading"><div className="fx-spinner" />Loading finance data…</div>
    if (state.error) return <div className="fx-error">{state.error}</div>
    const d = state.data

    if (tab === 'overview') {
      const overdue = (d.aging?.['1-30'] || 0) + (d.aging?.['31-60'] || 0) + (d.aging?.['61-90'] || 0) + (d.aging?.['90+'] || 0)
      return <><section className="fx-grid"><Metric label="Revenue" value={d.summary.revenue} /><Metric label="Expenses" value={d.summary.expenses} /><Metric label="Net income" value={d.summary.net_income} /><Metric label="Accounts receivable" value={d.summary.accounts_receivable} /><Metric label="Overdue AR" value={overdue} /><Metric label="90-day projected cash" value={d.flow.net_projected} /></section><section className="fx-panel"><div className="fx-panel-head"><div><span className="fx-kicker">Executive signal</span><h3>Financial operating position</h3></div><span className={`fx-health ${d.alerts.count ? 'warn' : ''}`}>{d.alerts.count ? `${d.alerts.count} alert(s)` : 'No near-term alerts'}</span></div><p>Live Finance API data with short-lived client caching to reduce duplicate requests and keep navigation responsive.</p></section></>
    }
    if (tab === 'payables') return <section className="fx-panel"><div className="fx-panel-head"><div><span className="fx-kicker">Accounts payable</span><h3>Vendor obligations</h3></div></div><DataTable rows={d} columns={['vendor_name','bill_number','due_date','total_amount','paid_amount','balance','effective_status']} moneyColumns={['total_amount','paid_amount','balance']} /></section>
    if (tab === 'receivables') return <section className="fx-panel"><div className="fx-panel-head"><div><span className="fx-kicker">Accounts receivable</span><h3>Customer invoice aging</h3></div></div><DataTable rows={d} columns={['invoice_number','customer_ref','due_date','total_amount','paid_amount','balance','aging_bucket']} moneyColumns={['total_amount','paid_amount','balance']} /></section>
    if (tab === 'cashflow') return <><section className="fx-grid"><Metric label="Expected receipts" value={d.expected_receipts} /><Metric label="Scheduled payables" value={d.scheduled_payables} /><Metric label="Recurring obligations" value={d.recurring_obligations} /><Metric label="Projected net" value={d.net_projected} /></section><section className="fx-panel"><div className="fx-panel-head"><div><span className="fx-kicker">Trend</span><h3>Monthly operating history</h3></div></div><DataTable rows={d.monthly_history || []} columns={['month','revenue','expenses']} moneyColumns={['revenue','expenses']} /></section></>
    if (tab === 'alerts') return <section className="fx-panel"><div className="fx-panel-head"><div><span className="fx-kicker">Control center</span><h3>Financial alerts · next 30 days</h3></div><span className="fx-health warn">{d.count} alert(s)</span></div><DataTable rows={d.alerts || []} columns={['severity','type','title','due_date','amount']} moneyColumns={['amount']} /></section>
    if (tab === 'budgets') return <section className="fx-panel"><div className="fx-panel-head"><div><span className="fx-kicker">Planning</span><h3>{new Date().getFullYear()} budget vs actual</h3></div></div><DataTable rows={d} columns={['category','annual_amount','actual_amount','variance_amount','used_percent']} moneyColumns={['annual_amount','actual_amount','variance_amount']} /></section>
    if (tab === 'executive') return <><section className="fx-grid"><Metric label="YTD revenue" value={d.revenue} /><Metric label="YTD expenses" value={d.expenses} /><Metric label="Net income" value={d.net_income} /><Metric label="Accounts receivable" value={d.accounts_receivable} /><Metric label="Accounts payable" value={d.accounts_payable} /><Metric label="Estimated net GST" value={d.estimated_net_gst} /></section><section className="fx-panel"><div className="fx-panel-head"><div><span className="fx-kicker">Management report</span><h3>Executive Finance Report · {d.fiscal_year}</h3></div></div><p>Jurisdiction: {d.jurisdiction} · Currency: {d.currency}</p></section></>
    return null
  }

  return <div className="fx-shell"><div className="fx-glow fx-glow-a" /><div className="fx-glow fx-glow-b" /><header className="fx-top"><div><span className="fx-kicker">ATLARIS TECHNOLOGIES · BRITISH COLUMBIA, CANADA</span><h2>Finance & Administration</h2><p>Financial operations, obligations, controls and executive reporting.</p></div><button className="secondary-button" onClick={onClose}>Close</button></header><nav className="fx-tabs">{tabs.map(([id,label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>)}</nav><main className="fx-content">{renderContent()}</main></div>
}

export default function FinanceBridge() {
  const [host, setHost] = useState(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    let timer
    const sync = () => {
      if (cancelled) return
      const groups = [...document.querySelectorAll('.nav-group')]
      const admin = groups.find((group) => group.querySelector('.sidebar-section-label')?.textContent.trim() === 'Administration')
      const target = admin?.querySelector('.nav-list')
      if (target) setHost(target)
      document.querySelectorAll('.finance-nav').forEach((node) => { node.style.display = 'none' })
      timer = window.setTimeout(sync, 500)
    }
    sync()
    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [])

  return <>{host && createPortal(<button type="button" className={`nav-link finance-native-nav${open ? ' active' : ''}`} onClick={() => setOpen(true)}><span>▦</span>Finance & Administration</button>, host)}{open && createPortal(<FinanceWorkspace onClose={() => setOpen(false)} />, document.body)}<style>{`
    .finance-native-nav{position:relative;overflow:hidden}.finance-native-nav::after{content:"";position:absolute;inset:auto 12px 3px 40px;height:1px;background:linear-gradient(90deg,transparent,#5e87ff,transparent);opacity:.7}
    .fx-shell{position:fixed;z-index:200;inset:0 0 0 264px;overflow:auto;background:linear-gradient(155deg,#07101b 0%,#0a1422 44%,#07101a 100%);color:#e8f0fb;padding:34px;contain:layout paint;isolation:isolate}.fx-shell::before{content:"";position:fixed;inset:0 0 0 264px;pointer-events:none;background-image:linear-gradient(rgba(109,143,197,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(109,143,197,.025) 1px,transparent 1px);background-size:36px 36px;mask-image:linear-gradient(to bottom,rgba(0,0,0,.65),transparent 78%)}
    .fx-glow{position:fixed;border-radius:999px;filter:blur(70px);opacity:.18;pointer-events:none;will-change:transform}.fx-glow-a{width:460px;height:460px;right:4%;top:-130px;background:#4678ff}.fx-glow-b{width:360px;height:360px;left:22%;bottom:-150px;background:#27d0a0}.fx-top{position:relative;z-index:1;display:flex;justify-content:space-between;gap:24px;align-items:flex-start;margin-bottom:22px}.fx-top h2{font-size:34px;margin:7px 0 6px;letter-spacing:-.035em}.fx-top p{margin:0;color:#7f91aa}.fx-kicker{font-size:9px;letter-spacing:.14em;font-weight:900;color:#6684b5}.fx-tabs{position:relative;z-index:1;display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px}.fx-tabs button{border:1px solid #233750;border-radius:10px;background:#0c1726;color:#9eb0c7;padding:9px 13px;cursor:pointer}.fx-tabs button.active{color:white;border-color:#537ef0;background:linear-gradient(135deg,#3159d8,#2547b4);box-shadow:0 0 22px rgba(80,121,244,.18)}.fx-content{position:relative;z-index:1;content-visibility:auto;contain-intrinsic-size:700px}.fx-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-bottom:14px}.fx-card,.fx-panel{background:linear-gradient(145deg,rgba(15,27,43,.94),rgba(10,18,30,.94));border:1px solid #20354d;border-radius:15px;box-shadow:0 18px 50px rgba(0,0,0,.18),inset 0 1px rgba(255,255,255,.025)}.fx-card{padding:18px;min-height:104px}.fx-card span{display:block;color:#7890ad;font-size:11px}.fx-card strong{display:block;margin-top:11px;font-size:25px;color:#fff}.fx-panel{padding:20px;margin-bottom:14px}.fx-panel p{color:#7d90a9}.fx-panel-head{display:flex;justify-content:space-between;gap:18px;align-items:center;margin-bottom:14px}.fx-panel-head h3{margin:5px 0 0}.fx-health{border:1px solid rgba(70,207,158,.25);background:rgba(70,207,158,.08);color:#62ddb2;padding:6px 9px;border-radius:999px;font-size:9px;font-weight:900;text-transform:uppercase}.fx-health.warn{border-color:rgba(232,181,103,.25);background:rgba(232,181,103,.08);color:#e4ba70}.fx-table-wrap{overflow:auto}.fx-table{width:100%;border-collapse:collapse;min-width:720px}.fx-table th,.fx-table td{text-align:left;padding:11px;border-bottom:1px solid #192b3f;font-size:11px}.fx-table th{color:#607995;font-size:9px;letter-spacing:.06em;text-transform:uppercase}.fx-table td{color:#b9c7d8}.fx-empty,.fx-loading{padding:32px;color:#71859e;text-align:center}.fx-loading{display:flex;justify-content:center;align-items:center;gap:10px}.fx-spinner{width:16px;height:16px;border:2px solid #28405e;border-top-color:#6d93ff;border-radius:50%;animation:fxspin .8s linear infinite}.fx-error{padding:14px;border-radius:10px;background:rgba(185,68,79,.12);border:1px solid rgba(238,111,122,.22);color:#f49aa3}@keyframes fxspin{to{transform:rotate(360deg)}}@media(max-width:900px){.fx-shell{inset:0;padding:20px}.fx-shell::before{inset:0}.fx-grid{grid-template-columns:1fr}.fx-top{flex-direction:column}.fx-glow{display:none}}
  `}</style></>
}
