import { checkCompanionBed, companionGuidance, companionSources, type CompanionPlant, type CompanionRule } from "@/lib/companion-planting";

function Sources({ sources }: { sources: CompanionRule["sources"] }) {
  return <span className="companion-sources">{sources.map(key => <a key={key} href={companionSources[key].url} target="_blank" rel="noreferrer">{companionSources[key].name}<span className="sr-only"> (opens in a new tab)</span></a>)}</span>;
}
function MintNote() {
  return <p className="companion-caution"><strong>Keep mint in its own pot.</strong> Its spreading roots can crowd neighboring plants. Place the pot on a hard surface to limit escape through drainage holes. <Sources sources={["mint"]} /></p>;
}
export function CompanionPlanting({ name }: { name: string }) {
  const { profile, relationships, notes, containment } = companionGuidance(name);
  return <section className="companion-guide" aria-label={`Companion planting for ${name}`}>
    <h3 className="seasonal-heading text-lg font-bold">Companion planting</h3>
    <p className="seasonal-muted text-sm">{profile ? `Guidance for ${profile.label.toLowerCase()}. Keep each variety’s full spacing and airflow.` : "We don’t have verified companion guidance for this plant yet. Match sun, water, and mature size when planning."}</p>
    {containment && <MintNote />}
    {profile && <div className="companion-columns">{(["benefit", "caution"] as const).map(kind => {
      const items = relationships.filter(r => r.kind === kind);
      return <div key={kind} className={`companion-group companion-${kind}`}><h4>{kind === "benefit" ? "Good companions" : "Keep apart / use care"}</h4>
        {items.length ? <ul>{items.map(r => <li key={r.id}><strong>{r.companion}</strong><span className="companion-basis">{r.basis}</span><p>{r.reason}</p><Sources sources={r.sources} /></li>)}</ul> : <p className="seasonal-muted text-sm">{kind === "benefit" ? "No specific pairing in our guide yet." : "No specific conflict in our guide. This does not confirm every pairing is suitable."}</p>}
      </div>;
    })}</div>}
    {notes.length > 0 && <div className="companion-group mt-4" aria-label="Companion growing notes"><h4>Growing notes</h4><ul>{notes.map(note => <li key={note.id}><strong>{note.title}</strong><p>{note.reason}</p><Sources sources={note.sources} /></li>)}</ul></div>}
    <p className="companion-footnote">Timing, spacing, and growing conditions matter. Pairings can help, but results vary. <Sources sources={["illinois"]} /></p>
  </section>;
}
export function CompanionBedCheck({ plants, candidate, excludeId, candidateStatus = "Planned" }: { plants: CompanionPlant[]; candidate?: string; excludeId?: string; candidateStatus?: string }) {
  const current = plants.filter(p => p.id !== excludeId);
  const result = checkCompanionBed(candidate?.trim() ? [...current, { id: "companion-preview", name: candidate, status: candidateStatus }] : current);
  if (!result.count) return null;
  const cautions = result.matches.filter(r => r.kind === "caution");
  const benefits = result.matches.filter(r => r.kind === "benefit");
  return <section className="companion-bed-check" aria-label="Bed companion check" aria-live="polite">
    <h4 className="font-bold">{candidate ? "Before you plant" : "Bed companion check"}</h4>
    {cautions.map(r => <div key={r.id} className="companion-caution"><strong>Use care: {r.pair}</strong><p>{r.reason}</p><Sources sources={r.sources} /></div>)}
    {result.mint && <MintNote />}
    {benefits.map(r => <div key={r.id} className="companion-benefit"><strong>Useful pairing: {r.pair}</strong><p>{r.reason}</p><Sources sources={r.sources} /></div>)}
    {!cautions.length && !result.mint && <p className="seasonal-muted text-sm">No listed conflict found in this limited guide. Check spacing, sunlight, and watering before planting.</p>}
    {result.unknown.length > 0 && <p className="seasonal-muted text-sm">Not covered yet: {result.unknown.join(", ")}.</p>}
    <p className="companion-footnote">Checks include Growing and Planned plants in this space. Finished plants are excluded. Advice never prevents saving.</p>
  </section>;
}
