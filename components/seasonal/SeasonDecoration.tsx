import type { Season } from "@/lib/seasons";

/** Small botanical vignettes, deliberately isolated from the readable content. */
export default function SeasonDecoration({ season }: { season: Season }) {
  return (
    <svg viewBox="0 0 210 76" aria-hidden="true" focusable="false" className="h-16 w-40 shrink-0 sm:w-48" fill="none">
      {season === "spring" && <>
        <path d="M30 68V30M87 68V27M152 68V48" stroke="#b7dca6" strokeWidth="3" />
        <path d="M30 54Q7 36 15 60Q25 69 30 54M87 55Q110 36 103 62Q93 69 87 55" fill="#b7dca6" />
        <path d="M16 15L25 23L31 11L38 23L46 15V31Q31 51 16 31Z" fill="#f3a7b7" />
        <path d="M86 9L93 21L106 16L101 30L111 37L96 40L91 53L81 41L66 43L72 30L64 19L79 21Z" fill="#f6d365" />
        <circle cx="87" cy="31" r="8" fill="#f3a7b7" />
        <path d="M152 53Q131 26 128 45Q134 60 152 53M152 53Q174 25 178 44Q173 59 152 53" fill="#b7dca6" />
        <circle cx="193" cy="25" r="5" fill="#b8a1d9" /><circle cx="187" cy="17" r="4" fill="#b8a1d9" />
      </>}
      {season === "summer" && <>
        <path d="M31 70V33M88 70V36M151 70V32" stroke="#b7dca6" strokeWidth="3" />
        <g fill="#f05a7e"><circle cx="21" cy="23" r="9" /><circle cx="39" cy="23" r="9" /><circle cx="21" cy="40" r="9" /><circle cx="39" cy="40" r="9" /></g><circle cx="30" cy="32" r="7" fill="#f8c537" />
        <g fill="#ffd557"><ellipse cx="151" cy="31" rx="24" ry="9" /><ellipse cx="151" cy="31" rx="9" ry="24" /><ellipse cx="151" cy="31" rx="24" ry="9" transform="rotate(45 151 31)" /><ellipse cx="151" cy="31" rx="24" ry="9" transform="rotate(-45 151 31)" /></g><circle cx="151" cy="31" r="11" fill="#794b29" />
        <path d="M88 19Q71 11 75 30Q60 39 80 43Q85 62 93 44Q115 43 102 31Q107 13 88 19" fill="#ffb4cc" /><circle cx="88" cy="33" r="5" fill="#f7943d" />
        <path d="M189 24Q174 9 178 29Q179 38 189 32Q200 39 204 26Q211 7 189 24" fill="#6ec5e9" /><path d="M189 22V37" stroke="#20372b" strokeWidth="2" />
      </>}
      {season === "fall" && <>
        <path d="M14 30Q26 1 52 11Q51 40 14 30" fill="#d97832" /><path d="M14 30L44 16" stroke="#f3dfca" strokeWidth="2" />
        <path d="M61 44V17M73 45V12M84 43V20" stroke="#d7a52a" strokeWidth="2" /><g fill="#d7a52a"><ellipse cx="61" cy="17" rx="4" ry="8" /><ellipse cx="73" cy="12" rx="4" ry="8" /><ellipse cx="84" cy="20" rx="4" ry="8" /></g>
        <path d="M112 38Q121 11 145 34" stroke="#d7a52a" strokeWidth="3" />
        <path d="M104 38H163L156 65H111Z" fill="#d7a52a" /><path d="M108 46H159M110 54H157M120 39L122 63M137 39V63M150 39L148 63" stroke="#86542b" strokeWidth="2" />
        <path d="M115 34Q119 17 135 26Q145 32 133 39Q123 43 115 34M137 34Q149 21 158 30Q163 40 147 41Z" fill="#7b4562" />
        <path d="M166 60Q180 42 199 49Q206 59 190 67Q173 75 166 60" fill="#a94c32" /><path d="M174 59L190 55M182 64L194 59" stroke="#edab78" strokeWidth="2" />
      </>}
      {season === "winter" && <>
        <path d="M13 59L103 19M101 61L177 30" stroke="#b7d3c5" strokeWidth="3" />
        <path d="M30 52L20 34M30 52L51 57M48 44L37 25M48 44L72 48M67 35L57 18M67 35L88 39M120 53L108 35M120 53L142 58M139 46L132 30M139 46L160 50M158 38L153 22" stroke="#b7d3c5" strokeWidth="4" strokeLinecap="round" />
        <g fill="#d8879b"><circle cx="76" cy="21" r="5" /><circle cx="86" cy="17" r="5" /><circle cx="85" cy="28" r="5" /><circle cx="151" cy="59" r="4" /><circle cx="160" cy="63" r="4" /></g>
        <path d="M189 11V37M176 24H202M180 15L198 33M180 33L198 15" stroke="#d5e7eb" strokeWidth="2" /><g fill="#fff"><circle cx="112" cy="14" r="2" /><circle cx="41" cy="14" r="2" /><circle cx="191" cy="57" r="2" /></g>
      </>}
    </svg>
  );
}
