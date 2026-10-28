/** Illustrated landscape structures, separate from planted borders and ground cover. */
export const wallStyles = [
  {id:"retaining",name:"Stacked stone retaining wall",detail:"Natural stone for framing beds and container groups",src:"/wall-art/retaining.webp"},
  {id:"sitting-stone",name:"Stone sitting wall",detail:"A low stone wall with a broad, smooth seat cap",src:"/wall-art/sitting-stone.webp"},
  {id:"sitting-brick",name:"Brick sitting wall",detail:"Warm brick with a pale stone seat cap",src:"/wall-art/sitting-brick.webp"},
  {id:"curved-stone",name:"Curved stone sitting wall",detail:"A gentle curve for a welcoming container nook",src:"/wall-art/curved-stone.webp"},
] as const;
export type WallStyleId = typeof wallStyles[number]["id"];
export function wallArt(value:unknown) { return wallStyles.find(style=>style.id===value)??wallStyles[0]; }
