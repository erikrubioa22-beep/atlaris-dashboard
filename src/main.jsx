import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './mobile.css'
import App from './App.jsx'
import FinanceBridge from './FinanceBridge.jsx'
import AdminModules from './AdminModules.jsx'
import ClientOnboardingAutomation from './ClientOnboardingAutomation.jsx'
import RRTCustomerModule from './RRTCustomerModule.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <FinanceBridge />
    <AdminModules />
    <ClientOnboardingAutomation />
    <RRTCustomerModule />
  </StrictMode>,
)
