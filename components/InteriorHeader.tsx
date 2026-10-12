import type { ReactNode } from "react";

export default function InteriorHeader({ title, eyebrow, description, children }: { title: string; eyebrow: string; description: string; children?: ReactNode }) {
  return <header className="interior-header">
    <div className="interior-heading"><p className="modern-eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>
    {children && <div className="interior-actions">{children}</div>}
  </header>;
}

export function InteriorStats({ items }: { items: { label: string; value: string | number; detail?: string }[] }) {
  return <dl className="interior-stats">{items.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd>{item.detail && <small>{item.detail}</small>}</div>)}</dl>;
}
