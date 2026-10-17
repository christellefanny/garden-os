import type { ReactNode } from "react";
import Image from "next/image";

export default function InteriorHeader({ title, eyebrow, description, children, illustration }: { title: string; eyebrow: string; description: string; children?: ReactNode; illustration?: "vault" | "calendar" | "tasks" | "journal" }) {
  if (illustration) return <header className="atelier-interior-header">
    <div className="atelier-interior-copy">
      <p className="modern-eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="atelier-interior-description">{description}</p>
      {children && <div className="interior-actions">{children}</div>}
    </div>
    <div className="atelier-interior-art" aria-hidden="true"><Image src={`/interiors/${illustration}.webp`} alt="" width={900} height={600} sizes="(max-width: 600px) 100vw, 400px" loading="eager" /></div>
  </header>;
  return <header className="interior-header">
    <div className="interior-heading"><p className="modern-eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>
    {children && <div className="interior-actions">{children}</div>}
  </header>;
}

export function InteriorStats({ items }: { items: { label: string; value: string | number; detail?: string }[] }) {
  return <dl className="interior-stats">{items.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd>{item.detail && <small>{item.detail}</small>}</div>)}</dl>;
}
