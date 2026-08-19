export const PLATFORM_SETTING_KEYS=new Set(['company_platform','automation_monitoring','automation_zero_touch','reporting_notifications','backup_policy'])

export const MONITORING_DEFAULTS={
 staleAfterMinutes:3,
 latencyWarningMs:1500,
 tlsWarningDays:21,
 publicTlsMaxDays:397,
}

export function settingScope(key){return PLATFORM_SETTING_KEYS.has(key)?'Platform':'Finance'}

export function settingGroup(key=''){
 if(key==='company_platform')return'Platform'
 if(key==='automation_monitoring')return'Monitoring'
 if(key==='automation_zero_touch')return'Zero Touch'
 if(key==='reporting_notifications')return'Notifications'
 if(key==='backup_policy')return'Backups'
 if(key==='company')return'Company & Fiscal'
 if(key==='tax')return'Tax'
 if(key==='payments')return'Payments'
 if(key==='approvals'||key.includes('approval'))return'Approvals'
 if(key.includes('invoice')||key.includes('billing'))return'Billing & Invoicing'
 if(key==='backup'||key==='backups')return'Finance Backups'
 if(key.includes('security')||key.includes('session')||key.includes('role'))return'Security'
 return'Finance Other'
}

export function settingChanges(before={},after={}){
 const keys=[...new Set([...Object.keys(before),...Object.keys(after)])]
 return keys.filter(key=>JSON.stringify(before[key])!==JSON.stringify(after[key])).map(key=>({key,before:before[key],after:after[key]}))
}

export function isFreshSample(value,staleAfterMinutes=MONITORING_DEFAULTS.staleAfterMinutes,now=Date.now()){
 if(!value)return false
 const checked=new Date(value).getTime()
 if(!Number.isFinite(checked))return false
 return now-checked<=Math.max(1,Number(staleAfterMinutes)||MONITORING_DEFAULTS.staleAfterMinutes)*60000
}

export function monitoringState(target={},policy=MONITORING_DEFAULTS,now=Date.now()){
 const checked=target.checked_at||target.last_checked_at||target.updated_at||target.sampled_at||null
 const http=Number(target.http_status)
 const latency=Number(target.response_ms)
 const tls=Number(target.tls_days_remaining??target.tls?.days_remaining)
 const reachable=Boolean(target.reachable)
 const tlsSuspicious=Number.isFinite(tls)&&tls>policy.publicTlsMaxDays
 if(!isFreshSample(checked,policy.staleAfterMinutes,now))return{tone:'stale',label:'STALE',checked,tlsSuspicious,reason:'Monitoring sample is older than the freshness threshold.'}
 if(!reachable||Number.isFinite(http)&&http>=500)return{tone:'critical',label:'CRITICAL',checked,tlsSuspicious,reason:!reachable?'Endpoint is not reachable.':`Endpoint returned HTTP ${http}.`}
 if(Number.isFinite(http)&&http>=400)return{tone:'degraded',label:'DEGRADED',checked,tlsSuspicious,reason:`Endpoint is reachable but returned HTTP ${http}.`}
 if(Number.isFinite(latency)&&latency>=policy.latencyWarningMs)return{tone:'degraded',label:'DEGRADED',checked,tlsSuspicious,reason:`Latency is ${latency} ms, above the ${policy.latencyWarningMs} ms warning threshold.`}
 if(Number.isFinite(tls)&&tls<=policy.tlsWarningDays)return{tone:'degraded',label:'DEGRADED',checked,tlsSuspicious,reason:`TLS certificate has ${tls} days remaining.`}
 if(tlsSuspicious)return{tone:'degraded',label:'VERIFY TLS',checked,tlsSuspicious,reason:`Reported TLS lifetime (${tls} days) exceeds the expected public-certificate range.`}
 return{tone:'healthy',label:'HEALTHY',checked,tlsSuspicious,reason:'Endpoint is fresh and within operational thresholds.'}
}

export function isRecoveryEvent(event={}){
 const t=String(event.event_type||'').toLowerCase()
 const m=String(event.message||'').toLowerCase()
 return t.includes('recover')||t.includes('resolve')||t.includes('restore')||m.includes('recover')||m.includes('restored')||m.includes('resolved')||m.includes('back online')
}

export function incidentKey(event={}){return `${event.slug||event.display_name||'unknown'}::${event.service_name||'main'}`}
export function eventTimestamp(event={}){return new Date(event.created_at||event.checked_at||0).getTime()||0}

export function buildIncidents(events=[]){
 const ordered=[...events].sort((a,b)=>eventTimestamp(a)-eventTimestamp(b))
 const open=new Map(),resolved=[]
 for(const event of ordered){
  const key=incidentKey(event)
  if(isRecoveryEvent(event)){
   const incident=open.get(key)
   if(incident){resolved.push({...incident,status:'resolved',resolved_at:event.created_at||null,recovery_event:event,duration_ms:Math.max(0,eventTimestamp(event)-eventTimestamp(incident.start_event))});open.delete(key)}
   continue
  }
  const current=open.get(key)
  if(!current){open.set(key,{id:`${key}::${event.id??event.created_at??eventTimestamp(event)}`,key,slug:event.slug,display_name:event.display_name,service_name:event.service_name,severity:event.severity||'warning',message:event.message,start_event:event,started_at:event.created_at||null,last_event:event,last_event_at:event.created_at||null,event_count:1,status:'active'})}
  else{current.last_event=event;current.last_event_at=event.created_at||current.last_event_at;current.event_count+=1;if(event.severity==='critical')current.severity='critical';current.message=event.message||current.message}
 }
 return{active:[...open.values()].sort((a,b)=>eventTimestamp(b.last_event)-eventTimestamp(a.last_event)),resolved:resolved.sort((a,b)=>eventTimestamp(b.recovery_event)-eventTimestamp(a.recovery_event))}
}
