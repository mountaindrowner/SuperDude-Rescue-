// evolutions.js - WP-EVOLUTIONS recipes (PHASE2 Track B, data-driven).
// A weapon at MAX level + owning the partner passive = a golden EVOLVE
// card is guaranteed at the next level-up. apply() mutates the live
// weapon; base weapons stay intact for players who never evolve.
window.PC = window.PC || {};

PC.EVOLUTIONS = [
  { base: 'resizer', requires: 'lens', name: 'MEGA RESIZER',
    desc: 'Colossal triple bolts that pierce everything!',
    apply: function (w) {
      w.name = 'MEGA RESIZER';
      w.dmg = 40; w.cd = 0.35; w.amount = 3; w.pierce = 3; w.speed = 640;
    } },
  { base: 'whisk', requires: 'servo', name: 'TORNADO WHISK',
    desc: 'A roaring storm of giant whisks!',
    apply: function (w) {
      w.name = 'TORNADO WHISK';
      w.dmg = 34; w.count = 3; w.radius = 95; w.degS = 300;
    } },
  { base: 'blaster', requires: 'battery', name: 'BUFFET BLASTER',
    desc: 'A full-circle blast of snacks!',
    apply: function (w) {
      w.name = 'BUFFET BLASTER';
      w.pellets = 12; w.dmg = 16; w.cd = 0.9; w.ring = true;
    } },
  { base: 'salt', requires: 'magnet', name: 'SEASON STORM',
    desc: 'A huge ring of super seasoning!',
    apply: function (w) {
      w.name = 'SEASON STORM';
      w.dmg = 24; w.radius = 95; w.cd = 1.5;
    } },
  { base: 'freeze', requires: 'fan', name: 'BLIZZARD RAY',
    desc: 'Triple bolts of deep winter!',
    apply: function (w) {
      w.name = 'BLIZZARD RAY';
      w.dmg = 16; w.bolts = 3; w.cd = 0.9; w.slowMs = 3800;
    } },
  { base: 'drone', requires: 'shoes', name: 'WINGMAN SQUAD',
    desc: 'Two turbo drones with hot triggers!',
    apply: function (w) {
      w.name = 'WINGMAN SQUAD';
      w.count = 2; w.dmg = 20; w.fireCd = 0.3; w.range = 300;
    } },
  // ---- signature evolutions (arsenal expansion slice 1) ----
  { base: 'sentry', requires: 'duplicator', name: 'SENTRY SWARM',
    desc: 'Rapid-fire turrets that never quit!',
    apply: function (w) {
      w.name = 'SENTRY SWARM';
      w.cd = 3; w.life = 24; w.dmg = 22; w.fireCd = 0.3; w.maxTurrets = 3;
    } },
  { base: 'seeds', requires: 'slowcooker', name: 'JUNGLE BLOOM',
    desc: 'Giant patches blanket the field!',
    apply: function (w) {
      w.name = 'JUNGLE BLOOM';
      w.dmg = 18; w.radius = 60; w.life = 8; w.maxPatches = 8; w.cd = 1.4;
    } },
  { base: 'strike', requires: 'battery', name: 'CARPET RESCUE',
    desc: 'A full-screen bombing run!',
    apply: function (w) {
      w.name = 'CARPET RESCUE';
      w.count = 10; w.dmg = 50; w.radius = 46; w.cd = 4;
    } },
  { base: 'beam', requires: 'duplicator', name: 'METEOR SHOWER',
    desc: 'A barrage of piercing comets!',
    apply: function (w) {
      w.name = 'METEOR SHOWER';
      w.beams = 4; w.dmg = 24; w.cd = 0.8;
    } },
  { base: 'lasso', requires: 'servo', name: 'CYCLONE TITAN',
    desc: 'A colossal dizzying ring!',
    apply: function (w) {
      w.name = 'CYCLONE TITAN';
      w.rMin = 60; w.rMax = 110; w.dmg = 26; w.tickCd = 0.3; w.stun = true;
    } },
];
