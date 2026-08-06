// map6.js - ADVENTURE TOWER (MAP 6, the finale).
// fabric 'tower' -> PC.TowerLayout. Unlike the other five maps, the
// landmark rects here are NOT authored geometry - the layout engine
// owns the nine floor bands and hands them back. These entries exist so
// the quest system can target a floor by id ('f3', 'roof', ...); the
// engine overwrites their rects in Region so paint and targeting agree.
// c0/r0/c1/r1 mirror the bands anyway (BAND 1024 = 2 blocks tall) so
// anything reading the def raw still lands on the right floor.
window.PC = window.PC || {};
PC.STORY = PC.STORY || {};
PC.STORY.maps = PC.STORY.maps || {};

PC.STORY.maps.tower = {
  id: 'tower',
  name: 'ADVENTURE TOWER',
  fabric: 'tower',
  spawnSet: 'mixed',          // everything the city threw at us, climbing
  blocks: 18,
  spawn: { c: 4, r: 17 },     // the lobby doors, bottom band
  landmarks: [
    { id: 'f1',   name: 'MAIN LOBBY',   c0: 4, r0: 16, c1: 13, r1: 17,
      color: '#5a5768', accent: '#f2c33c', open: true, custom: true },
    { id: 'f2',   name: 'OFFICES',      c0: 4, r0: 14, c1: 13, r1: 15,
      color: '#5a5768', accent: '#8b88a8', open: true, custom: true },
    { id: 'f3',   name: 'FOOD COURT',   c0: 4, r0: 12, c1: 13, r1: 13,
      color: '#5a5768', accent: '#e2574c', open: true, custom: true },
    { id: 'f4',   name: 'MECHANICAL',   c0: 4, r0: 10, c1: 13, r1: 11,
      color: '#5a5768', accent: '#f2c33c', open: true, custom: true },
    { id: 'f5',   name: 'SKY DECK',     c0: 4, r0: 8,  c1: 13, r1: 9,
      color: '#5a5768', accent: '#35d0ff', open: true, custom: true },
    { id: 'f6',   name: 'ATRIUM',       c0: 4, r0: 6,  c1: 13, r1: 7,
      color: '#5a5768', accent: '#a8e04a', open: true, custom: true },
    { id: 'f7',   name: 'SERVER FLOOR', c0: 4, r0: 4,  c1: 13, r1: 5,
      color: '#5a5768', accent: '#2e8fb0', open: true, custom: true },
    { id: 'f8',   name: 'OBSERVATION',  c0: 4, r0: 2,  c1: 13, r1: 3,
      color: '#5a5768', accent: '#35d0ff', open: true, custom: true },
    { id: 'roof', name: 'ROOFTOP',      c0: 3, r0: 0,  c1: 14, r1: 1,
      color: '#5a5768', accent: '#e2574c', open: true, custom: true },
  ],
};
