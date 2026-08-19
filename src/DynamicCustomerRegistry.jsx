import {useEffect,useMemo,useState} from 'react'
import {createPortal} from 'react-dom'

const STATIC_SLUGS=new Set(['sunshine-solution','sunshine-solution-support','vancouver-realestateiq','aiport','v-regenerative','atlaris-travel-ai','rrt'])

async function getJson(path){
  const r=await fetch(path,{credentials:'same-origin',cache:'no-store'})
  const t=await r.text();let d={}
  try{d=t?JSON.parse(t):{}}catch{d={detail:t}}
  if(!r.ok)throw new Error(typeof d.detail==='string'?d.detail:`HTTP ${r.status}`)
  return d
}

function findPanelHost(title,selector){
  for(const el of document.querySelectorAll('h2,h3')){
    if(el.textContent.trim()===title){
      const panel=el.closest('.panel')
      return panel?.querySelector(selector)||null
    }
  }
  return null
}

function initials(name=''){return name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'CU'}

export default function DynamicCustomerRegistry(){
  const[customers,setCustomers]=useState([]),[hosts,setHosts]=useState({}),[selected,setSelected]=useState(null),[error,setError]=useState('')

  async function load(){
    try{
      const[registry,current]=await Promise.all([getJson('/api/ops/customers'),getJson('/api/monitor/current')])
      const targets=Object.fromEntries((current.targets||[]).map(x=>[x.slug,x]))
      const dynamic=[]
      for(const row of registry.customers||[]){
        if(STATIC_SLUGS.has(row.slug))continue
        let meta=null
        try{
          const file=await getJson(`/api/ops/customer/file-read?customer=${encodeURIComponent(row.slug)}&path=dashboard.json`)
          meta=JSON.parse(file.content)
        }catch{}
        const target=targets[row.slug]||null
        const name=meta?.customer?.name||target?.display_name||row.slug.split('-').map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(' ')
        const serviceName=meta?.service?.name||target?.service_name||'Main application'
        const domain=meta?.service?.domain||target?.domain||null
        const url=meta?.service?.url||target?.url||(domain?`https://${domain}`:null)
        dynamic.push({slug:row.slug,name,serviceName,domain,url,target,meta,source:meta?.paths?.source||row.path||`/opt/atlaris-customers/websites/${row.slug}/`,backups:meta?.paths?.backups||`/opt/atlaris-customers/backups/${row.slug}/`})
      }
      setCustomers(dynamic);setError('')
    }catch(e){setError(e.message)}
  }

  useEffect(()=>{load();const t=setInterval(load,60000);return()=>clearInterval(t)},[])

  useEffect(()=>{
    let stop=false,t
    const sync=()=>{
      if(stop)return
      setHosts({
        directory:document.querySelector('.directory-list'),
        customerDetail:document.querySelector('.customer-detail'),
        pulse:document.querySelector('.customer-pulse'),
        monitoringSummary:findPanelHost('24/7 customer summary','.service-list'),
        customerTable:document.querySelector('.customer-monitor-table'),
        historyList:document.querySelector('.history-site-list'),
      })
      const directory=document.querySelector('.directory-list')
      if(directory){
        const count=directory.closest('.customer-directory')?.querySelector('.directory-header strong')
        if(count)count.textContent=String(directory.querySelectorAll('.directory-item:not(.dynamic-directory-item)').length+customers.length)
      }
      t=setTimeout(sync,500)
    }
    sync();return()=>{stop=true;clearTimeout(t)}
  },[customers])

  useEffect(()=>{
    const h=e=>{const b=e.target.closest?.('.directory-item');if(b&&!b.classList.contains('dynamic-directory-item'))setSelected(null)}
    document.addEventListener('click',h,true);return()=>document.removeEventListener('click',h,true)
  },[])

  const rows=useMemo(()=>customers.map(c=>{const reachable=Boolean(c.target?.reachable);return{...c,reachable,http:c.target?.http_status??'—',latency:c.target?.response_ms!=null?`${c.target.response_ms} ms`:'—',tls:c.target?.tls_days_remaining!=null?`${c.target.tls_days_remaining} days`:'—'}}),[customers])

  return <>
    {hosts.directory&&rows.map(c=>createPortal(<button key={`dir-${c.slug}`} className={`directory-item dynamic-directory-item ${selected===c.slug?'selected':''}`} onClick={()=>setSelected(c.slug)}><div className="customer-monogram dynamic"><span className="customer-logo-fallback" style={{display:'grid'}}>{initials(c.name)}</span></div><div><strong>{c.name}</strong><span>ZERO TOUCH · 1 service</span></div><span className={`status-dot ${c.reachable?'':'blue'}`}/></button>,hosts.directory))}
    {hosts.pulse&&rows.map(c=>createPortal(<button key={`pulse-${c.slug}`} className="pulse-row dynamic-pulse" onClick={()=>setSelected(c.slug)}><div className="customer-monogram dynamic"><span className="customer-logo-fallback" style={{display:'grid'}}>{initials(c.name)}</span></div><div><strong>{c.name}</strong><span>{c.target?`${c.reachable?1:0}/1 endpoints online`:'Waiting for monitor state'}</span></div><span className={`customer-status ${c.reachable?'active':'onboarding'}`}>{c.reachable?'Healthy':c.target?'Review':'Provisioned'}</span></button>,hosts.pulse))}
    {hosts.monitoringSummary&&rows.map(c=>createPortal(<div key={`mon-${c.slug}`} className="service-line dynamic-monitor"><span><span className={`status-dot ${c.reachable?'':'blue'}`}/>{c.name} · {c.serviceName}</span><strong>{c.reachable?c.latency:c.target?'Review':'Provisioned'}</strong></div>,hosts.monitoringSummary))}
    {hosts.customerTable&&rows.map(c=>createPortal(<div key={`svc-${c.slug}`} className={`customer-monitor-row ${c.reachable?'healthy':'pending'} dynamic-service`}><div><strong>{c.name}</strong><small>{c.serviceName} · {c.slug}</small></div><span className={`monitor-badge ${c.reachable?'healthy':'pending'}`}>{c.reachable?'Online':c.target?'Review':'Provisioned'}</span><span>{c.http}</span><span>{c.latency}</span><span>{c.tls}</span><span>{c.target?'Live':'—'}</span></div>,hosts.customerTable))}
    {hosts.historyList&&rows.map(c=>createPortal(<div key={`hist-${c.slug}`} className="history-site dynamic-history"><div><strong>{c.name}</strong><span>{c.serviceName} · Zero Touch managed</span></div><div className="history-empty">History becomes available from the monitor service.</div></div>,hosts.historyList))}
    {selected&&hosts.customerDetail&&(()=>{const c=rows.find(x=>x.slug===selected);if(!c)return null;return createPortal(<div className="dynamic-inline-detail"><div className="customer-detail-head"><div className="customer-identity"><div className="customer-monogram large dynamic"><span className="customer-logo-fallback" style={{display:'grid'}}>{initials(c.name)}</span></div><div><span className="eyebrow">ZERO TOUCH CUSTOMER</span><h3>{c.name}</h3><p>{c.meta?.customer?.industry||'Managed customer provisioned through the Atlaris Zero Touch workflow.'}</p></div></div><span className={`customer-status ${c.reachable?'active':'onboarding'}`}>{c.reachable?'Active':'Provisioned'}</span></div><div className="customer-metrics"><div><strong>1</strong><span>Environment</span></div><div><strong>1</strong><span>Service</span></div><div><strong>{c.reachable?'1/1':'0/1'}</strong><span>Endpoints online</span></div><div><strong>Zero Touch</strong><span>Provisioning</span></div></div><div className="customer-detail-grid wide"><div className="subpanel site-ops-card"><div className="site-ops-head"><div><span className="eyebrow">{c.serviceName}</span><h4>{c.slug}</h4></div>{c.url&&<a href={c.url} target="_blank" rel="noreferrer">Open ↗</a>}</div><div className={`site-monitor-strip ${c.reachable?'healthy':'pending'}`}><div><span>Status</span><strong>{c.reachable?'Online':c.target?'Review':'Provisioned'}</strong></div><div><span>HTTP</span><strong>{c.http}</strong></div><div><span>Latency</span><strong>{c.latency}</strong></div><div><span>TLS</span><strong>{c.tls}</strong></div></div><div className="path-block"><span>Mirror</span><code>{c.source}</code></div><div className="path-block"><span>Backups</span><code>{c.backups}</code></div><div className="operation-banner success">Customer discovered automatically from Zero Touch registry metadata.</div>{error&&<div className="monitor-error">{error}</div>}</div></div></div>,hosts.customerDetail)})()}
    <style>{`.customer-monogram.dynamic{color:#9fc0ff;background:#11243c;border-color:#31527d}.dynamic-monitor,.dynamic-service,.dynamic-history,.dynamic-pulse{order:998}.customer-detail:has(.dynamic-inline-detail)>:not(.dynamic-inline-detail){display:none!important}.dynamic-inline-detail{display:block}.site-monitor-strip.pending{border-color:#2a3b54}.site-monitor-strip.pending strong{color:#9aaac0}`}</style>
  </>
}
