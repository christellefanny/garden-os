"use client";

import Image from "next/image";
import { useState } from "react";
import { getFlowerGardenArt } from "@/lib/flower-garden-art";

export default function FlowerGardenPortrait({ name }: { name: string }) {
  const art = getFlowerGardenArt(name);
  const [failed, setFailed] = useState(false);
  if (!art || failed) return (
    <Image
      src={`/cut-flowers/${name.toLowerCase().replaceAll("'", "").replaceAll(" ", "-")}.webp`}
      alt={`Botanical watercolor illustration of ${name.toLowerCase()}`}
      width={640} height={640}
      sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 240px"
      className="aspect-square w-full rounded-xl bg-white object-contain"
    />
  );
  return (
    <div role="img" aria-label={`Botanical watercolor illustration of ${name.toLowerCase()}`}
      className="relative aspect-square overflow-hidden rounded-xl bg-white"
      style={{ clipPath: "inset(5.5% round 12px)" }}>
      <Image src={art.src} alt="" aria-hidden="true" width={1254} height={1254}
        sizes="(max-width: 639px) 200vw, (max-width: 1023px) 133vw, 960px"
        style={{ position: "absolute", width: "400%", height: "400%", maxWidth: "none", left: `${-art.column * 100}%`, top: `${-art.row * 100}%` }}
        onError={() => setFailed(true)} />
    </div>
  );
}
