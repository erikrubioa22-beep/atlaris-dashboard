import {useEffect,useMemo,useState} from 'react'
import {createPortal} from 'react-dom'

async function monitorFetch(path){
  const r=await fetch(path,{cache:'no-store',credentials:'same-origin'})
  const t=await r.text();let d={}
  try{d=t?JSON.parse(t):{}}catch{d={detail:t}}
  if(!r.ok)throw new Error(typeof d.detail==='string'?d.detail:`HTTP ${r.status}`)
  return d
}

function findPanelHost(title, selector){
  for(const el of document.querySelectorAll('h2,h3')){
    if(el.textContent.trim()===title){
      const panel=el.closest('.panel')
      return panel?.querySelector(selector)||null
    }
  }
  return null
}

export default function RRTCustomerModule(){
  const[hosts,setHosts]=useState({}),[open,setOpen]=useState(false),[monitor,setMonitor]=useState(null),[history,setHistory]=useState([]),[error,setError]=useState(''),[updated,setUpdated]=useState(null),[targets,setTargets]=useState([])

  useEffect(()=>{
    let stop=false,t
    const sync=()=>{
      if(stop)return
      const directory=document.querySelector('.directory-list')
      const pulse=document.querySelector('.customer-pulse')
      const monitoringSummary=findPanelHost('24/7 customer summary','.service-list')
      const customerTable=document.querySelector('.customer-monitor-table')
      const historyList=document.querySelector('.history-site-list')
      setHosts({directory,pulse,monitoringSummary,customerTable,historyList})

      if(directory){
        const count=directory.closest('.customer-directory')?.querySelector('.directory-header strong')
        if(count)count.textContent='6'
      }

      const patchStat=(label,value)=>{
        for(const card of document.querySelectorAll('.stat-card')){
          const labelEl=card.querySelector('.stat-card-top>span:first-child')
          if(labelEl?.textContent.trim()===label){
            const strong=card.querySelector(':scope>strong')
            if(strong)strong.textContent=value
          }
        }
      }
      const unique=new Map(targets.map(x=>[x.slug,x]))
      const uniqueTargets=unique.size||7
      const uniqueHealthy=[...unique.values()].filter(x=>x.reachable).length
      patchStat('Customer sites',`${uniqueHealthy}/${uniqueTargets} online`)
      patchStat('Customer endpoints',`${uniqueHealthy}/${uniqueTargets}`)
      patchStat('Endpoints monitored',`${uniqueTargets}/${uniqueTargets}`)
      patchStat('Endpoints healthy',String(uniqueHealthy))

      const sideLines=[...document.querySelectorAll('.sidebar-health .health-line')]
      for(const line of sideLines){
        if(line.textContent.includes('Customer sites')){
          const strong=line.querySelector('strong')
          if(strong)strong.textContent=`${uniqueHealthy}/${uniqueTargets}`
        }
      }

      t=setTimeout(sync,400)
    }
    sync()
    return()=>{stop=true;clearTimeout(t)}
  },[targets])

  async function refresh(){
    try{
      const[current,hist]=await Promise.all([
        monitorFetch('/api/monitor/current'),
        monitorFetch('/api/monitor/history?customer=rrt&limit=240')
      ])
      const list=current.targets||[]
      const item=list.find(x=>x.slug==='rrt')||null
      setTargets(list);setMonitor(item);setHistory(hist.history||[]);setError('');setUpdated(new Date())
    }catch(e){setError(e.message)}
  }

  useEffect(()=>{refresh();const t=setInterval(refresh,60000);return()=>clearInterval(t)},[])

  const summary=useMemo(()=>{
    if(!history.length)return{availability:'—',avg:'—',samples:0}
    const up=history.filter(x=>x.reachable).length
    const l=history.map(x=>x.response_ms).filter(Number.isFinite)
    const avg=l.length?Math.round(l.reduce((a,b)=>a+b,0)/l.length):null
    return{availability:`${((up/history.length)*100).toFixed(1)}%`,avg:avg==null?'—':`${avg} ms`,samples:history.length}
  },[history])

  const status=monitor?(monitor.reachable?'Operational':'Unavailable'):'Checking'
  const tls=monitor?.tls_days_remaining!=null?`${monitor.tls_days_remaining} days`:'—'
  const dot=monitor?.reachable?'green':'blue'

  const directoryCard=<button className="directory-item rrt-directory-item" onClick={()=>setOpen(true)}><div className="customer-monogram customer-logo rrt"><span className="customer-logo-fallback" style={{display:'grid'}}>RRT</span></div><div><strong>RRT</strong><span>CUS-006 · 1 service</span></div><span className={`status-dot ${dot}`}/></button>

  const pulseRow=<button className="pulse-row rrt-pulse-row" onClick={()=>setOpen(true)}><div className="customer-monogram customer-logo rrt"><span className="customer-logo-fallback" style={{display:'grid'}}>RRT</span></div><div><strong>RRT</strong><span>{monitor?`${monitor.reachable?1:0}/1 endpoints online`:'Loading server state'}</span></div><span className={`customer-status ${monitor?.reachable?'active':'onboarding'}`}>{monitor?.reachable?'Healthy':monitor?'Review':'Checking'}</span></button>

  const monitoringRow=<div className="service-line rrt-monitoring-row"><span><span className={`status-dot ${dot}`}/>RRT · Product Support Portal</span><strong>{monitor?.reachable?`${monitor.response_ms??'—'} ms`:monitor?'Review':'Checking'}</strong></div>

  const customerServiceRow=<div className={`customer-monitor-row ${monitor?.reachable?'healthy':'critical'} rrt-customer-service-row`}><div><strong>RRT</strong><small>Product Support Portal · rrt</small></div><span className={`monitor-badge ${monitor?.reachable?'healthy':'critical'}`}>{monitor?(monitor.reachable?'Online':'Unavailable'):'Checking'}</span><span>{monitor?.http_status??'—'}</span><span>{monitor?.response_ms!=null?`${monitor.response_ms} ms`:'—'}</span><span>{tls}</span><span>{summary.availability}</span></div>

  const historyRow=<div className="history-site rrt-history-row"><div><strong>RRT</strong><span>Product Support Portal · {summary.avg} average</span></div><div className="latency-bars" aria-label="Recent latency history for RRT">{history.slice(-24).map((item,index)=>{const max=Math.max(500,...history.slice(-24).map(x=>x.response_ms||0));return <span key={`${item.checked_at}-${index}`} className={item.reachable?'':'down'} style={{height:`${Math.max(8,Math.round((((item.response_ms||max)/max)*100)))}%`}} title={`${item.reachable?`${item.response_ms??'—'} ms`:'Unavailable'} · ${new Date(item.checked_at).toLocaleTimeString()}`}/>})}</div></div>

  return <>
    {hosts.directory&&createPortal(directoryCard,hosts.directory)}
    {hosts.pulse&&createPortal(pulseRow,hosts.pulse)}
    {hosts.monitoringSummary&&createPortal(monitoringRow,hosts.monitoringSummary)}
    {hosts.customerTable&&createPortal(customerServiceRow,hosts.customerTable)}
    {hosts.historyList&&createPortal(historyRow,hosts.historyList)}
    {open&&createPortal(<div className="rrt-overlay"><header><div><span>RRT · CUSTOMER OPERATIONS</span><h2>RRT Product Support Portal</h2><p>Live operational view for the internal RRT support application on atlas01.</p></div><div className="rrt-head-actions"><button onClick={refresh}>Refresh</button><button onClick={()=>setOpen(false)}>Close</button></div></header><section className="rrt-stats"><article><span>Status</span><strong>{status}</strong></article><article><span>HTTP</span><strong>{monitor?.http_status??'—'}</strong></article><article><span>Latency</span><strong>{monitor?.response_ms!=null?`${monitor.response_ms} ms`:'—'}</strong></article><article><span>TLS</span><strong>{tls}</strong></article></section><section className="rrt-stats"><article><span>Availability</span><strong>{summary.availability}</strong></article><article><span>History</span><strong>{summary.samples} samples</strong></article><article><span>Average latency</span><strong>{summary.avg}</strong></article><article><span>Knowledge base</span><strong>4 approved PDFs</strong></article></section><section className="rrt-grid"><article><h3>Website</h3><p>Internal HTTPS product support portal.</p><a className="rrt-open" href="https://rrt.atlaris.ca" target="_blank" rel="noreferrer">Open rrt.atlaris.ca ↗</a><code>/var/www/atlaris-customers/rrt/current/</code></article><article><h3>Source repository</h3><p>Managed customer website source.</p><code>/opt/atlaris-customers/websites/rrt/</code></article><article><h3>PDF repository</h3><p>Knowledge index restricted to four approved PDF documents.</p><code>/opt/atlaris-customers/websites/rrt/documents/</code></article><article><h3>Backups</h3><p>Controlled RRT backup area.</p><code>/opt/atlaris-customers/backups/rrt/</code></article></section><section className="rrt-panel"><h3>Operational capabilities</h3><div className="rrt-list"><div><b>Authentication</b><span>Username/password access is active.</span></div><div><b>Administrator users</b><span>Administrator user management is active.</span></div><div><b>Internal audit</b><span>Login, administration and support activity are recorded.</span></div><div><b>Knowledge support</b><span>Answers are grounded only in the four approved RRT PDF documents.</span></div><div><b>24/7 monitoring</b><span>Server-side availability, latency and TLS health are being collected by atlas01.</span></div></div></section>{error&&<section className="rrt-panel warn"><h3>Monitoring notice</h3><p>{error}</p></section>}<div className="rrt-update">{updated?`Monitoring refreshed ${updated.toLocaleTimeString()}`:'Loading monitoring data…'}</div></div>,document.body)}
    <style>{`.rrt-directory-item{border-color:#31557e!important}.customer-monogram.rrt{background:linear-gradient(135deg,#163659,#0e2238);border:1px solid #31557e}.rrt-monitoring-row,.rrt-customer-service-row,.rrt-history-row,.rrt-pulse-row{order:999}.rrt-overlay{position:fixed;z-index:700;inset:0 0 0 194px;overflow:auto;background:radial-gradient(circle at 85% 0,#23569430,transparent 32%),#07111b;color:#edf4ff;padding:34px 40px 70px}.rrt-overlay>header{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.rrt-overlay>header span{font-size:10px;letter-spacing:.14em;color:#7297c6;font-weight:800}.rrt-overlay h2{font-size:34px;margin:6px 0}.rrt-overlay p{color:#8ca2b9}.rrt-overlay button,.rrt-open{background:#0c1928;color:#dbe7f4;border:1px solid #29445f;border-radius:9px;padding:10px 13px;text-decoration:none}.rrt-head-actions{display:flex;gap:8px}.rrt-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:22px 0}.rrt-stats+.rrt-stats{margin-top:-10px}.rrt-stats article,.rrt-grid article,.rrt-panel{background:linear-gradient(145deg,#0d1a29,#09131f);border:1px solid #20384f;border-radius:14px;padding:18px}.rrt-stats span{display:block;font-size:9px;text-transform:uppercase;color:#7189a2}.rrt-stats strong{display:block;margin-top:8px;font-size:18px}.rrt-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.rrt-grid h3,.rrt-panel h3{margin-top:0}.rrt-grid code{display:block;margin-top:12px;padding:9px;background:#07131f;border:1px solid #20374d;border-radius:8px;color:#96b9df;overflow-wrap:anywhere}.rrt-panel{margin-top:14px}.rrt-list{display:grid;gap:8px}.rrt-list div{display:grid;grid-template-columns:190px 1fr;gap:14px;padding:10px;background:#071522;border:1px solid #1d3348;border-radius:9px}.rrt-list b{font-size:11px}.rrt-list span{font-size:11px;color:#8298af}.rrt-panel.warn{border-color:#665127;background:#231c11}.rrt-panel.warn p{color:#c8ae78}.rrt-update{margin-top:14px;color:#7189a2;font-size:11px}@media(max-width:900px){.rrt-overlay{inset:0;padding:20px}.rrt-stats,.rrt-grid{grid-template-columns:1fr}.rrt-list div{grid-template-columns:1fr}.rrt-head-actions{flex-direction:column}}`}</style>
  </>
}
