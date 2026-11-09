"use client";

import { useEffect, useId, useRef, useState } from "react";
import VegetableSoilGuidance from "@/components/VegetableSoilGuidance";
import { vegetableSoilProfiles } from "@/lib/vegetable-soil";
import { soilGuides, soilMaterials, type SoilContext } from "@/lib/growing-space-soil";
import styles from "./GrowingSpaceSoilGuide.module.css";

const options: { value: SoilContext; label: string; note: string }[] = [
  { value: "ground", label: "In the ground", note: "Roots grow in existing soil." },
  { value: "raised", label: "Open-bottom raised bed", note: "The bed is open to soil beneath it." },
  { value: "container", label: "Container or grow bag", note: "Also a raised planter with a floor or on paving." },
];

function Sources({ sources }: { sources: { title: string; url: string }[] }) {
  return <ul className={styles.sources}>{sources.map(source => <li key={source.url}>
    <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<span className={styles.srOnly}> (opens in a new tab)</span></a>
  </li>)}</ul>;
}

/** Read-only guide. Changing its context never changes a growing-space draft. */
export default function GrowingSpaceSoilGuide({ initialContext, onBack }: { initialContext: SoilContext | null; onBack: () => void }) {
  const [context, setContext] = useState(initialContext);
  const [crop, setCrop] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const id = useId();
  const recommendation = context ? soilGuides[context] : null;
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    const dialog = heading.current?.closest("dialog");
    if (dialog) dialog.scrollTop = 0;
  }, []);
  return <section className={styles.guide} aria-labelledby={`${id}-heading`} data-growing-space-soil-guide>
    <button type="button" className={styles.back} onClick={onBack}>← Back to growing-space setup</button>
    <p className={styles.eyebrow}>A good beginning</p>
    <h3 ref={heading} tabIndex={-1} id={`${id}-heading`} className={styles.heading}>Soil that suits your space.</h3>
    <p className={styles.intro}>You don’t need every material below. First choose where roots will grow, then add only what your setup needs.</p>
    <fieldset className={styles.choices}>
      <legend>Where are you growing?</legend>
      <div className={styles.options}>{options.map(option => <label className={styles.option} key={option.value} data-selected={context === option.value}>
        <input type="radio" name={`${id}-context`} value={option.value} checked={context === option.value} onChange={() => setContext(option.value)} />
        <span><strong>{option.label}</strong><span className={styles.optionNote}>{option.note}</span></span>
      </label>)}</div>
    </fieldset>
    {recommendation ? <section className={styles.recommendation} aria-labelledby={`${id}-recommendation`}>
      <h4 id={`${id}-recommendation`}>{recommendation.title}</h4>
      <p>{recommendation.intro}</p>
      <ul className={styles.checkpoints}>{recommendation.steps.map(step => <li key={step.title}><strong>{step.title}.</strong> {step.body}</li>)}</ul>
      <p className={styles.caution}><strong>Keep in mind:</strong> {recommendation.caution}</p>
      <Sources sources={recommendation.sources} />
    </section> : <p className={styles.notice}>Choose a growing setup above to see matching advice. A greenhouse or patio describes a location, so check whether roots are in the ground or in a container.</p>}
    <details className={styles.disclosure}>
      <summary>Explore soil ingredients</summary>
      <div className={styles.detailsBody}>
        <p>Optional ingredients, not a shopping list. A ready-made mix may already include what you need.</p>
        {soilMaterials.map(material => <details className={styles.material} key={material.id}>
          <summary><strong>{material.name}</strong><span>{material.role}</span></summary>
          <div className={styles.materialBody}>
            <p><strong>When it helps:</strong> {material.helps}</p>
            <p><strong>When to skip it:</strong> {material.caution}</p>
            <Sources sources={material.sources} />
          </div>
        </details>)}
      </div>
    </details>
    <details className={styles.disclosure}>
      <summary>Growing a particular plant?</summary>
      <div className={styles.detailsBody}>
        <p>Once your growing space is ready, check the crop’s drainage, moisture, and soil-testing guidance.</p>
        <label className={styles.cropLabel} htmlFor={`${id}-crop`}>Vegetable</label>
        <select id={`${id}-crop`} value={crop} onChange={event => setCrop(event.target.value)} className={styles.select}>
          <option value="">Choose a vegetable</option>
          {vegetableSoilProfiles.map(profile => <option key={profile.id} value={profile.name}>{profile.name}</option>)}
        </select>
        {crop && <VegetableSoilGuidance name={crop} category="Vegetable" spaceId={`soil-guide-${context ?? "unknown"}`} spaceType={context === "ground" ? "In-ground Bed" : context === "raised" ? "Raised Bed" : context === "container" ? "Container" : undefined} raisedBedBase={context === "raised" ? "open-soil" : undefined} mode="contextual" headingLevel={4} />}
      </div>
    </details>
    <p className={styles.footer}>General guidance, not a soil test. Local extension advice and product or planter instructions can help with your specific conditions.</p>
  </section>;
}
