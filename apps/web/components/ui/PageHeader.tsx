interface PageHeaderProps {
  title: string
  description?: string
  /** @deprecated use description */
  subtitle?: string
  actions?: React.ReactNode
  /** @deprecated use actions */
  children?: React.ReactNode
  breadcrumb?: { label: string; href?: string }[]
}

export function PageHeader({ title, description, subtitle, actions, children, breadcrumb }: PageHeaderProps) {
  const desc = description || subtitle
  const acts = actions || children

  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        {breadcrumb && (
          <nav className="flex items-center gap-2 mb-2">
            {breadcrumb.map((item, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span className="text-slate-300">/</span>}
                {item.href
                  ? <a href={item.href} className="text-sm text-slate-500 hover:text-slate-700">{item.label}</a>
                  : <span className="text-sm text-slate-400">{item.label}</span>
                }
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {desc && <p className="text-slate-500 text-sm mt-1">{desc}</p>}
      </div>
      {acts && <div className="flex items-center gap-3">{acts}</div>}
    </div>
  )
}
