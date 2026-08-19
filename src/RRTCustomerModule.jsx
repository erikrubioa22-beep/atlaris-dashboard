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
  const[hosts,setHosts]=useState({}),[selected,setSelected]=useState(false),[monitor,setMonitor]=useState(null),[history,setHistory]=useState([]),[error,setError]=useState(''),[updated,setUpdated]=useState(null),[targets,setTargets]=useState([])

  useEffect(()=>{
    let stop=false,t
    const sync=()=>{
      if(stop)return
      const directory=document.querySelector('.directory-list')
      const customerDetail=document.querySelector('.customer-detail')
      const pulse=document.querySelector('.customer-pulse')
      const monitoringSummary=findPanelHost('24/7 customer summary','.service-list')
      const customerTable=document.querySelector('.customer-monitor-table')
      const historyList=document.querySelector('.history-site-list')
      setHosts({directory,customerDetail,pulse,monitoringSummary,customerTable,historyList})

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

      for(const line of document.querySelectorAll('.sidebar-health .health-line')){
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

  useEffect(()=>{
    const handler=e=>{
      const button=e.target.closest?.('.directory-item')
      if(button && !button.classList.contains('rrt-directory-item')) setSelected(false)
    }
    document.addEventListener('click',handler,true)
    return()=>document.removeEventListener('click',handler,true)
  },[])

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

  const status=monitor?(monitor.reachable?'Online':'Unavailable'):'Checking'
  const tls=monitor?.tls_days_remaining!=null?`${monitor.tls_days_remaining} days`:'—'
  const dot=monitor?.reachable?'green':'blue'

  const directoryCard=<button className={`directory-item rrt-directory-item ${selected?'selected':''}`} onClick={()=>setSelected(true)}><div className="customer-monogram customer-logo rrt"><span className="customer-logo-fallback" style={{display:'grid'}}>RRT</span></div><div><strong>RRT</strong><span>CUS-006 · 1 service</span></div><span className={`status-dot ${dot}`}/></button>

  const pulseRow=<button className="pulse-row rrt-pulse-row" onClick={()=>{setSelected(true);document.querySelector('.nav-link:nth-of-type(1)')}}><div className="customer-monogram customer-logo rrt"><span className="customer-logo-fallback" style={{display:'grid'}}>RRT</span></div><div><strong>RRT</strong><span>{monitor?`${monitor.reachable?1:0}/1 endpoints online`:'Loading server state'}</span></div><span className={`customer-status ${monitor?.reachable?'active':'onboarding'}`}>{monitor?.reachable?'Healthy':monitor?'Review':'Checking'}</span></button>

  const monitoringRow=<div className="service-line rrt-monitoring-row"><span><span className={`status-dot ${dot}`}/>RRT · Product Support Portal</span><strong>{monitor?.reachable?`${monitor.response_ms??'—'} ms`:monitor?'Review':'Checking'}</strong></div>

  const customerServiceRow=<div className={`customer-monitor-row ${monitor?.reachable?'healthy':'critical'} rrt-customer-service-row`}><div><strong>RRT</strong><small>Product Support Portal · rrt</small></div><span className={`monitor-badge ${monitor?.reachable?'healthy':'critical'}`}>{monitor?(monitor.reachable?'Online':'Unavailable'):'Checking'}</span><span>{monitor?.http_status??'—'}</span><span>{monitor?.response_ms!=null?`${monitor.response_ms} ms`:'—'}</span><span>{tls}</span><span>{summary.availability}</span></div>

  const historyRow=<div className="history-site rrt-history-row"><div><strong>RRT</strong><span>Product Support Portal · {summary.avg} average</span></div><div className="latency-bars" aria-label="Recent latency history for RRT">{history.slice(-24).map((item,index)=>{const max=Math.max(500,...history.slice(-24).map(x=>x.response_ms||0));return <span key={`${item.checked_at}-${index}`} className={item.reachable?'':'down'} style={{height:`${Math.max(8,Math.round((((item.response_ms||max)/max)*100)))}%`}} title={`${item.reachable?`${item.response_ms??'—'} ms`:'Unavailable'} · ${new Date(item.checked_at).toLocaleTimeString()}`}/>})}</div></div>

  const inlineDetail=<div className="rrt-inline-detail"><div className="customer-detail-head"><div className="customer-identity"><div className="customer-monogram customer-logo large rrt"><span className="customer-logo-fallback" style={{display:'grid'}}>RRT</span></div><div><span className="eyebrow">CUS-006</span><h3>RRT</h3><p>Internal product support portal with authenticated access, audit logging, voice support and a four-document knowledge base.</p></div></div><span className={`customer-status ${monitor?.reachable?'active':'onboarding'}`}>{monitor?.reachable?'Active':'Review'}</span></div><div className="customer-metrics"><div><strong>1</strong><span>Environment</span></div><div><strong>1</strong><span>Service</span></div><div><strong>{monitor?.reachable?'1/1':'0/1'}</strong><span>Endpoints online</span></div><div><strong>4</strong><span>Approved PDFs</span></div></div><div className="customer-detail-grid wide"><div className="subpanel site-ops-card"><div className="site-ops-head"><div><span className="eyebrow">Product Support Portal</span><h4>rrt</h4></div><a href="https://rrt.atlaris.ca" target="_blank" rel="noreferrer">Open ↗</a></div><div className={`site-monitor-strip ${monitor?.reachable?'healthy':'critical'}`}><div><span>Status</span><strong>{status}</strong></div><div><span>HTTP</span><strong>{monitor?.http_status??'—'}</strong></div><div><span>Latency</span><strong>{monitor?.response_ms!=null?`${monitor.response_ms} ms`:'—'}</strong></div><div><span>TLS</span><strong>{tls}</strong></div></div><div className="history-summary"><span>Server history: {summary.samples} samples</span><span>Availability: {summary.availability}</span><span>Avg latency: {summary.avg}</span></div><div className="path-block"><span>Mirror</span><code>/opt/atlaris-customers/websites/rrt/</code></div><div className="path-block"><span>Backups</span><code>/opt/atlaris-customers/backups/rrt/</code></div><div className="inline-actions site-actions"><button className="secondary-button" onClick={refresh}>Refresh view</button></div>{error&&<div className="monitor-error">{error}</div>}</div></div><div className="operation-banner success">{updated?`Monitoring refreshed ${updated.toLocaleTimeString()}`:'Loading monitoring data…'}</div></div>

  return <>
    {hosts.directory&&createPortal(directoryCard,hosts.directory)}
    {hosts.pulse&&createPortal(pulseRow,hosts.pulse)}
    {hosts.monitoringSummary&&createPortal(monitoringRow,hosts.monitoringSummary)}
    {hosts.customerTable&&createPortal(customerServiceRow,hosts.customerTable)}
    {hosts.historyList&&createPortal(historyRow,hosts.historyList)}
    {selected&&hosts.customerDetail&&createPortal(inlineDetail,hosts.customerDetail)}
    <style>{`.rrt-directory-item{border-color:#31557e!important}.customer-monogram.rrt{background:linear-gradient(135deg,#163659,#0e2238);border:1px solid #31557e}.rrt-monitoring-row,.rrt-customer-service-row,.rrt-history-row,.rrt-pulse-row{order:999}.customer-detail:has(.rrt-inline-detail)>:not(.rrt-inline-detail){display:none!important}.rrt-inline-detail{display:block}.rrt-inline-detail .customer-detail-grid{margin-top:14px}.rrt-inline-detail .site-ops-card{min-height:0}@media(max-width:900px){.rrt-inline-detail .customer-metrics{grid-template-columns:1fr 1fr}}`}</style>
  </>
}
