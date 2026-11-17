import Image from "next/image";
import type { DesignPlant } from "@/lib/layout-plant-catalog";

/** Display only the named plant's verified artwork; isolate a single sprite tile. */
export default function LayoutPlantArt({ plant, size = "100%" }: {
  plant: {name:string;src?:string;sprite?:DesignPlant["sprite"]};
  size?: number | string;
}) {
  const tile=plant.sprite;
  return <span aria-hidden="true" style={{position:"relative",display:"block",width:size,height:size,overflow:"hidden",pointerEvents:"none",flexShrink:0}}>
    {plant.src ? tile ? <span style={{display:"block",width:"100%",height:"100%",backgroundImage:`url("${plant.src}")`,backgroundSize:`${tile.columns*100}% ${tile.columns*100}%`,backgroundPosition:`${tile.column/(tile.columns-1)*100}% ${tile.row/(tile.columns-1)*100}%`,backgroundRepeat:"no-repeat",maskImage:"radial-gradient(ellipse at center,#000 48%,#000c 65%,transparent 82%)"}}/> : <Image src={plant.src} alt="" fill sizes="110px" draggable={false} style={{objectFit:"contain"}}/> : <span style={{display:"flex",alignItems:"center",justifyContent:"center",width:"100%",height:"100%",borderRadius:12,background:"#f1f3e5",color:"#496c42",fontWeight:700,fontSize:18}}>{plant.name.split(/\s+/).map(word=>word[0]).slice(0,2).join("")}</span>}
  </span>;
}
