'use client';

import Link from 'next/link';
import { useState } from 'react';
import LearningSources from '@/components/LearningSources';
import { useLearningProgress } from '@/components/useLearningProgress';
import { beginnerGuides, type GardenGuide } from '@/lib/garden-learning';

function GuideChecklist({ guide, userId }: { guide: GardenGuide; userId: string }) {
  const { checks, error, setCheck, disabled } = useLearningProgress(userId);
  return <>
    <p className="seasonal-muted text-sm">Your checklist progress is saved in this browser for this {userId === 'guest' ? 'guest garden' : 'account'}. It is shared between your tabs, but not synced to other devices.</p>
    {error && <p role="alert" className="learning-save-error">{error}</p>}
    {guide.checklist.map((item, index) => {
      const key = `${guide.id}:${index}`;
      return <label className="learning-check" key={key}><input type="checkbox" checked={Boolean(checks[key])} disabled={disabled} onChange={event => setCheck(key, event.target.checked)} />{item}</label>;
    })}
  </>;
}

type Props = {
  guide: GardenGuide;
  userId: string | null;
  mode: 'page' | 'dialog';
  identityMessage?: string;
  onPlan?: () => void;
  onExplorePlants?: () => void;
  onNext?: (guideId: string) => void;
  onWorkspaceNavigate?: () => void;
};

/** One lesson body and one progress store for standalone tabs and the starting-path popup. */
export default function BeginnerGuideArticle({ guide, userId, mode, identityMessage, onPlan, onExplorePlants, onNext, onWorkspaceNavigate }: Props) {
  const [showPlantOptions, setShowPlantOptions] = useState(false);
  const index = beginnerGuides.findIndex(item => item.id === guide.id);
  const next = beginnerGuides[(index + 1) % beginnerGuides.length];
  const finalGuide = index === beginnerGuides.length - 1;
  const nextLabel = finalGuide ? 'Return to the first guide' : 'Next guide →';
  const page = mode === 'page';
  const SectionHeading = page ? 'h2' : 'h3';
  const linkStyle = 'inline-flex min-h-11 items-center rounded-xl border px-4 py-3';
  return <article className={`learning-article ${page ? 'mx-auto w-full' : 'learning-modal-article'}`} aria-labelledby={page ? 'beginner-guide-title' : 'learning-guide-heading'}>
    <p className="modern-eyebrow">Your beginner’s guide</p>
    {page && <h1 id="beginner-guide-title" className="seasonal-heading my-4 text-3xl leading-tight sm:text-4xl">{guide.title}</h1>}
    <p id="learning-guide-heading" tabIndex={-1} className="learning-guide-step">Step {index + 1} of {beginnerGuides.length}</p>
    <p>{guide.intro}</p>
    <ol>{guide.steps.map(step => <li key={step}>{step}</li>)}</ol>
    <div className="learning-note"><SectionHeading>A common mistake</SectionHeading><p>{guide.mistake}</p></div>
    <SectionHeading>Before moving on</SectionHeading>
    {userId ? <GuideChecklist key={userId} guide={guide} userId={userId} /> : <>
      <p role="status" className="seasonal-muted text-sm">{identityMessage || 'Checking which checklist to use… You can keep reading.'}</p>
      {guide.checklist.map(item => <label className="learning-check" key={item}><input type="checkbox" checked={false} disabled readOnly />{item}</label>)}
    </>}
    {guide.id === 'space' && <section className="learning-note" aria-labelledby="beginner-design-heading">
      <SectionHeading id="beginner-design-heading">Design your space</SectionHeading>
      <p>Ready to start your garden? Use what you’ve learned about your space, sunlight and access to water to sketch a simple layout.</p>
      <div className="learning-actions">
        {page
          ? <Link className={`seasonal-outline ${linkStyle}`} href="/?view=garden-layout" onClick={onWorkspaceNavigate}>Open Plan &amp; Design</Link>
          : <button type="button" className="seasonal-outline" onClick={onPlan}>Open Plan &amp; Design</button>}
      </div>
    </section>}
    <LearningSources sources={guide.sources} />
    <nav aria-label="Guide next steps" className={finalGuide ? 'mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3' : 'learning-actions'}>
      {finalGuide && (userId && userId !== 'guest'
        ? page
          ? <Link className={`seasonal-outline ${linkStyle} justify-center text-center`} href="/?view=plant-vault" onClick={onWorkspaceNavigate}>Explore Plants</Link>
          : <button type="button" className={`seasonal-outline ${linkStyle} justify-center text-center`} onClick={onExplorePlants}>Explore Plants</button>
        : <button type="button" className={`seasonal-outline ${linkStyle} justify-center text-center`} disabled={!userId} aria-expanded={showPlantOptions} aria-controls={userId === 'guest' ? 'beginner-plant-options' : undefined} onClick={() => setShowPlantOptions(open => !open)}>Explore Plants</button>)}
      {page
        ? <Link className={`seasonal-outline ${linkStyle} justify-center text-center`} href={`/beginners-guide/${next.id}`}>{nextLabel}</Link>
        : <button type="button" className={`seasonal-outline ${linkStyle} justify-center text-center`} onClick={() => { setShowPlantOptions(false); onNext?.(next.id); }}>{nextLabel}</button>}
      {finalGuide && (page
        ? <Link className={`seasonal-button ${linkStyle} justify-center text-center`} href="/?view=garden-layout" onClick={onWorkspaceNavigate}>Start Your Garden</Link>
        : <button type="button" className={`seasonal-button ${linkStyle} justify-center text-center`} onClick={onPlan}>Start Your Garden</button>)}
    </nav>
    {finalGuide && userId === 'guest' && <aside id="beginner-plant-options" hidden={!showPlantOptions} className="learning-note" role="status">
      <p>Plant Vault holds your personal plant collection and is available when you sign in. You can explore flower guides in Flower Corner without an account.</p>
      <Link className={`seasonal-outline ${linkStyle}`} href="/flower-corner">Explore Flower Corner</Link>
    </aside>}
  </article>;
}
