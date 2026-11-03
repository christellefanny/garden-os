"use client";

import Image from "next/image";
import { useState } from "react";
import { getFlowerGardenArt } from "@/lib/flower-garden-art";
import { getVaultBotanicalArt } from "@/lib/vault-botanical-art";
import type { FlowerCornerProfile } from "@/lib/flower-corner-library";

/** Keep the loved watercolor plates at their original quality. Most plates have
 * four columns: a 1254px source contains only ~313px of detail per plant. */
export default function FlowerCornerPortrait({ profile }: { profile: FlowerCornerProfile }) {
  const [failed, setFailed] = useState(false);
  const name = profile.artName || profile.name;
  const flower = getFlowerGardenArt(name);
  const vault = getVaultBotanicalArt(name, profile.artVariety || "");
  const art = flower ? { ...flower, columns: 4 } : vault;
  const label = `${profile.artVariety ? `${profile.artVariety} ` : ""}${name}`;
  return <div className="corner-original-portrait" style={{ width: "100%", maxWidth: 300, marginInline: "auto" }}>
    {art && !failed ? <>
      <div role="img" aria-label={`Watercolor illustration of ${label}`}
        className="relative aspect-square overflow-hidden rounded-xl bg-white"
        style={{ clipPath: "inset(5.5% round 12px)" }}>
        <Image src={art.src} alt="" aria-hidden="true" width={1254} height={1254}
          unoptimized
          style={{ position: "absolute", width: `${art.columns * 100}%`, height: `${art.columns * 100}%`, maxWidth: "none", left: `${-art.column * 100}%`, top: `${-art.row * 100}%` }}
          onError={() => setFailed(true)} />
      </div>
      {profile.artVariety && <p className="seasonal-muted text-xs">Illustration of {profile.artVariety}; other varieties may differ.</p>}
      {profile.name === "Violas" && <p className="seasonal-muted text-xs">Related pansy illustration; not an exact species image.</p>}
    </> : <div className="seasonal-muted flex aspect-square items-center justify-center rounded-xl bg-white text-sm">{failed ? "Illustration unavailable" : "No verified illustration yet"}</div>}
  </div>;
}
