/** Schematic teaching aids; the reviewed species text remains the instruction. */
export type CareTechnique = 'pinching' | 'deadheading' | 'cutback';
export type CareVisualMode = 'pinch' | 'leave-intact' | 'deadhead' | 'selective' | 'trim' | 'dormant' | 'bulb' | 'woody' | 'bulb-flower' | 'flower-stalk' | 'flower-spike';
const pinchCandidates = new Set(['dahlias','zinnias','cosmos','marigolds','snapdragons','calendula','lisianthus','strawflower','celosia','sweet-peas','chantilly-snapdragons','perennial-asters','coleus']);
const bulbs = new Set(['daffodils','tulips','ornamental-alliums','ranunculus']);
const foliage = new Set(['heuchera','hosta','japanese-painted-fern','autumn-fern','brunnera','pulmonaria','bergenia','ligularia','tiarella','hellebores']);
const trimCandidates = new Set(['alyssum','calendula','violas','astrantia','dianthus','catmint']);
const selective = new Set(['zinnias','cosmos','marigolds','snapdragons','lisianthus','strawflower','gomphrena','celosia','amaranth','scabiosa','bupleurum','nasturtium','chantilly-snapdragons','feverfew','coleus']);
const ferns = new Set(['japanese-painted-fern','autumn-fern']);
export function careVisualMode(id: string, technique: CareTechnique): CareVisualMode {
  if (technique === 'pinching') return pinchCandidates.has(id) ? 'pinch' : 'leave-intact';
  if (technique === 'deadheading') {
    if(ferns.has(id) || id === 'bleeding-heart') return 'leave-intact';
    if(id === 'coleus') return 'flower-spike';
    if(id === 'hydrangeas') return 'woody';
    if(bulbs.has(id)) return 'bulb-flower';
    if(foliage.has(id) || ['astilbe','japanese-anemone','astrantia','statice'].includes(id)) return 'flower-stalk';
    return 'deadhead';
  }
  if (id === 'hydrangeas') return 'woody';
  if (id === 'japanese-painted-fern' || id === 'ligularia' || id === 'bleeding-heart') return 'dormant';
  if (id === 'coleus') return 'trim';
  if (bulbs.has(id)) return 'bulb';
  if (foliage.has(id)) return 'selective';
  if (trimCandidates.has(id)) return 'trim';
  if (selective.has(id)) return 'selective';
  return 'dormant';
}
export function careVisualCaption(mode: CareVisualMode): string {
  return {
    'bulb-flower':'Spent flower or seedpod only when the species guidance calls for it. Keep green leaves feeding the bulb.',
    'flower-stalk':'A spent flowering stalk is separate from the leafy crown. Preserve healthy basal foliage and new shoots.',
    'flower-spike':'Optional removal of a flowering spike to favor foliage. Keep the leaves and growing shoots.',
    pinch:'Young tip above a leaf pair → a branching shoot. Only if the variety benefits from pinching.',
    'leave-intact':'Leave the growing point intact. This is not a routine pinching or cutting step for this plant.',
    deadhead:'Faded flower → remove the spent flowering part while retaining healthy growth. Keep selected heads if saving seed.',
    selective:'Choose only the finished or damaged part. Keep the healthy leaves, shoots and crown.',
    trim:'A light, timed trim above living growth → a retained leafy base, not bare soil.',
    dormant:'Finished stems → seasonal cleanup when the plant-specific instructions say it is time. Do not cut healthy new growth.',
    bulb:'Green leaves keep feeding the bulb. Wait for natural yellowing or dieback before tidying.',
    woody:'Identify the flowering wood first. Keep live buds until you know which stems and timing suit this shrub.'
  }[mode];
}
