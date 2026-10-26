"use client";
import { useState } from "react";
import PlantPortrait from "@/components/PlantPortrait";
import type { SpaceDetails } from "@/lib/garden";
import type { VaultPlant } from "@/components/PlantVault";
import { spacePortraitCandidates, validPhotoUrl } from "@/lib/space-portrait";
export default function SpacePortrait({
  name,
  details,
  vault,
}: {
  name: string;
  details: SpaceDetails | null;
  vault: VaultPlant[];
}) {
  const [failed, setFailed] = useState<string[]>([]);
  const ownPhoto = details?.photoUrl;
  if (validPhotoUrl(ownPhoto) && !failed.includes(ownPhoto))
    return (
      <div className="space-visual">
        {/* User photos use a native image, avoiding an unrestricted server-side image proxy. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ownPhoto}
          alt={`${name} growing space`}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          onError={() => setFailed((current) => [...current, ownPhoto])}
        />
      </div>
    );
  const portrait = details
    ? spacePortraitCandidates(details, vault).find(
        (p) => (p.photoUrl && !failed.includes(p.photoUrl)) || p.art,
      )
    : undefined;
  const photo =
    portrait?.photoUrl && !failed.includes(portrait.photoUrl)
      ? portrait.photoUrl
      : undefined;
  return (
    <div className="space-visual">
      {portrait ? (
        <PlantPortrait
          key={`${portrait.id}-${portrait.name}-${portrait.variety}-${photo}`}
          name={portrait.name}
          variety={portrait.variety}
          photoUrl={photo}
          onPhotoError={() => {
            if (photo) setFailed((current) => [...current, photo]);
          }}
        />
      ) : (
        <div
          className="bed-blueprint"
          aria-label={`${name}: no saved photo`}
          role="img"
        >
          <span />
          <span />
          <span />
        </div>
      )}
    </div>
  );
}
