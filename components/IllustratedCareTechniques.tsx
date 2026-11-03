import type { FlowerCornerProfile } from '@/lib/flower-corner-library';
import { careVisualMode, careVisualCaption, type CareTechnique, type CareVisualMode } from '@/lib/flower-care-visuals';

const titles: Record<CareTechnique,string> = {pinching:'Pinching',deadheading:'Deadheading',cutback:'Cutting back'};
function Leaves({x=55,y=115}:{x?:number;y?:number}) {
  return <g fill="#89a382" stroke="#526d52" strokeWidth="1.4"><path d={`M${x},${y} Q${x-29},${y-30} ${x-29},${y-9} Q${x-17},${y+4} ${x},${y}`}/><path d={`M${x},${y} Q${x+29},${y-30} ${x+29},${y-9} Q${x+17},${y+4} ${x},${y}`}/></g>;
}
function Bloom({x=55,y=42,spent=false}:{x?:number;y?:number;spent?:boolean}) {
  return <g transform={`translate(${x} ${y})`} fill={spent?'#ad987b':'#c78e9b'} stroke={spent?'#887359':'#a06d7c'}>{[0,60,120,180,240,300].map(a=><ellipse key={a} cx="0" cy="-9" rx="5" ry="10" transform={`rotate(${a})`}/>)}<circle r="6" fill={spent?'#80684c':'#d3b66b'}/></g>;
}
function Cut({x,y}:{x:number;y:number}) {return <g stroke="#b95d54" strokeWidth="2.5"><path d={`M${x-14},${y}h28`} strokeDasharray="4 3"/><path d={`M${x+17},${y-5}l7,10m0,-10l-7,10`}/></g>;}

