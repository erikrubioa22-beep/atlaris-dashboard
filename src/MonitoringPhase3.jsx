import {useEffect,useMemo,useState} from 'react'
import {createPortal} from 'react-dom'

const STALE_MS=3*60*1000

async function api(path){
  const r=await fetch(path,{credentials:'same-origin',cache:'no-store'})
  const text=await r.text();let data={}
  try{data=text?JSON.parse(text):{}}catch{data={detail:text}}
  if(!r.ok)throw new Error(typeof data.detail==='string'?data.detail:`HTTP ${r.status}`)
  return data
}

function ageLabel(value){
  if(!value)return 'No sample time'
  const ms=Date.now()-new Date(value).getTime()
  if(!Number.isFinite(ms))return 'Unknown age'
  if(ms<60000)return `${Math.max(1,Math.round(ms/1000))}s ago`
  if(ms<3600000)return `${Math.round(ms/60000)}m ago`
  return `${Math.round(ms/3600000)}h ago`
}

function eventState(event){
  const t=String(event.event_type||'').toLowerCase()
  const m=String(event.message||'').toLowerCase()
  if(t.includes('recover')||t.includes('resolve')||m.includes('recover')||m.includes('restored')||m.includes('resolved'))return 'resolved'
  return 'active'
}

export default function MonitoringPhase3(){
  const[open,setOpen]=useState(false),[targets,setTargets]=useState([]),[events,setEvents]=useState([]),[loading,setLoading]=useState(false),[error,setError]=useState(''),[acked,setAcked]=useState(()=>{try{return JSON.parse(localStorage.getItem('atlaris-monitor-ack')||'{}')}catch{return {}}})

  async function load(){
    setLoading(true)
    try{
      const[current,eventData]=await Promise.all([api('/api/monitor/current'),api('/api/monitor/events?limit=200')])
      setTargets(current.targets||[]);setEvents(eventData.events||[]);setError('')
    }catch(e){setError(e.message)}finally{setLoading(false)}
  }

  useEffect(()=>{
    const click=e=>{
      const b=e.target.closest?.('button.nav-link')
      if(!b)return
      const label=b.textContent.trim()
      if(label.includes('Monitoring')){setOpen(true);setTimeout(load,0)}
      else setOpen(false)
    }
    document.addEventListener('click',click)
    return()=>document.removeEventListener('click',click)
  },[])

  useEffect(()=>{
    if(!open)return
    const t=setInterval(load,60000)
    return()=>clearInterval(t)
  },[open])

  function acknowledge(id){
    const next={...acked,[id]:new Date().toISOString()}
    setAcked(next);localStorage.setItem('atlaris-monitor-ack',JSON.stringify(next))
  }

  const rows=useMemo(()=>targets.map(t=>{
    const checked=t.checked_at||t.last_checked_at||t.updated_at||t.sampled_at||null
    const stale=checked?Date.now()-new Date(checked).getTime()>STALE_MS:true
    const reachable=Boolean(t.reachable)
    const tone=stale?'stale':reachable?'healthy':'critical'
    return{...t,checked,stale,tone}
  }),[targets])

  const alertRows=useMemo(()=>events.map(e=>({
    ...e,
    lifecycle:eventState(e),
    acknowledged:Boolean(acked[e.id]),
  })),[events,acked])

  const counts=useMemo(()=>({
    healthy:rows.filter(r=>r.tone==='healthy').length,
    stale:rows.filter(r=>r.tone==='stale').length,
    critical:rows.filter(r=>r.tone==='critical').length,
    active:alertRows.filter(a=>a.lifecycle==='active').length,
    ack:alertRows.filter(a=>a.lifecycle==='active'&&a.acknowledged).length,
    resolved:alertRows.filter(a=>a.lifecycle==='resolved').length,
  }),[rows,alertRows])

  if(!open)return null
  return createPortal(<div className="m3-shell">
    <header><div><small>ATLARIS MONITORING · PHASE 3</small><h2>Monitoring & Alert Lifecycle</h2><p>Freshness-aware endpoint health with active, acknowledged and resolved event states.</p></div><div className="m3-actions"><button onClick={load}>{loading?'Refreshing…':'Refresh'}</button><button onClick={()=>setOpen(false)}>Close</button></div></header>
    {error&&<div className="m3-error">{error}</div>}
    <section className="m3-stats"><article><span>Healthy</span><strong>{counts.healthy}</strong></article><article><span>Stale</span><strong>{counts.stale}</strong></article><article><span>Critical</span><strong>{counts.critical}</strong></article><article><span>Active events</span><strong>{counts.active}</strong></article><article><span>Acknowledged</span><strong>{counts.ack}</strong></article><article><span>Resolved</span><strong>{counts.resolved}</strong></article></section>
    <section className="m3-panel"><div className="m3-head"><div><small>ENDPOINT FRESHNESS</small><h3>Current customer services</h3></div><span>Stale threshold · 3 minutes</span></div><div className="m3-table"><div className="m3-row head"><span>Customer / service</span><span>State</span><span>HTTP</span><span>Latency</span><span>TLS</span><span>Last sample</span></div>{rows.map(r=><div className={`m3-row ${r.tone}`} key={r.slug}><div><strong>{r.display_name||r.slug}</strong><small>{r.service_name||'Main application'} · {r.slug}</small></div><span><b className={`m3-badge ${r.tone}`}>{r.stale?'STALE':r.reachable?'ONLINE':'UNAVAILABLE'}</b></span><span>{r.http_status??'—'}</span><span>{r.response_ms!=null?`${r.response_ms} ms`:'—'}</span><span>{r.tls_days_remaining!=null?`${r.tls_days_remaining} days`:'—'}</span><span title={r.checked||''}>{ageLabel(r.checked)}</span></div>)}</div></section>
    <section className="m3-panel"><div className="m3-head"><div><small>ALERT LIFECYCLE</small><h3>Monitoring events</h3></div><span>{alertRows.length} events loaded</span></div><div className="m3-events">{alertRows.length?alertRows.map(a=><article className={`m3-event ${a.severity||'info'} ${a.lifecycle}`} key={a.id}><div><div className="m3-event-top"><b>{a.display_name||a.slug}</b><span>{a.service_name||a.slug}</span></div><p>{a.message}</p><time>{a.created_at?new Date(a.created_at).toLocaleString():'—'}</time></div><div className="m3-life"><span className={`m3-state ${a.lifecycle}`}>{a.lifecycle==='resolved'?'Resolved':a.acknowledged?'Acknowledged':'Active'}</span>{a.lifecycle==='active'&&!a.acknowledged&&<button onClick={()=>acknowledge(a.id)}>Acknowledge</button>}{a.acknowledged&&<small>Ack {new Date(acked[a.id]).toLocaleString()}</small>}</div></article>):<div className="m3-empty">No monitoring events recorded.</div>}</div></section>
    <p className="m3-note">Acknowledgements are retained in this administrator browser. Resolved state is derived from recovery/resolution events reported by the monitor service.</p>
    <style>{`.m3-shell{position:fixed;z-index:1150;inset:0 0 0 264px;overflow:auto;padding:32px 40px 70px;background:radial-gradient(circle at 85% 0,#214c8a33,transparent 30%),#07101a;color:#edf4ff}.m3-shell>header{max-width:1220px;margin:auto;display:flex;justify-content:space-between;gap:20px}.m3-shell h2{font-size:34px;margin:6px 0}.m3-shell header p{color:#8298b1;max-width:760px}.m3-shell small,.m3-head small{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#7892b4}.m3-actions{display:flex;gap:8px}.m3-shell button{border:1px solid #2a445f;background:#0c1928;color:#dae5f2;border-radius:9px;padding:10px 13px;cursor:pointer}.m3-stats{max-width:1220px;margin:22px auto;display:grid;grid-template-columns:repeat(6,1fr);gap:10px}.m3-stats article{border:1px solid #20364d;background:#0b1725;border-radius:12px;padding:15px}.m3-stats span{display:block;color:#7f94ad;font-size:10px;text-transform:uppercase}.m3-stats strong{display:block;font-size:25px;margin-top:6px}.m3-panel{max-width:1220px;margin:16px auto;border:1px solid #20364d;background:#0b1725;border-radius:14px;padding:20px}.m3-head{display:flex;justify-content:space-between;gap:20px;align-items:end;margin-bottom:14px}.m3-head h3{margin:4px 0}.m3-head>span{font-size:10px;color:#7892a8}.m3-table{overflow:auto}.m3-row{display:grid;grid-template-columns:2fr .8fr .55fr .7fr .7fr .9fr;gap:10px;align-items:center;min-width:850px;border-top:1px solid #182b3e;padding:12px}.m3-row.head{border-top:0;color:#7188a2;font-size:9px;text-transform:uppercase}.m3-row strong,.m3-row small{display:block}.m3-row small{margin-top:3px;color:#7188a2}.m3-row.stale{background:#2a221126}.m3-row.critical{background:#32151a2b}.m3-badge{display:inline-block;padding:5px 7px;border-radius:999px;font-size:9px}.m3-badge.healthy{background:#102a23;color:#7bd3b4}.m3-badge.stale{background:#322713;color:#e7c273}.m3-badge.critical{background:#32161d;color:#ef97a4}.m3-events{display:grid;gap:9px}.m3-event{display:flex;justify-content:space-between;gap:20px;padding:14px;border:1px solid #20364d;background:#081420;border-radius:11px}.m3-event-top{display:flex;gap:10px;align-items:center}.m3-event-top span{color:#7489a2;font-size:10px}.m3-event p{margin:7px 0;color:#a7b8cb}.m3-event time{font-size:9px;color:#687f98}.m3-life{min-width:150px;display:grid;justify-items:end;align-content:center;gap:7px}.m3-state{padding:5px 8px;border-radius:999px;font-size:9px;text-transform:uppercase}.m3-state.active{background:#32161d;color:#ef97a4}.m3-state.resolved{background:#102a23;color:#7bd3b4}.m3-life small{font-size:8px;color:#71869e}.m3-note{max-width:1220px;margin:12px auto;color:#6d8299;font-size:10px}.m3-error,.m3-empty{max-width:1220px;margin:18px auto;padding:13px;border-radius:10px;background:#2b151c;border:1px solid #65303b;color:#ee9ba8}@media(max-width:900px){.m3-shell{inset:0;padding:20px}.m3-shell>header,.m3-head,.m3-event{flex-direction:column;align-items:stretch}.m3-stats{grid-template-columns:repeat(2,1fr)}.m3-life{justify-items:start}}`}</style>
  </div>,document.body)
}
