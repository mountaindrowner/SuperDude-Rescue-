// map6.js - ADVENTURE TOWER (MAP 6, the finale).
// fabric 'tower' -> PC.TowerLayout. SEVENTEEN FLOORS AND A ROOF (Mark:
// "way more floors") - the map is 42 blocks (21504px) so every band
// stays a full 1024px tall, and the interiors NARROWED to 3584 so a
// seventeen-floor climb is brisk instead of a slog.
// THE ROOF IS NOT A FLOOR (Mark: "the roof is just a large map... one
// realistically sized roof area, and that's with the final boss"): it
// sits above the stack as its own 4608x3072 arena, wider than the shaft
// below it, open sky on all four sides. F17 SKY LOBBY hands off to it.
// The landmark rects here are not authored geometry: the layout engine
// owns the bands and Region adopts its rects, so 'go to F12' targets
// the painted floor.
window.PC = window.PC || {};
PC.STORY = PC.STORY || {};
PC.STORY.maps = PC.STORY.maps || {};

PC.STORY.maps.tower = {
  id: 'tower',
  name: 'ADVENTURE TOWER',
  fabric: 'tower',
  spawnSet: 'mixed',          // everything the city threw at us, climbing
  blocks: 42,
  spawn: { c: 18, r: 41 },     // the lobby doors, bottom band
  landmarks: [
    { id: 'f1',    name: 'MAIN LOBBY',       c0: 17, r0: 40, c1: 23, r1: 41,
      color: '#5a5768', accent: '#f2c33c', open: true, custom: true },
    { id: 'f2',    name: 'SECURITY & MAIL',  c0: 17, r0: 38, c1: 23, r1: 39,
      color: '#5a5768', accent: '#8b88a8', open: true, custom: true },
    { id: 'f3',    name: 'FOOD COURT',       c0: 17, r0: 36, c1: 23, r1: 37,
      color: '#5a5768', accent: '#e2574c', open: true, custom: true },
    { id: 'f4',    name: 'OFFICES',          c0: 17, r0: 34, c1: 23, r1: 35,
      color: '#5a5768', accent: '#8b88a8', open: true, custom: true },
    { id: 'f5',    name: 'MECHANICAL',       c0: 17, r0: 32, c1: 23, r1: 33,
      color: '#5a5768', accent: '#f2c33c', open: true, custom: true },
    { id: 'f6',    name: 'ARCHIVE',          c0: 17, r0: 30, c1: 23, r1: 31,
      color: '#5a5768', accent: '#b08a5a', open: true, custom: true },
    { id: 'f7',    name: 'SKY DECK',         c0: 17, r0: 28, c1: 23, r1: 29,
      color: '#5a5768', accent: '#35d0ff', open: true, custom: true },
    { id: 'f8',    name: 'ATRIUM',           c0: 17, r0: 26, c1: 23, r1: 27,
      color: '#5a5768', accent: '#a8e04a', open: true, custom: true },
    { id: 'f9',    name: 'ACN STUDIO',       c0: 17, r0: 24, c1: 23, r1: 25,
      color: '#5a5768', accent: '#ff9ecb', open: true, custom: true },
    { id: 'f10',   name: 'PLANT ROOM',       c0: 17, r0: 22, c1: 23, r1: 23,
      color: '#5a5768', accent: '#f2c33c', open: true, custom: true },
    { id: 'f11',   name: 'GREENHOUSE',       c0: 17, r0: 20, c1: 23, r1: 21,
      color: '#5a5768', accent: '#a8e04a', open: true, custom: true },
    { id: 'f12',   name: 'SERVER FLOOR',     c0: 17, r0: 18, c1: 23, r1: 19,
      color: '#5a5768', accent: '#2e8fb0', open: true, custom: true },
    { id: 'f13',   name: 'EXECUTIVE',        c0: 17, r0: 16, c1: 23, r1: 17,
      color: '#5a5768', accent: '#c7a071', open: true, custom: true },
    { id: 'f14',   name: 'OBSERVATION',      c0: 17, r0: 14, c1: 23, r1: 15,
      color: '#5a5768', accent: '#35d0ff', open: true, custom: true },
    { id: 'f15',   name: 'ANTENNA PLANT',    c0: 17, r0: 12, c1: 23, r1: 13,
      color: '#5a5768', accent: '#2e8fb0', open: true, custom: true },
    { id: 'f16',   name: 'PENTHOUSE',        c0: 17, r0: 10, c1: 23, r1: 11,
      color: '#5a5768', accent: '#f2c33c', open: true, custom: true },
    { id: 'f17',   name: 'SKY LOBBY',        c0: 17, r0: 8, c1: 23, r1: 9,
      color: '#5a5768', accent: '#8b88a8', open: true, custom: true },
    // THE ROOF is not a band - it is a 4608x3072 arena above the stack
    { id: 'roof',  name: 'ROOFTOP',          c0: 16, r0: 1, c1: 25, r1: 7,
      color: '#5a5768', accent: '#e2574c', open: true, custom: true },
  ],
};
