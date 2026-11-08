"use client";

import { useId, useState } from "react";
import {
  getVegetableSoilProfile,
  soilGrowingContext,
  type VegetableSoilProfile,
} from "@/lib/vegetable-soil";
import styles from "./VegetableSoilGuidance.module.css";

type GrowingMethod = "bed" | "container";
type Props = {
  name: string;
  category?: string;
  spaceId?: string;
  spaceType?: string;
  mode?: "full" | "contextual";
  headingLevel?: 3 | 4 | 5;
};

function SoilIcon({ kind }: { kind: GrowingMethod | "moisture" }) {
  return <span className={styles.icon} aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" focusable="false">
      {kind === "bed" ? <><path d="M3 12h18v9H3zM3 16h18M7 12V7m0 1L4 5m3 3 3-4M16 12V7m0 1-3-3m3 3 3-4" /></>
        : kind === "container" ? <><path d="M4 10h16v3H4zM6 13l2 8h8l2-8M12 10V4m0 3L8 3m4 4 4-4" /></>
          : <><path d="M12 2C10 6 5 11 5 15a7 7 0 0 0 14 0c0-4-5-9-7-13Z" /><path d="M8 15a4 4 0 0 0 4 4" /></>}
    </svg>
  </span>;
}

function GuidanceRow({ kind, text }: { kind: GrowingMethod | "moisture"; text: string }) {
  return <div className={styles.row}>
    <dt><SoilIcon kind={kind} />{kind === "bed" ? "In a garden bed" : kind === "container" ? "In a container" : "Moisture"}</dt>
    <dd>{text}</dd>
  </div>;
}

function SoilGuidanceCard({ name, spaceType, mode = "full", headingLevel = 3, profile }: Props & { profile?: VegetableSoilProfile }) {
  const id = useId();
  const context = soilGrowingContext(spaceType);
  const [method, setMethod] = useState<GrowingMethod | null>(context === "bed" || context === "container" ? context : null);
  const hydroponic = context === "hydroponic";
  const Heading = headingLevel === 5 ? "h5" : headingLevel === 4 ? "h4" : "h3";

  return <section className={styles.card} aria-labelledby={`${id}-heading`} data-soil-guidance={profile?.id ?? "unavailable"} data-mode={mode}>
    <Heading id={`${id}-heading`} className={styles.heading}>Soil &amp; drainage<span className={styles.srOnly}> for {name}</span></Heading>
    {hydroponic ? <p className={styles.notice}>
      This guide is for soil-grown vegetables. Its soil pH, potting mix, and watering advice do not apply to a hydroponic nutrient solution. Use guidance for your crop and hydroponic system instead.
    </p> : !profile ? <p className={styles.notice}>
      We don’t have verified soil guidance for {name} yet. Check the seed packet or plant label and your local extension service for this crop’s soil and watering needs. You can still save your plant.
    </p> : <>
      <p className={styles.intro}>A good beginning for {profile.name.toLowerCase()}. Adapt to your variety, weather, and growing conditions.</p>
      <p className={styles.planterNote}>A raised planter with a closed bottom uses container guidance. Keep its drainage or designed overflow working.</p>
      {mode === "contextual" && <>
        <div className={styles.methods} role="group" aria-label="Soil guidance growing method">
          <button type="button" aria-pressed={method === "bed"} aria-controls={`${id}-guidance`} onClick={() => setMethod("bed")}>Garden bed</button>
          <button type="button" aria-pressed={method === "container"} aria-controls={`${id}-guidance`} onClick={() => setMethod("container")}>Container</button>
        </div>
        {!method && <p className={styles.contextNote}>Choose a growing method to see matching advice. The space type alone does not tell us which soil you use.</p>}
      </>}
      <dl id={`${id}-guidance`} className={styles.rows}>
        {(mode === "full" || method === "bed") && <GuidanceRow kind="bed" text={profile.bed} />}
        {(mode === "full" || method === "container") && <GuidanceRow kind="container" text={profile.container} />}
        {(mode === "full" || method) && <GuidanceRow kind="moisture" text={profile.moisture} />}
      </dl>
      <details className={styles.learnMore}>
        <summary>Learn more: pH &amp; soil testing<span className={styles.disclosureMark} aria-hidden="true" /></summary>
        <div className={styles.moreBody}>
          <p>Soil pH describes how acidic or alkaline soil is. It is separate from soil texture and drainage.</p>
          {profile.ph ? <>
            <p className={styles.ph}><strong>Preferred soil pH: {profile.ph.min.toFixed(1)}–{profile.ph.max.toFixed(1)}</strong></p>
            {profile.ph.note && <p>{profile.ph.note}</p>}
            <p>This preferred range is guidance, not a measurement of your soil.</p>
          </> : <p>We haven’t listed a verified soil pH range for this crop. Ask your local soil-testing service for crop-specific advice.</p>}
          <p>Test before adding lime, sulfur, or other soil amendments. Follow the soil-testing laboratory’s recommendations rather than adjusting pH by guesswork. Garden-soil recommendations may not suit a container’s potting mix.</p>
          <p>For a self-watering planter, follow its reservoir and overflow instructions. A designed water reservoir is different from water collecting in an ordinary pot’s saucer.</p>
          {profile.notes.length > 0 && <ul>{profile.notes.map(note => <li key={note}>{note}</li>)}</ul>}
        </div>
      </details>
    </>}
    {profile && <div className={styles.sources}>
      <p>{hydroponic ? "Further reading for soil growing" : "Sources & further reading"}</p>
      <ul>{profile.sources.map(source => <li key={source.url}>
        <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<span className={styles.srOnly}> (opens in a new tab)</span></a>
      </li>)}</ul>
    </div>}
  </section>;
}

/** Read-only advice. A fresh crop or growing space resets optional details and method selection. */
export default function VegetableSoilGuidance(props: Props) {
  const name = props.name.trim();
  if (!name) return null;
  const category = props.category?.trim().toLowerCase();
  if (category && !["vegetable", "other"].includes(category)) return null;
  const profile = getVegetableSoilProfile(name, props.category);
  if (!profile && category !== "vegetable") return null;
  return <SoilGuidanceCard key={`${name}:${category ?? ""}:${props.spaceId ?? ""}:${props.spaceType ?? ""}:${props.mode ?? "full"}`} {...props} name={name} profile={profile} />;
}
