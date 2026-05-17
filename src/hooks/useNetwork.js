import { useState, useEffect } from 'react'

export function useNetwork() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    // Try Capacitor Network plugin first (native), fall back to browser events
    let unsub = null

    const tryCapacitor = async () => {
      try {
        const { Network } = await import('@capacitor/network')
        const status = await Network.getStatus()
        setIsOnline(status.connected)
        const handle = await Network.addListener('networkStatusChange', s => {
          setIsOnline(s.connected)
        })
        unsub = () => handle.remove()
      } catch {
        // Web fallback
        const onOnline  = () => setIsOnline(true)
        const onOffline = () => setIsOnline(false)
        window.addEventListener('online',  onOnline)
        window.addEventListener('offline', onOffline)
        unsub = () => {
          window.removeEventListener('online',  onOnline)
          window.removeEventListener('offline', onOffline)
        }
      }
    }

    tryCapacitor()
    return () => unsub?.()
  }, [])

  return isOnline
}
