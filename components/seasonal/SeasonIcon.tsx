import type { Season } from "@/lib/seasons";

/** Shared botanical marks for both seasonal selectors. */
export default function SeasonIcon({ season, className = "" }: { season: Season; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} data-season-icon={season} aria-hidden="true" focusable="false" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {season === "fall" && <>
        <path d="M25 5C13 3 5 8 6 17c1 7 9 10 15 5 5-4 6-11 4-17Z" fill="#bd672d" stroke="#915027" strokeWidth="1.2" />
        <path d="M5 28 23 8M12 20l-1-7m6 2 6 1m-5-7 1 3" stroke="#f9d897" strokeWidth="1.4" />
      </>}
      {season === "winter" && <>
        <path d="M7 28 25 5" stroke="#785c3c" strokeWidth="1.7" />
        {[0,1,2,3,4].map(i => <g key={i} transform={`translate(${10+i*3} ${24-i*4}) rotate(37)`} stroke="#356657" strokeWidth="1.8"><path d="M0 0-7-5M0 0 7-5M0-2-6-9M0-2 6-9" /></g>)}
      </>}
      {season === "spring" && <>
        <path d="M16 17v13" stroke="#4f7546" strokeWidth="2" />
        <path d="M16 28C7 28 6 22 6 20c6 0 10 3 10 8Zm0-4c7-1 10-6 10-9-6 2-10 5-10 9Z" fill="#73945c" />
        <path d="M16 4 12 9 7 5c-1 10 3 15 9 15s10-5 9-15l-5 4-4-5Z" fill="#dc8fa2" stroke="#ac586f" strokeWidth="1.2" /><path d="M12 9c0 5 1 8 4 11 3-3 4-6 4-11" stroke="#f7c4d2" strokeWidth="1.1" />
      </>}
      {season === "summer" && <>
        <path d="M16 20v11m0-4c6 0 9-3 9-6-5 0-8 2-9 6" stroke="#527245" strokeWidth="1.6" fill="#73945c" />
        {[0,30,60,90,120,150,180,210,240,270,300,330].map(a => <ellipse key={a} cx="16" cy="8" rx="3.2" ry="6" transform={`rotate(${a} 16 14)`} fill="#bb5a76" stroke="#8e3e5b" strokeWidth=".65" />)}
        {[15,60,105,150,195,240,285,330].map(a => <ellipse key={a} cx="16" cy="10" rx="2.3" ry="4" transform={`rotate(${a} 16 14)`} fill="#e4a1b3" stroke="#b96784" strokeWidth=".6" />)}
        <circle cx="16" cy="14" r="2.5" fill="#f2d094" />
      </>}
    </svg>
  );
}
