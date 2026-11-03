import Link from 'next/link';
import { notFound } from 'next/navigation';
import BeginnerGuidePage from '@/components/BeginnerGuidePage';
import SeasonProvider from '@/components/seasonal/SeasonProvider';
import { beginnerGuides } from '@/lib/garden-learning';
import { getSeason } from '@/lib/seasons';

type Props = { params: Promise<{ guideId: string }> };

export async function generateMetadata({ params }: Props) {
  const { guideId } = await params;
  const guide = beginnerGuides.find(item => item.id === guideId);
  if (!guide) return { title: 'Guide not found · Garden Atelier' };
  return { title: `${guide.title} · Beginner’s Guide`, description: guide.intro };
}

export default async function BeginnerGuideRoute({ params }: Props) {
  const { guideId } = await params;
  const guide = beginnerGuides.find(item => item.id === guideId);
  if (!guide) notFound();
  return <SeasonProvider initialSeason={getSeason(new Date())}>
    <main className="seasonal-page min-h-screen">
      <header className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-6 sm:px-8"><Link className="seasonal-heading text-xl" href="/">Garden Atelier</Link><span className="seasonal-muted text-sm">Start small. Learn as you grow.</span></header>
      <BeginnerGuidePage guide={guide} />
    </main>
  </SeasonProvider>;
}
