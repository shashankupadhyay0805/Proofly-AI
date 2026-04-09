const VARIANTS = {
  primary:
    'bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white hover:from-indigo-700 hover:to-fuchsia-700',
  dark: 'bg-slate-900 text-white hover:bg-slate-800',
  secondary:
    'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50',
  danger: 'border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100',
  ghost: 'text-slate-700 hover:bg-slate-100',
}

export function Button({
  children,
  className = '',
  variant = 'secondary',
  disabled,
  ...props
}) {
  const base =
    'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed'
  const v = VARIANTS[variant] || VARIANTS.secondary
  const shadow = variant === 'secondary' || variant === 'ghost' ? 'shadow-none' : ''

  return (
    <button
      className={[base, v, shadow, className].filter(Boolean).join(' ')}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

