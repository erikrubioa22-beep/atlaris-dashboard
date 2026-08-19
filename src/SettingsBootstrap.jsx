import {useEffect} from 'react'

const API='/api/finance'

const DEFAULTS=[
  {
    setting_key:'company_platform',
    description:'Core Atlaris platform identity and administrative defaults.',
    setting_value:{
      company_name:'Atlaris Technologies',
      timezone:'America/Vancouver',
      default_language:'en-CA',
      currency:'CAD',
      session_timeout_minutes:720,
    },
  },
  {
    setting_key:'automation_monitoring',
    description:'Operational monitoring thresholds and refresh policy.',
    setting_value:{
      warning_latency_ms:1500,
      critical_latency_ms:3000,
      tls_warning_days:21,
      stale_after_minutes:3,
      dashboard_refresh_seconds:60,
    },
  },
  {
    setting_key:'automation_zero_touch',
    description:'Default policies applied to new Zero Touch customer onboarding.',
    setting_value:{
      default_tier:'Managed',
      default_service_name:'Main application',
      auto_register_monitoring:true,
      create_initial_backup:true,
      require_domain_for_monitoring:true,
    },
  },
  {
    setting_key:'reporting_notifications',
    description:'Notification and escalation defaults for operational events.',
    setting_value:{
      email_enabled:false,
      sms_enabled:false,
      notify_on_critical:true,
      notify_on_warning:false,
      recovery_notifications:true,
      escalation_minutes:15,
    },
  },
  {
    setting_key:'backup_policy',
    description:'Backup retention and restore-safety defaults for managed operations.',
    setting_value:{
      automatic_backup_before_change:true,
      retention_days:90,
      minimum_releases_to_keep:5,
      safety_backup_before_restore:true,
      verify_after_restore:true,
    },
  },
]

async function request(path,options={}){
  const r=await fetch(API+path,{credentials:'same-origin',cache:'no-store',...options,headers:{...(options.body?{'Content-Type':'application/json'}:{}),...(options.headers||{})}})
  const text=await r.text();let data={}
  try{data=text?JSON.parse(text):{}}catch{data={detail:text}}
  if(!r.ok)throw new Error(typeof data.detail==='string'?data.detail:`HTTP ${r.status}`)
  return data
}

export default function SettingsBootstrap(){
  useEffect(()=>{
    let cancelled=false
    async function ensureDefaults(){
      try{
        const rows=await request('/settings')
        if(cancelled)return
        const existing=new Set((rows||[]).map(x=>x.setting_key))
        const missing=DEFAULTS.filter(x=>!existing.has(x.setting_key))
        for(const item of missing){
          if(cancelled)return
          await request(`/settings/${encodeURIComponent(item.setting_key)}`,{
            method:'POST',
            body:JSON.stringify({value:item.setting_value}),
          })
        }
      }catch{
        // Settings remain available even when bootstrap cannot run; the
        // Administration module will surface API errors to the operator.
      }
    }
    ensureDefaults()
    return()=>{cancelled=true}
  },[])
  return null
}
