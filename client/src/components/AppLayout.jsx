import { NavLink, Outlet } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle.jsx'

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'rounded-xl px-3 py-2 text-sm font-semibold transition',
          isActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100',
        ].join(' ')
      }
    >
      {children}
    </NavLink>
  )
}

export function AppLayout() {
  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/70 backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white font-semibold shadow-sm">
              Σ
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Proofly AI
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Master math through step-by-step reasoning and intelligent guidance
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <nav className="flex items-center gap-2">
              <NavItem to="/">Home</NavItem>
              <NavItem to="/tutor">Tutor</NavItem>
              <NavItem to="/quiz">Quiz</NavItem>
              <NavItem to="/dashboard">Dashboard</NavItem>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white dark:border-slate-800/70 dark:bg-slate-950/60">
        <div className="mx-auto max-w-5xl px-4 py-6 text-xs text-slate-500 dark:text-slate-400">
          This app is designed to teach reasoning: it validates steps and gives progressive hints.
        </div>
      </footer>
    </div>
  )
}

