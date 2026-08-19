export const PLATFORM_SETTING_KEYS=new Set(['company_platform','automation_monitoring','automation_zero_touch','reporting_notifications','backup_policy'])

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

export function isFreshSample(value,staleAfterMinutes=3,now=Date.now()){
 if(!value)return false
 const checked=new Date(value).getTime()
 if(!Number.isFinite(checked))return false
 return now-checked<=Math.max(1,Number(staleAfterMinutes)||3)*60000
}
