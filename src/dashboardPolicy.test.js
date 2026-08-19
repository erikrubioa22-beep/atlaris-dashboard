import test from 'node:test'
import assert from 'node:assert/strict'
import {settingScope,settingGroup,settingChanges,isFreshSample} from './dashboardPolicy.js'

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
