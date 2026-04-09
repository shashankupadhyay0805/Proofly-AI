import { useEffect, useState } from 'react'
import { applyTheme, getTheme, toggleTheme } from '../lib/theme.js'
import { Button } from './ui/Button.jsx'

export function ThemeToggle() {
  const [theme, setTheme] = useState(getTheme())

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  return (
    <Button
      variant="secondary"
      className="px-3 py-2"
      onClick={() => setTheme(toggleTheme())}
      title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {theme === 'dark' ? 'Light' : 'Dark'}
    </Button>
  )
}

