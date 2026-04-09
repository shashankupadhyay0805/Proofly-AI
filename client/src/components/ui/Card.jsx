export function Card({ children, className = '' }) {
  return (
    <section
      className={[
        'rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-6',
        'dark:border-slate-800/70 dark:bg-slate-950/50',
        className,
      ].join(' ')}
    >
      {children}
    </section>
  )
}

export function CardHeader({ title, subtitle, right }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        {title ? (
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </div>
        ) : null}
        {subtitle ? (
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {subtitle}
          </div>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  )
}

