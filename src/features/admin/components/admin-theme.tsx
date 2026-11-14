'use client'

import { createContext, useContext, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Theme = 'light' | 'dark'
const ThemeContext = createContext<{ theme: Theme; toggle: () => void } | null>(null)

export function AdminTheme({ initial, children }: { initial: Theme; children: React.ReactNode }) {
  const [theme, setTheme] = useState(initial)

  function toggle() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    const secure = location.protocol === 'https:' ? '; Secure' : ''
    document.cookie = `common-stride-admin-theme=${next}; Path=/admin; Max-Age=31536000; SameSite=Lax${secure}`
  }

  return <ThemeContext.Provider value={{ theme, toggle }}>
    <div data-admin-theme={theme} className="min-h-dvh bg-background text-foreground">{children}</div>
  </ThemeContext.Provider>
}

export function AdminThemeToggle() {
  const preferences = useContext(ThemeContext)
  if (!preferences) return null
  const dark = preferences.theme === 'dark'
  return <Button type="button" variant="outline" size="sm" onClick={preferences.toggle}>
    {dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />} {dark ? 'Light mode' : 'Dark mode'}
  </Button>
}
