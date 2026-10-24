"use client";

import Image from "next/image";
import { useState } from "react";
import PlantPortrait from "@/components/PlantPortrait";
import { getVaultBotanicalArt } from "@/lib/vault-botanical-art";

export default function VaultBotanicalPortrait(props: {
  name: string;
  variety: string;
  photoUrl?: string;
  onPhotoError?: () => void;
}) {
  const art = getVaultBotanicalArt(props.name, props.variety);
  const [failed, setFailed] = useState(false);
  // A saved, user-selected image always wins over collection defaults.
  if ((props.photoUrl && /^https?:\/\//i.test(props.photoUrl)) || !art || failed)
    return <PlantPortrait {...props} />;
  return (
    <>
      <div
        role="img"
        aria-label={`Botanical illustration of ${[props.variety, props.name].filter(Boolean).join(" ")}`}
        className="relative aspect-square overflow-hidden rounded-2xl bg-white"
        style={{ clipPath: "inset(5.5% round 12px)" }}
      >
        <Image
          src={art.src}
          alt=""
          aria-hidden="true"
          width={1254}
          height={1254}
          sizes="(max-width: 639px) 200vw, (max-width: 1023px) 150vw, 100vw"
          style={{
            position: "absolute",
            width: `${art.columns * 100}%`,
            height: `${art.columns * 100}%`,
            maxWidth: "none",
            left: `${-art.column * 100}%`,
            top: `${-art.row * 100}%`,
          }}
          onError={() => setFailed(true)}
        />
      </div>
      <p className="seasonal-muted mt-2 text-[11px] leading-5">{art.caption}</p>
    </>
  );
}
