import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export default function FinanceBridge() {
  const [host, setHost] = useState(null)

  useEffect(() => {
    let cancelled = false
    let timer

    const sync = () => {
      if (cancelled) return

      const groups = [...document.querySelectorAll('.nav-group')]
      const admin = groups.find(
        (group) =>
          group.querySelector('.sidebar-section-label')?.textContent.trim() === 'Administration',
      )
      const target = admin?.querySelector('.nav-list')
      if (target) setHost(target)

      const legacy = document.querySelector('.finance-nav')
      if (legacy) {
        legacy.style.display = 'none'
        legacy.setAttribute('aria-hidden', 'true')
        legacy.tabIndex = -1
      }

      timer = window.setTimeout(sync, 250)
    }

    sync()
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [])

  if (!host) return null

  return createPortal(
    <button
      type="button"
      className="nav-link finance-native-nav"
      onClick={() => {
        const legacy = document.querySelector('.finance-nav')
        if (legacy) legacy.click()
      }}
    >
      <span>▦</span>
      Finance & Administration
    </button>,
    host,
  )
}
