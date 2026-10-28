/** Original watercolor vessels. Artwork is independent of planning geometry. */
export const containerStyles = [
  {id:"terracotta",name:"Classic terracotta",detail:"A warm clay pot for vegetables, herbs or flowers",src:"/container-art/terracotta.webp",w:18,h:20},
  {id:"ivory",name:"Ivory porch planter",detail:"A generous rounded ceramic planter",src:"/container-art/ivory.webp",w:22,h:22},
  {id:"glazed",name:"Glazed blue pot",detail:"A handcrafted ceramic accent for a patio",src:"/container-art/glazed.webp",w:18,h:20},
  {id:"urn",name:"Stone garden urn",detail:"A taller, sculptural planter with a pedestal",src:"/container-art/urn.webp",w:16,h:25},
  {id:"wood",name:"Cedar planter box",detail:"A long timber planter for a patio or small garden",src:"/container-art/wood.webp",w:32,h:18},
  {id:"trough",name:"Galvanized trough",detail:"An elongated metal planter with room to grow",src:"/container-art/trough.webp",w:34,h:18},
  {id:"grow-bag",name:"Fabric grow bag",detail:"A flexible growing container with carrying handles",src:"/container-art/grow-bag.webp",w:20,h:20},
  {id:"window-box",name:"Sage window box",detail:"A slim planter for a balcony, ledge or railing",src:"/container-art/window-box.webp",w:32,h:14},
  {id:"basket",name:"Hanging basket",detail:"Woven willow with a generous planting basket",src:"/container-art/basket.webp",w:20,h:24},
  {id:"barrel",name:"Oak half-barrel",detail:"A rustic timber tub with dark metal hoops",src:"/container-art/barrel.webp",w:26,h:23},
  {id:"tall-square",name:"Tall square planter",detail:"A modern charcoal planter for a doorway or patio",src:"/container-art/tall-square.webp",w:16,h:28},
  {id:"wall",name:"Wall pocket planter",detail:"A glazed ceramic half-pot for a wall or fence",src:"/container-art/wall.webp",w:20,h:22},
] as const;
export type ContainerStyleId = typeof containerStyles[number]["id"];
export function containerArt(value: unknown) { return containerStyles.find(style=>style.id===value) ?? containerStyles[0]; }
