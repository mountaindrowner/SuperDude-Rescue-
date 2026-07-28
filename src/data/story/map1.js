// map1.js - STORY-2: ADVENTURE CITY, CENTRAL DISTRICT region data
// (STORY_SPEC Part II Map 1). Block = one 512px street cell of the
// existing city fabric; 15x15 blocks = 7680px world (the spec's 20x20
// @384 rescaled onto the painter's native grid - "block size tunable",
// topology preserved). Landmark rects are in BLOCK coords [c0,r0,c1,r1]
// inclusive; 'open' = no building solid (plaza-style ground feature).
window.PC = window.PC || {};
PC.STORY = PC.STORY || {};
PC.STORY.maps = PC.STORY.maps || {};

PC.STORY.maps.central = {
  id: 'central',
  name: 'ADVENTURE CITY - CENTRAL DISTRICT',
  blocks: 15,                 // x 512px = 7680px square
  spawn: { c: 7, r: 7 },      // beside the Mission Board, map center
  landmarks: [
    { id: 'cityhall',   name: 'CITY HALL',            c0: 6,  r0: 1,  c1: 8,  r1: 2,  color: '#4d688f', accent: '#f2c33c' },
    { id: 'bloomtower', name: 'BLOOM TOWER',          c0: 12, r0: 1,  c1: 13, r1: 2,  color: '#665882', accent: '#ff9ecb' },
    { id: 'demostage',  name: 'NOURISH-RAY STAGE',    c0: 7,  r0: 3,  c1: 8,  r1: 3,  color: '#241f3d', accent: '#35d0ff', open: true },
    { id: 'garage',     name: 'SUPER DUDE GARAGE',    c0: 1,  r0: 5,  c1: 2,  r1: 6,  color: '#5a5388', accent: '#35d0ff' },
    { id: 'store',      name: "SAL'S CORNER STORE",   c0: 10, r0: 5,  c1: 11, r1: 6,  color: '#6e5866', accent: '#a8e04a' },
    { id: 'board',      name: 'MISSION BOARD',        c0: 6,  r0: 6,  c1: 7,  r1: 7,  color: '#40567a', accent: '#f2c33c' },
    { id: 'plaza',      name: 'CENTRAL PLAZA',        c0: 5,  r0: 8,  c1: 8,  r1: 9,  color: '#2e2a45', accent: '#35d0ff', open: true },
    { id: 'substation', name: 'THE SUBSTATION',       c0: 11, r0: 9,  c1: 12, r1: 10, color: '#3c2f38', accent: '#f2c33c' },
    { id: 'diner',      name: 'THE OLD DINER',        c0: 2,  r0: 10, c1: 3,  r1: 11, color: '#564a6c', accent: '#ff6b6b' },
    { id: 'bank',       name: 'FROSTBITE BANK',       c0: 8,  r0: 11, c1: 10, r1: 13, color: '#4a4570', accent: '#35d0ff' },
  ],
};
