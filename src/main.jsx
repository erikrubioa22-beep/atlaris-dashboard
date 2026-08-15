import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import FinanceBridge from './FinanceBridge.jsx'
import FinanceOperations from './FinanceOperations.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <FinanceBridge />
    <FinanceOperations />
  </StrictMode>,
)
