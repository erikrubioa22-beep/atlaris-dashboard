import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import FinanceBridge from './FinanceBridge.jsx'
import FinanceOperations from './FinanceOperations.jsx'
import AdminModules from './AdminModules.jsx'
import ReadinessModule from './ReadinessModule.jsx'
import FinanceExportLinks from './FinanceExportLinks.jsx'
import ClientOnboardingAutomation from './ClientOnboardingAutomation.jsx'
import RRTCustomerModule from './RRTCustomerModule.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <FinanceBridge />
    <FinanceOperations />
    <AdminModules />
    <ReadinessModule />
    <FinanceExportLinks />
    <ClientOnboardingAutomation />
    <RRTCustomerModule />
  </StrictMode>,
)
