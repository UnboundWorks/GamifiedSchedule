import { useEffect } from 'react'
import { useSettings } from './data'

/** Apply the light/dark/system theme preference to <html>. */
export function useApplyTheme(): void {
  const settings = useSettings()
  const theme = settings?.theme ?? 'system'
  useEffect(() => {
    const root = document.documentElement
    const apply = () => {
      const dark =
        theme === 'dark' ||
        (theme === 'system' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches)
      root.classList.toggle('dark', dark)
    }
    apply()
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }
  }, [theme])
}
