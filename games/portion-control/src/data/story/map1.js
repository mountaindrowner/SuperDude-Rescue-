// map1.js - ADVENTURE CITY, CENTRAL DISTRICT (STORY_SPEC Part II Map 1).
// COORDS ARE PARCEL INDICES (region.js PC.PARCEL): a parcel is the 384px
// square of LAND between streets, so a lot can never cover a road.
// [c0,r0,c1,r1] inclusive -> 1 parcel = "1 square", 2x2 = "4 squares".
// SIZES ARE MARK'S CALL from the whole-map review (tools/map_atlas.js):
//   City Hall 4 - Bloom Tower 4, squarely centred - Frostbite Bank 4
//   Central Plaza 6 - Substation 2 - Sal's 1 - Diner 1 - Garage 1
//   Mission Board 1 - Nourish-Ray Stage small (it's the intro set)
window.PC = window.PC || {};
PC.STORY = PC.STORY || {};
PC.STORY.maps = PC.STORY.maps || {};

PC.STORY.maps.central = {
  id: 'central',
  name: 'ADVENTURE CITY - CENTRAL DISTRICT',
  blocks: 15,                 // x 512px = 7680px square
  spawn: { c: 7, r: 7 },      // on the street beside the Mission Board
  landmarks: [
    { id: 'cityhall',   name: 'CITY HALL',          c0: 6,  r0: 1,  c1: 7,  r1: 2,  color: '#4d688f', accent: '#f2c33c' },
    { id: 'bloomtower', name: 'BLOOM TOWER',        c0: 11, r0: 1,  c1: 12, r1: 2,  color: '#665882', accent: '#ff9ecb' },
    // v0.31.0 (Mark: "the nourish ray stage is confusing, doesn't fit
    // the story") - it IS the story: the wrecked plaza stage where the
    // demo went wrong. Renamed + custom wreck painter so it reads.
    { id: 'demostage',  name: 'THE DEMO SITE',      c0: 7,  r0: 4,  c1: 7,  r1: 4,  color: '#241f3d', accent: '#b45ce8', open: true },
    { id: 'garage',     name: 'SUPER DUDE GARAGE',  c0: 1,  r0: 5,  c1: 1,  r1: 5,  color: '#5a5388', accent: '#35d0ff' },
    { id: 'store',      name: "SAL'S CORNER STORE", c0: 11, r0: 5,  c1: 11, r1: 5,  color: '#6e5866', accent: '#a8e04a' },
    // v0.31.0: an OPEN kiosk now, not a mystery building - a signboard
    // you walk up to between missions (Mark asked twice what it was)
    { id: 'board',      name: 'MISSION BOARD',      c0: 7,  r0: 6,  c1: 7,  r1: 6,  color: '#2e2a45', accent: '#f2c33c', open: true },
    { id: 'plaza',      name: 'CENTRAL PLAZA',      c0: 5,  r0: 8,  c1: 7,  r1: 9,  color: '#2e2a45', accent: '#35d0ff', open: true },
    // v0.75.0 (Mark: "should be a real substation area, a large fenced-in
    // area with pylons, wires, transformers in rows, the player weaving
    // through the rows; it's what you defend"): an OPEN fenced yard now,
    // with transformer rows as solids (region._substationSolids).
    { id: 'substation', name: 'THE SUBSTATION',     c0: 11, r0: 9,  c1: 12, r1: 9,  color: '#3a3540', accent: '#f2c33c', open: true },
    { id: 'diner',      name: 'THE OLD DINER',      c0: 2,  r0: 11, c1: 2,  r1: 11, color: '#564a6c', accent: '#ff6b6b' },
    { id: 'bank',       name: 'FROSTBITE BANK',     c0: 8,  r0: 11, c1: 9,  r1: 12, color: '#4a4570', accent: '#35d0ff' },
  ],
};
