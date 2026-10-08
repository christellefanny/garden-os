"use client";

import Image from "next/image";
import { useState } from "react";
import GardenIcon from "@/components/ui/GardenIcon";
import { getPlantArt } from "@/lib/plant-art";

export default function PlantPortrait({ name, variety, photoUrl }: { name: string; variety: string; photoUrl?: string }) {
  const art = getPlantArt(name, variety);
  const [failed, setFailed] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = !!photoUrl && /^https?:\/\//i.test(photoUrl) && !photoFailed;
  return <>
    <div className="relative aspect-[3/2] overflow-hidden rounded-2xl bg-[var(--primary-soft)]">
      {showPhoto ? (
        // User-provided URLs use a native image without an unrestricted optimization proxy.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={`${variety ? `${variety} ` : ""}${name}`} loading="lazy" decoding="async" className="h-full w-full object-cover" onError={() => setPhotoFailed(true)} />
      ) : art && !failed ? <div role="img" aria-label={`Representative botanical illustration of ${name.toLowerCase()}`} className="absolute left-0 top-1/2 aspect-square w-full -translate-y-1/2 overflow-hidden">
        <Image aria-hidden="true" alt="" src={art.src} width={2048} height={2048} sizes="(max-width: 639px) 360vw, (max-width: 1023px) 180vw, 1500px" style={{ position: "absolute", width: "400%", height: "400%", maxWidth: "none", left: `${-art.column * 100}%`, top: `${-art.row * 100}%` }} onError={() => setFailed(true)} />
      </div> : <div className="seasonal-muted flex h-full flex-col items-center justify-center gap-3"><GardenIcon kind="leaf" className="h-12 w-12 opacity-50" /><span className="text-xs">{failed ? "Illustration unavailable" : "No illustration yet"}</span></div>}
    </div>
    {!showPhoto && art && !failed && <p className="seasonal-muted mt-2 text-[11px] leading-5">Illustration · varieties may differ</p>}
  </>;
}
