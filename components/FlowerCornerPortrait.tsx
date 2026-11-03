"use client";

import Image from "next/image";
import { useState } from "react";
import { flowerCornerArt, type FlowerCornerArt } from "@/lib/flower-corner-art";
import { getFlowerGardenArt } from "@/lib/flower-garden-art";
import { getVaultBotanicalArt } from "@/lib/vault-botanical-art";
import type { FlowerCornerProfile } from "@/lib/flower-corner-library";

/** These six existing cutouts match the exact profile artwork and have real alpha. */
export const transparentCornerPortraits: Readonly<Record<string, string>> = {
  dahlias: "/layout-inspiration/dahlia-transparent.webp",
  lisianthus: "/layout-inspiration/lisianthus-transparent.webp",
  alyssum: "/layout-inspiration/alyssum-transparent.webp",
  snapdragons: "/layout-inspiration/snapdragon-transparent.webp",
  cosmos: "/layout-inspiration/cosmos-transparent.webp",
  zinnias: "/layout-inspiration/zinnia-transparent.webp",
};

/** Prefer transparent exact-match artwork, then individual paintings, before sprites. */
export function getNativeCornerPortrait(profile: FlowerCornerProfile, failedSources: readonly string[] = []): FlowerCornerArt | null {
  const transparent = transparentCornerPortraits[profile.id];
  if (transparent && !failedSources.includes(transparent)) return {
    src: transparent, width: 512, height: 512,
    alt: `Representative botanical watercolor of ${(profile.artName || profile.name).toLowerCase()}.`,
  };
  const original = flowerCornerArt[profile.id];
  if (original && !failedSources.includes(original.src)) return original;
  const name = profile.artName || profile.name;
  const src = `/cut-flowers/${name.toLowerCase().replaceAll("'", "").replaceAll(" ", "-")}.webp`;
  if (!getFlowerGardenArt(name) || failedSources.includes(src)) return null;
  return {
    src,
    width: 640,
    height: 640,
    alt: `Representative botanical watercolor of ${name.toLowerCase()}.`,
  };
}

/** A 1254px four-column plate contains only ~313px of detail per plant.
 * Individual 512px / 640px / 1254px images can occupy the larger guide header. */
export default function FlowerCornerPortrait({ profile, variant = "card" }: { profile: FlowerCornerProfile; variant?: "card" | "guide" }) {
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const name = profile.artName || profile.name;
  const individual = getNativeCornerPortrait(profile, failedSources);
  const flower = getFlowerGardenArt(name);
  const vault = getVaultBotanicalArt(name, profile.artVariety || "");
  const art = flower ? { ...flower, columns: 4 } : vault;
  const nativeAvailable = individual !== null;
  const background = individual?.src === transparentCornerPortraits[profile.id] ? "transparent" : individual?.src.startsWith("/cut-flowers/") ? "paper" : "white";
  const spriteAvailable = art && !failedSources.includes(art.src);
  const maximumWidth = variant === "guide" ? (nativeAvailable ? 450 : 313) : 300;
  const label = `${profile.artVariety ? `${profile.artVariety} ` : ""}${name}`;
  function markFailed(src: string) { setFailedSources(current => [...current, src]); }

  return <div className={`corner-original-portrait corner-original-portrait--${variant}`} data-art-kind={nativeAvailable ? "individual" : "sprite"} data-art-background={nativeAvailable ? background : "sprite"} style={{ width: "100%", maxWidth: maximumWidth, marginInline: "auto" }}>
    {nativeAvailable ? <figure><Image src={individual.src} alt={individual.alt} width={individual.width} height={individual.height} sizes={variant === "guide" ? "(max-width:700px) min(90vw, 340px), (max-width:1000px) 40vw, 450px" : "300px"} quality={90} className="corner-portrait-image" onError={() => markFailed(individual.src)} /></figure> : spriteAvailable ? <>
      <div role="img" aria-label={`Watercolor illustration of ${label}`} className="corner-portrait-sprite" style={{ clipPath: "inset(5.5% round 12px)" }}>
        <Image src={art.src} alt="" aria-hidden="true" width={1254} height={1254} unoptimized
          style={{ position: "absolute", width: `${art.columns * 100}%`, height: `${art.columns * 100}%`, maxWidth: "none", left: `${-art.column * 100}%`, top: `${-art.row * 100}%` }}
          onError={() => markFailed(art.src)} />
      </div>
    </> : <div className="corner-portrait-unavailable seasonal-muted">{failedSources.length ? "Illustration unavailable" : "No verified illustration yet"}</div>}
    {profile.artVariety && (nativeAvailable || spriteAvailable) && <p className="seasonal-muted text-xs">Illustration of {profile.artVariety}; other varieties may differ.</p>}
  </div>;
}
