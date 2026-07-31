// map4.js - SUPER DUDE LABS (STORY_SPEC Part II Map 4). COORDS ARE
// PARCEL INDICES like maps 1-3. fabric 'labs' -> PC.LabsLayout:
// Manhattan service roads, warehouse campus, overhead pipes, conveyor
// yards, and the mutated-junk flood pouring out of Central Control.
// `custom` landmarks are painted by the layout engine; vault/control/
// cooling get region slab painters + id roof flavour.
window.PC = window.PC || {};
PC.STORY = PC.STORY || {};
PC.STORY.maps = PC.STORY.maps || {};

PC.STORY.maps.labs = {
  id: 'labs',
  name: 'SUPER DUDE LABS',
  fabric: 'labs',
  spawnSet: 'junk',           // mutated junk food
  blocks: 15,
  spawn: { c: 7, r: 1 },      // just inside the front gate
  landmarks: [
    { id: 'gate',     name: 'LABS FRONT GATE',  c0: 6,  r0: 0,  c1: 7,  r1: 0,
      color: '#3d3b47', accent: '#35d0ff', open: true, custom: true },
    { id: 'reactor',  name: 'REACTOR YARD',     c0: 1,  r0: 3,  c1: 3,  r1: 4,
      color: '#36343f', accent: '#35d0ff', open: true, custom: true },
    { id: 'vault',    name: 'PROTOTYPE VAULT',  c0: 10, r0: 2,  c1: 12, r1: 3,
      color: '#403a5c', accent: '#f2c33c' },
    { id: 'hall',     name: 'ASSEMBLY HALL',    c0: 5,  r0: 7,  c1: 8,  r1: 8,
      color: '#322e42', accent: '#a8e04a', open: true, custom: true },
    { id: 'cooling',  name: 'COOLING TOWERS',   c0: 1,  r0: 9,  c1: 2,  r1: 10,
      color: '#514e6b', accent: '#cfd4e8' },
    { id: 'antenna',  name: 'ANTENNA ARRAY',    c0: 12, r0: 9,  c1: 13, r1: 10,
      color: '#46444e', accent: '#35d0ff', open: true, custom: true },
    { id: 'control',  name: 'CENTRAL CONTROL',  c0: 6,  r0: 12, c1: 8,  r1: 13,
      color: '#45356e', accent: '#b45ce8' },
    { id: 'docks',    name: 'LOADING DOCKS',    c0: 2,  r0: 12, c1: 3,  r1: 12,
      color: '#36343f', accent: '#f2c33c', open: true, custom: true },
  ],
};
