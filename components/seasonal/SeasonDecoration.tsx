import type { Season } from "@/lib/seasons";

export default function SeasonDecoration({ season }: { season: Season }) {
  if (season === "summer") {
    return (
      <svg viewBox="0 0 300 220" aria-hidden="true" focusable="false" className="h-44 w-48 sm:h-52 sm:w-64" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <g transform="translate(82 72)">
          <path d="M0 13C-25-16-51-14-48 4c3 15 24 20 45 15C-19 37-13 57 2 50c13-6 12-26 5-37Z" fill="#f8c537" stroke="#fff4bf" strokeWidth="2"/>
          <path d="M8 13C31-15 56-12 52 6c-3 14-23 18-42 13 15 18 9 37-5 31-12-6-10-25-3-37Z" fill="#f05a7e" stroke="#ffd4df" strokeWidth="2"/>
          <path d="M3 5v35M0 4l-7-9M6 4l8-8" stroke="#5b3c2d" strokeWidth="3"/>
        </g>
        <g transform="translate(192 74)">
          <ellipse cx="-17" cy="-8" rx="18" ry="11" fill="#fff7d6" stroke="#fff" strokeWidth="2" transform="rotate(-28 -17 -8)"/>
          <ellipse cx="17" cy="-8" rx="18" ry="11" fill="#fff7d6" stroke="#fff" strokeWidth="2" transform="rotate(28 17 -8)"/>
          <ellipse cy="6" rx="10" ry="24" fill="#f8c537" stroke="#6b4a28" strokeWidth="2"/>
          <path d="M-9-4H9M-10 6H10M-8 16H8" stroke="#5b3c2d" strokeWidth="5"/>
          <path d="M-4-17l-7-12M4-17l8-12" stroke="#5b3c2d" strokeWidth="2"/>
        </g>
        <g transform="translate(143 158)">
          <circle r="17" fill="#8b5a2b"/>
          {[0,45,90,135,180,225,270,315].map((a) => <ellipse key={a} cx="0" cy="-38" rx="13" ry="25" fill="#f8c537" transform={`rotate(${a})`} />)}
          <circle r="11" fill="#6e4625"/>
        </g>
        <path d="M143 175v43M143 193c-18-12-28-11-34-3 7 12 20 14 34 3M144 201c17-11 28-10 34-1-8 11-21 12-34 1" stroke="#74a94f" strokeWidth="4"/>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 300 220" aria-hidden="true" focusable="false" className="h-44 w-48 sm:h-52 sm:w-64" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#e8e2c9" }}>
      {season === "spring" && <><path d="M100 216c8-55 9-101 1-143M101 157c-24-12-34-34-29-55 20 9 31 28 29 55M105 139c22-14 32-31 29-51-19 10-29 27-29 51"/><path d="M101 78c-21-18-19-40 0-54 20 14 21 37 0 54Z" fill="#f3a7b7" fillOpacity=".3"/><path d="M190 216c-2-55 4-102 15-140M191 160c-20-12-29-31-24-51 18 9 27 27 24 51"/><circle cx="207" cy="68" r="25" fill="#f6d365" fillOpacity=".3"/></>}
      {season === "fall" && <><path d="M90 20c22 36 45 68 70 97M112 52c-27-2-42-13-45-31 20 1 36 10 45 31M137 79c17-23 35-31 52-24-11 22-28 30-52 24"/><path d="M83 157h105l-12 49H95l-12-49ZM103 156c9-31 52-31 63 0" stroke="#d7b75c"/><path d="M194 181c12-12 32-16 48-12 18 7 18 25 0 34-17 8-42 9-49-5-3-6-2-12 1-17Z" fill="#b97165" fillOpacity=".35"/></>}
      {season === "winter" && <><path d="M99 214c29-68 55-130 112-191M132 140l-30-28M147 109l-20-34M161 82l-9-31M143 116l43-5M157 89l48-12M178 57l42-14" strokeWidth="2"/><g fill="#c9788c" fillOpacity=".5"><circle cx="121" cy="158" r="6"/><circle cx="111" cy="167" r="6"/><circle cx="195" cy="119" r="5"/></g></>}
    </svg>
  );
}