/** Code-native diagrams stay crisp and make cut positions explicit, unlike decorative photos. */
export function CareDiagram({mode,label}:{mode:CareVisualMode;label:string}) {
  return <svg viewBox="0 0 240 180" role="img" aria-label={label} className="corner-care-diagram">
    <rect x="1" y="1" width="238" height="178" rx="18" fill="#f4f2e9"/>
    {mode==='leave-intact' ? <>
      <g stroke="#58765a" strokeWidth="3" fill="none"><path d="M120 155V47"/><path d="M120 50q-12-20 0-27q12 7 0 27" fill="#94aa7e"/></g><Leaves x={120} y={115}/><Leaves x={120} y={84}/>
      <circle cx="185" cy="45" r="17" fill="#e7eddf" stroke="#66815b"/><path d="m177 45 6 6 10-13" fill="none" stroke="#66815b" strokeWidth="3"/>
      <text x="120" y="173" textAnchor="middle">Keep the growing point</text>
    </> : mode==='bulb' ? <>
      {[55,180].map((x,i)=><g key={x}><ellipse cx={x} cy="147" rx="15" ry="13" fill="#bfa384"/><path d={`M${x} 140q-30-70-20-90q22 25 20 90q28-74 19-96q-20 32-19 96`} fill={i?'#c2aa63':'#839e73'} stroke={i?'#a38b4d':'#5d7954'} strokeWidth="2"/></g>) }<path d="M105 95h28m-8-7 8 7-8 7" stroke="#889482" strokeWidth="2" fill="none"/>
      <text x="55" y="173" textAnchor="middle">Keep green leaves</text><text x="180" y="173" textAnchor="middle">Let foliage finish</text>
    </> : mode==='bulb-flower' || mode==='flower-stalk' ? <>
      {[55,180].map((x,i)=><g key={x}><path d={`M${x} 150q-26-45-20-55q19 17 20 55q24-42 19-57q-17 20-19 57`} fill="#89a382" stroke="#58765a" strokeWidth="2"/><path d={`M${x} 148V${i?(mode==='bulb-flower'?64:133):43}`} stroke="#58765a" strokeWidth="3"/>{!i&&<Bloom x={x} y={39} spent/>}</g>)}
      <Cut x={55} y={mode==='bulb-flower'?62:132}/><path d="M105 92h28m-8-7 8 7-8 7" stroke="#889482" strokeWidth="2" fill="none"/>
      <text x="55" y="173" textAnchor="middle">Spent flowering part</text><text x="180" y="173" textAnchor="middle">Keep basal leaves</text>
    </> : mode==='woody' ? <>
      <g stroke="#8c7860" strokeWidth="6" fill="none"><path d="M120 154V94L83 55M120 94l35-47M120 119l-43-21M120 113l38-17"/></g><g fill="#8ca67a">{[[83,55],[155,47],[77,98],[158,96]].map(([x,y])=><ellipse key={`${x}-${y}`} cx={x} cy={y} rx="7" ry="11"/>)}</g><text x="120" y="173" textAnchor="middle">Identify old or new wood</text>
    </> : <>
      <path d="M105 92h28m-8-7 8 7-8 7" stroke="#889482" strokeWidth="2" fill="none"/>
      {mode==='pinch' ? <>
        <path d="M55 153V38M180 153V91q-20-9-23-35M180 91q20-9 23-35" stroke="#58765a" strokeWidth="3" fill="none"/><Leaves y={126}/><Leaves y={89}/><Leaves x={180} y={126}/><Leaves x={180} y={94}/><circle cx="55" cy="35" r="5" fill="#8aa377"/><Cut x={55} y={66}/><text x="55" y="173" textAnchor="middle">Tip above a node</text><text x="180" y="173" textAnchor="middle">Side shoots retained</text>
      </> : mode==='deadhead' || mode==='flower-spike' ? <>
        <path d="M55 153V43M180 153V105" stroke="#58765a" strokeWidth="3" fill="none"/><Leaves y={130}/><Leaves x={180} y={130}/><Bloom spent={mode!=='flower-spike'}/><Cut x={55} y={105}/><text x="55" y="173" textAnchor="middle">{mode==='flower-spike'?'Optional flower removal':'Spent bloom'}</text><text x="180" y="173" textAnchor="middle">Healthy growth stays</text>
      </> : mode==='trim' ? <>
        {[35,55,75].map(x=><path key={x} d={`M55 153Q${x} 100 ${x} 50`} stroke="#79916c" strokeWidth="3" fill="none"/>)}<Leaves y={128}/><Leaves y={101}/><Cut x={55} y={78}/><path d="M180 153V95" stroke="#58765a" strokeWidth="3"/><Leaves x={180} y={126}/><Leaves x={180} y={105}/><text x="55" y="173" textAnchor="middle">Timed light trim</text><text x="180" y="173" textAnchor="middle">Keep living growth</text>
      </> : <>
        <path d="M55 153V103M180 153V103" stroke="#58765a" strokeWidth="3"/><Leaves y={128}/><Leaves x={180} y={128}/><path d="M55 145Q35 110 30 55" stroke="#ad987b" strokeWidth="3" fill="none"/><Bloom x={30} y={50} spent/><Cut x={43} y={118}/><text x="55" y="173" textAnchor="middle">Finished part only</text><text x="180" y="173" textAnchor="middle">Protect new growth</text>
      </>}
    </>}
  </svg>;
}
export function PlantCareIllustrations({profile}:{profile:FlowerCornerProfile}) {
  return <div className="corner-care-grid">{(['pinching','deadheading','cutback'] as const).map(technique=>{
    const mode=careVisualMode(profile.id,technique);
    return <section className="corner-care-card" key={technique}>
      <h3>{titles[technique]}</h3><CareDiagram mode={mode} label={`${profile.name}: ${titles[technique].toLowerCase()} schematic. ${careVisualCaption(mode)}`}/>
      <p className="corner-care-caption">{careVisualCaption(mode)}</p><p className="corner-care-specific"><strong>For {profile.name}:</strong> {profile[technique]}</p>
    </section>;
  })}<p className="corner-care-legend">Simplified diagrams, not plant-identification pictures. Dashed red lines show a possible cut only where the plant-specific guidance calls for it; timing and cultivar matter.</p></div>;
}
export default function IllustratedCareTechniques() {
  return <article className="corner-profile"><h3>Three different cuts, three different jobs</h3><p>These are examples, not a cutting schedule for every plant. Open a plant’s guide for its own instructions.</p><div className="corner-care-grid">
    <section className="corner-care-card"><h3>Pinching</h3><CareDiagram mode="pinch" label="Pinching a young branching stem above a leaf pair, with side shoots growing below the cut"/><p>Remove a young growing tip above a leaf pair to encourage branching, for suitable plants such as dahlias. Do not pinch bulbs, foliage crowns or single-stem sunflowers.</p></section>
    <section className="corner-care-card"><h3>Deadheading</h3><CareDiagram mode="deadhead" label="Removing a faded flower while retaining healthy leaves and buds below it"/><p>Remove spent flowers. For zinnias, cut above healthy leaves or a node; other plants need different cut positions. Leave selected heads if you want seed or winter habitat.</p></section>
    <section className="corner-care-card"><h3>Cutting back</h3><CareDiagram mode="trim" label="A light trim of finished upper stems, leaving living lower growth"/><p>Remove more established growth at the right stage. Catmint can be sheared after its first flowering; bulbs need their green leaves, and woody shrubs depend on their flowering wood. A hard cut is not a universal recipe.</p></section>
  </div><p className="corner-care-legend">Schematic drawings: dashed red lines indicate the example cut. Read the species-specific text before using the picture.</p><footer className="learning-sources"><a href="https://extension.illinois.edu/flowers/caring-annuals" target="_blank" rel="noopener noreferrer">Illinois Extension · Caring for annuals ↗</a><br/><a href="https://yardandgarden.extension.iastate.edu/how-to/how-maintain-perennial-beds-and-borders" target="_blank" rel="noopener noreferrer">Iowa State Extension · Perennial care ↗</a></footer></article>;
}
