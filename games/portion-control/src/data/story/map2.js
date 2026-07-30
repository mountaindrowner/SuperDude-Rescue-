// map2.js - ADVENTURE PARK & CITY ZOO (STORY_SPEC Part II Map 2).
// COORDS ARE PARCEL INDICES, same as map1 - lots never cover a street.
// Mark's park notes from the whole-map review: the zoo wants a SECTIONED
// OFF space (fenced: true draws an enclosure ring with a gate gap), the
// pond should be ROUND (shape: 'round'), and park edges shouldn't be
// straight lines - every `open` lot here is drawn with a wavy organic
// outline instead of a rectangle.
window.PC = window.PC || {};
PC.STORY = PC.STORY || {};
PC.STORY.maps = PC.STORY.maps || {};

PC.STORY.maps.park = {
  id: 'park',
  name: 'ADVENTURE PARK & CITY ZOO',
  fabric: 'park',
  spawnSet: 'park',           // feral produce instead of street food
  blocks: 15,
  spawn: { c: 7, r: 3 },      // on the path just inside the Park Gates
  landmarks: [
    { id: 'gates',    name: 'PARK GATES',    c0: 6,  r0: 0,  c1: 7,  r1: 0,
      color: '#4a6b3f', accent: '#f2c33c', open: true, custom: true },
    { id: 'green',    name: 'THE GREENHOUSE', c0: 1, r0: 2,  c1: 2,  r1: 3,
      color: '#3f6b63', accent: '#a8e04a' },
    { id: 'pens',     name: 'ZOO ENCLOSURES', c0: 9, r0: 2,  c1: 11, r1: 3,
      color: '#5a5240', accent: '#d8b24a', open: true, custom: true },
    { id: 'pond',     name: 'THE BIG POND',   c0: 4, r0: 6,  c1: 5,  r1: 7,
      color: '#38678a', accent: '#35d0ff', open: true, shape: 'round', water: true },
    { id: 'carousel', name: 'THE CAROUSEL',   c0: 1, r0: 9,  c1: 1,  r1: 9,
      color: '#5c3f5e', accent: '#ff9ecb', open: true, shape: 'round' },
    { id: 'aviary',   name: 'AVIARY TOWER',   c0: 12, r0: 8, c1: 12, r1: 8,
      color: '#46567a', accent: '#cfd4e8' },
    { id: 'amphi',    name: 'AMPHITHEATER',   c0: 10, r0: 11, c1: 11, r1: 11,
      color: '#3d5136', accent: '#a8e04a', open: true },
    { id: 'ranger',   name: 'RANGER STATION', c0: 6,  r0: 11, c1: 7,  r1: 12,
      color: '#6b5334', accent: '#f2c33c' },
  ],
};
