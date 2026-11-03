import Link from 'next/link';
import { notFound } from 'next/navigation';
import FlowerCornerGuide from '@/components/FlowerCornerGuide';
import SeasonProvider from '@/components/seasonal/SeasonProvider';
import { flowerCornerProfiles } from '@/lib/flower-corner-library';
import { safeFlowerCornerReturn } from '@/lib/flower-corner-navigation';
import { getSeason } from '@/lib/seasons';

type Props = {
  params: Promise<{ plantId: string }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
};

export async function generateMetadata({ params }: Pick<Props, 'params'>) {
  const { plantId } = await params;
  const profile = flowerCornerProfiles.find(plant => plant.id === plantId);
  if (!profile) return { title: 'Plant not found · Flower Corner' };
  return { title: `${profile.name} growing guide · Flower Corner`, description: profile.summary };
}

export default async function FlowerCornerGuidePage({ params, searchParams }: Props) {
  const { plantId } = await params;
  const profile = flowerCornerProfiles.find(plant => plant.id === plantId);
  if (!profile) notFound();
  const { returnTo } = await searchParams;
  return <SeasonProvider initialSeason={getSeason(new Date())}>
    <main className="seasonal-page corner-public-page">
      <header className="corner-public-header"><Link href="/">Garden Atelier</Link><span>Planting · Care · Inspiration</span></header>
      <FlowerCornerGuide profile={profile} returnTo={safeFlowerCornerReturn(returnTo)} />
    </main>
  </SeasonProvider>;
}
