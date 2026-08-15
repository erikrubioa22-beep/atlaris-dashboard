import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import FinanceBridge from './FinanceBridge.jsx'
import FinanceOperations from './FinanceOperations.jsx'
import AdminModules from './AdminModules.jsx'
import ReadinessModule from './ReadinessModule.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <FinanceBridge />
    <FinanceOperations />
    <AdminModules />
    <ReadinessModule />
  </StrictMode>,
)
