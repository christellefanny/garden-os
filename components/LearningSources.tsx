import type { LearningSource } from '@/lib/garden-learning';

export default function LearningSources({ sources }: { sources: LearningSource[] }) {
  return <footer className="learning-sources"><p>Sources and further reading · Garden Atelier editorial summary</p><ul>{sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title} ↗</a></li>)}</ul></footer>;
}
