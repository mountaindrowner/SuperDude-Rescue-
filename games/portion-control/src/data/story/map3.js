// map3.js - SWEET SUBURBS (STORY_SPEC Part II Map 3). COORDS ARE PARCEL
// INDICES like map1/map2. fabric 'suburb' -> PC.SuburbLayout: crescent
// streets, cul-de-sacs, pastel houses, and the dessert flood flowing out
// of the Bakery. `custom` landmarks are painted by the layout engine;
// the rest get region painters (school/bakery slabs + roof flavour, the
// rec ballfield, the water tower tank).
window.PC = window.PC || {};
PC.STORY = PC.STORY || {};
PC.STORY.maps = PC.STORY.maps || {};

PC.STORY.maps.suburbs = {
  id: 'suburbs',
  name: 'SWEET SUBURBS',
  fabric: 'suburb',
  spawnSet: 'suburb',         // rogue desserts
  blocks: 15,
  spawn: { c: 7, r: 1 },      // the entry cul-de-sac, south of the sign
  landmarks: [
    { id: 'welcome',    name: 'WELCOME SIGN',   c0: 6,  r0: 0,  c1: 7,  r1: 0,
      color: '#4c703f', accent: '#ff9ecb', open: true, custom: true },
    { id: 'pool',       name: 'COMMUNITY POOL', c0: 2,  r0: 3,  c1: 3,  r1: 4,
      color: '#f2cede', accent: '#ff9ecb', open: true, custom: true },
    { id: 'school',     name: 'THE SCHOOL',     c0: 10, r0: 2,  c1: 12, r1: 3,
      color: '#8f5a4a', accent: '#f2c33c' },
    { id: 'rec',        name: 'REC CENTER',     c0: 5,  r0: 7,  c1: 7,  r1: 8,
      color: '#3d5a33', accent: '#a8e04a', open: true },
    { id: 'watertower', name: 'WATER TOWER',    c0: 1,  r0: 9,  c1: 1,  r1: 9,
      color: '#5d6470', accent: '#35d0ff' },
    { id: 'bigoak',     name: 'THE BIG OAK',    c0: 11, r0: 9,  c1: 12, r1: 10,
      color: '#3a5f3c', accent: '#a8e04a', open: true, custom: true },
    { id: 'blockparty', name: 'BLOCK PARTY',    c0: 2,  r0: 12, c1: 3,  r1: 12,
      color: '#4c703f', accent: '#f2c33c', open: true, custom: true },
    { id: 'bakery',     name: 'THE BAKERY',     c0: 6,  r0: 12, c1: 8,  r1: 13,
      color: '#dcc9d4', accent: '#ff9ecb' },
  ],
};
