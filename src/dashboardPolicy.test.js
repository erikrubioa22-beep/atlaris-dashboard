import test from 'node:test'
import assert from 'node:assert/strict'
import {settingScope,settingGroup,settingChanges,isFreshSample,monitoringState,buildIncidents} from './dashboardPolicy.js'

test('platform and finance settings are separated',()=>{
 assert.equal(settingScope('automation_monitoring'),'Platform')
 assert.equal(settingScope('payments'),'Finance')
 assert.equal(settingGroup('invoice'),'Billing & Invoicing')
 assert.equal(settingGroup('backup_policy'),'Backups')
})

test('settingChanges returns only modified values',()=>{
 assert.deepEqual(settingChanges({enabled:true,count:2},{enabled:false,count:2}),[{key:'enabled',before:true,after:false}])
})

test('freshness policy marks recent samples fresh and old samples stale',()=>{
 const now=Date.parse('2026-08-19T08:00:00Z')
 assert.equal(isFreshSample('2026-08-19T07:58:00Z',3,now),true)
 assert.equal(isFreshSample('2026-08-19T07:55:00Z',3,now),false)
 assert.equal(isFreshSample(null,3,now),false)
})

test('monitoring state uses one consistent operational vocabulary',()=>{
 const now=Date.parse('2026-08-19T08:00:00Z')
 const base={checked_at:'2026-08-19T07:59:30Z',reachable:true,http_status:200,response_ms:120,tls_days_remaining:60}
 assert.equal(monitoringState(base,undefined,now).label,'HEALTHY')
 assert.equal(monitoringState({...base,http_status:404},undefined,now).label,'DEGRADED')
 assert.equal(monitoringState({...base,reachable:false},undefined,now).label,'CRITICAL')
 assert.equal(monitoringState({...base,checked_at:'2026-08-19T07:50:00Z'},undefined,now).label,'STALE')
 assert.equal(monitoringState({...base,tls_days_remaining:818},undefined,now).label,'VERIFY TLS')
})

test('incident lifecycle pairs repeated failures with the next recovery',()=>{
 const events=[
  {id:1,slug:'client-a',service_name:'Main',event_type:'outage',severity:'critical',message:'down',created_at:'2026-08-19T08:00:00Z'},
  {id:2,slug:'client-a',service_name:'Main',event_type:'outage',severity:'critical',message:'still down',created_at:'2026-08-19T08:01:00Z'},
  {id:3,slug:'client-a',service_name:'Main',event_type:'recovery',severity:'info',message:'recovered',created_at:'2026-08-19T08:03:00Z'},
  {id:4,slug:'client-b',service_name:'Main',event_type:'warning',severity:'warning',message:'slow',created_at:'2026-08-19T08:04:00Z'},
 ]
 const incidents=buildIncidents(events)
 assert.equal(incidents.active.length,1)
 assert.equal(incidents.active[0].slug,'client-b')
 assert.equal(incidents.resolved.length,1)
 assert.equal(incidents.resolved[0].event_count,2)
 assert.equal(incidents.resolved[0].duration_ms,180000)
})
