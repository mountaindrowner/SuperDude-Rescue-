// Decoration layout for Adventure City (Day 8-1). Maintained via the
// in-game DECOR EDITOR (menu -> DECOR EDITOR). Each entry is one
// instance of a Layer-1 decoration painted in world coordinates.
//
// Schema:
//   { kind, x, y, variant?, len?, seed? }
//
//   kind     - one of: lamp, bench, sign, crosswalk, vine, cafe,
//              hangingSign, branch (see DECOR_KINDS in scenes.js)
//   x, y     - world coordinates (the level is 5760 px wide,
//              224 px tall; the road sidewalk top is around y=172)
//   variant  - kind-specific (sign: 0-3 directional/transit/ped/arrow;
//              hangingSign: 0-4 color; vine: 0 plain / 1 blossom;
//              branch: 0-3 angle/direction)
//   len      - vine length in pixels (default 18)
//   seed     - RNG seed for kinds with internal randomness (cafe,
//              branch). Stable across runs so the layout doesn't
//              shuffle every reload.
//
// Empty array means no decorations (Mark stripped them in v0.67;
// rebuild via the editor).
window.SDD = window.SDD || {};
SDD.cyberDecor = SDD.cyberDecor || {};
SDD.cyberDecor['8-1'] = [];
