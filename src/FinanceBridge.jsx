import { useEffect } from 'react'

export default function FinanceBridge() {
  useEffect(() => {
    let cancelled = false
    let timer
    let financeButton = null

    const sync = () => {
      if (cancelled) return

      const groups = [...document.querySelectorAll('.nav-group')]
      const admin = groups.find(
        (group) =>
          group.querySelector('.sidebar-section-label')?.textContent.trim() === 'Administration',
      )
      const host = admin?.querySelector('.nav-list')

      if (!financeButton || !financeButton.isConnected) {
        const existing = document.querySelector('.finance-nav')
        if (existing) financeButton = existing
      }

      if (host && financeButton) {
        financeButton.style.display = ''
        financeButton.removeAttribute('aria-hidden')
        financeButton.tabIndex = 0
        if (financeButton.parentElement !== host) host.appendChild(financeButton)
      }

      timer = window.setTimeout(sync, 250)
    }

    sync()

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [])

  return null
}
