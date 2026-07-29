// map2.js - MAP 2: ADVENTURE PARK & CITY ZOO (STORY_SPEC Part II Map 2).
// Same 15x15 block convention as Central (spec's 20x20 rescaled onto the
// painter's native 512px grid, topology preserved). `fabric: 'park'`
// swaps the ground painter to world_park.js - collision is unchanged, so
// the whole map costs one data file plus paint.
window.PC = window.PC || {};
PC.STORY = PC.STORY || {};
PC.STORY.maps = PC.STORY.maps || {};

PC.STORY.maps.park = {
  id: 'park',
  name: 'ADVENTURE PARK & CITY ZOO',
  fabric: 'park',
  spawnSet: 'park',           // feral produce instead of street food
  blocks: 15,
  spawn: { c: 7, r: 3 },      // just inside the Park Gates
  landmarks: [
    { id: 'gates',    name: 'PARK GATES',        c0: 6,  r0: 0,  c1: 8,  r1: 1,  color: '#4a6b3f', accent: '#f2c33c' },
    { id: 'green',    name: 'THE GREENHOUSE',    c0: 1,  r0: 2,  c1: 3,  r1: 4,  color: '#3f6b63', accent: '#a8e04a' },
    { id: 'pens',     name: 'ZOO ENCLOSURES',    c0: 10, r0: 2,  c1: 13, r1: 5,  color: '#5a5240', accent: '#d8b24a' },
    { id: 'pond',     name: 'THE BIG POND',      c0: 4,  r0: 6,  c1: 7,  r1: 8,  color: '#2f4a66', accent: '#35d0ff', open: true },
    { id: 'carousel', name: 'THE CAROUSEL',      c0: 1,  r0: 9,  c1: 2,  r1: 10, color: '#5c3f5e', accent: '#ff9ecb', open: true },
    { id: 'aviary',   name: 'AVIARY TOWER',      c0: 12, r0: 8,  c1: 13, r1: 10, color: '#46567a', accent: '#cfd4e8' },
    { id: 'amphi',    name: 'OVERGROWN AMPHITHEATER', c0: 10, r0: 11, c1: 12, r1: 12, color: '#3d5136', accent: '#a8e04a' },
    { id: 'ranger',   name: 'RANGER STATION',    c0: 5,  r0: 11, c1: 7,  r1: 13, color: '#6b5334', accent: '#f2c33c' },
  ],
};
