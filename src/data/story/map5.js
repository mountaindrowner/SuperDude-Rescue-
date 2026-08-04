// map5.js - THE UNDERGROUND / SEWERS (STORY_SPEC Part II Map 5).
// COORDS ARE PARCEL INDICES straight from the spec's landmark table.
// fabric 'sewer' -> PC.SewerLayout: carved corridors in solid rock on
// the odd block lines, junction chambers, wet stone + moss + sludge.
// Every landmark is an open CAVERN (open:true) dressed by the layout
// engine itself (custom:true) - there are no building slabs down here.
window.PC = window.PC || {};
PC.STORY = PC.STORY || {};
PC.STORY.maps = PC.STORY.maps || {};

PC.STORY.maps.sewers = {
  id: 'sewers',
  name: 'THE UNDERGROUND',
  fabric: 'sewer',
  spawnSet: 'goo',            // spoiled sludge
  blocks: 18,
  spawn: { c: 9, r: 0 },      // dropped in through the Main Grate
  landmarks: [
    { id: 'grate',     name: 'THE MAIN GRATE',      c0: 9,  r0: 0,  c1: 10, r1: 1,
      color: '#31413e', accent: '#35d0ff', open: true, custom: true },
    { id: 'junction',  name: 'JUNCTION CHAMBER ALPHA', c0: 6, r0: 3, c1: 9, r1: 5,
      color: '#31413e', accent: '#7dd97b', open: true, custom: true },
    { id: 'pumps',     name: 'THE PUMP WORKS',      c0: 13, r0: 4,  c1: 16, r1: 7,
      color: '#31413e', accent: '#b5793f', open: true, custom: true },
    { id: 'fungal',    name: 'FUNGAL CAVERN',       c0: 3,  r0: 8,  c1: 6,  r1: 11,
      color: '#2e5c3c', accent: '#a8e04a', open: true, custom: true },
    { id: 'catwalk',   name: 'CATWALK MAZE',        c0: 9,  r0: 8,  c1: 14, r1: 12,
      color: '#14383f', accent: '#6d6a8e', open: true, custom: true },
    { id: 'reservoir', name: 'COLLAPSED RESERVOIR', c0: 15, r0: 12, c1: 17, r1: 14,
      color: '#31413e', accent: '#cfd4e8', open: true, custom: true },
    { id: 'sump',      name: 'THE DEEP SUMP',       c0: 8,  r0: 15, c1: 11, r1: 17,
      color: '#41571e', accent: '#8fb03f', open: true, custom: true },
    { id: 'cistern',   name: 'OLD CISTERN',         c0: 3,  r0: 13, c1: 5,  r1: 15,
      color: '#3d4a41', accent: '#f2c33c', open: true, custom: true },
  ],
};
