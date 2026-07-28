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
  { base: 'drone', requires: 'shoes', name: 'GIZMOTRON ARMADA',
    desc: 'Two turbo gizmos with hot triggers!',
    apply: function (w) {
      w.name = 'GIZMOTRON ARMADA';
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
  { base: 'beam', requires: 'duplicator', name: 'COMET BARRAGE',
    desc: 'Triple lances, rapid recharge!',
    apply: function (w) {
      w.name = 'COMET BARRAGE'; w.beams = 3; w.cd = 5.5; w.dmg = 110;
    } },
  { base: 'lasso', requires: 'servo', name: 'CYCLONE TITAN',
    desc: 'A colossal dizzying ring!',
    apply: function (w) {
      w.name = 'CYCLONE TITAN';
      w.rMin = 60; w.rMax = 110; w.dmg = 26; w.tickCd = 0.3; w.stun = true;
    } },
  // ---- slice 2 evolutions ----
  { base: 'ketchup', requires: 'servo', name: 'CONDIMENT STORM',
    desc: 'Shells rain across the screen!',
    apply: function (w) {
      w.name = 'CONDIMENT STORM';
      w.shells = 3; w.dmg = 44; w.burstR = 56; w.cd = 2.2; w.puddleDmg = 8;
    } },
  { base: 'microwave', requires: 'lens', name: 'PLASMA CAROUSEL',
    desc: 'Twin beams spin at full power!',
    apply: function (w) {
      w.name = 'PLASMA CAROUSEL';
      w.beams = 2; w.dmg = 20; w.length = 170; w.degS = 150; w.halfArc = 0.22;
    } },
  { base: 'fridge', requires: 'coat', name: 'BUNKER FRIDGE',
    desc: 'Four icy walls guard you!',
    apply: function (w) {
      w.name = 'BUNKER FRIDGE';
      w.orbit = true; w.dmg = 22; w.length = 66; w.kb = 2.6;
    } },
  // ---- slice 3 evolutions ----
  { base: 'cutter', requires: 'duplicator', name: 'PIZZA STORM',
    desc: 'Saws criss-cross the field!',
    apply: function (w) { w.name = 'PIZZA STORM'; w.cutters = 3; w.dmg = 30; w.cd = 1.4; w.out = 0.8; } },
  { base: 'zap', requires: 'lens', name: 'TESLA TOASTER',
    desc: 'The arc chains through the crowd!',
    apply: function (w) { w.name = 'TESLA TOASTER'; w.jumps = 8; w.dmg = 28; w.cd = 0.9; } },
  { base: 'grease', requires: 'shoes', name: 'INFERNO TRAIL',
    desc: 'A wide blazing wake!',
    apply: function (w) { w.name = 'INFERNO TRAIL'; w.dmg = 14; w.segR = 34; w.life = 2.8; w.slow = true; } },
  { base: 'jaw', requires: 'servo', name: 'WRECKING JAWBREAKER',
    desc: 'A giant gobstopper caroms everywhere!',
    apply: function (w) { w.name = 'WRECKING JAWBREAKER'; w.dmg = 38; w.bounces = 10; w.scale = 3.2; w.cd = 2; } },
  { base: 'sprinkle', requires: 'duplicator', name: 'SPRINKLE STORM',
    desc: 'A seeking cloud of sprinkles!',
    apply: function (w) { w.name = 'SPRINKLE STORM'; w.count = 12; w.dmg = 16; w.seek = 6; w.cd = 1.6; } },
  { base: 'skillet', requires: 'battery', name: 'FRYING FURY',
    desc: 'A giant pan smash with a shockwave!',
    apply: function (w) { w.name = 'FRYING FURY'; w.dmg = 44; w.reach = 75; w.halfArc = Math.PI; w.both = false; w.cd = 0.9; } },
  { base: 'vortex', requires: 'servo', name: 'SINGULARITY BLENDER',
    desc: 'A huge pull that grinds the pile!',
    apply: function (w) { w.name = 'SINGULARITY BLENDER'; w.radius = 150; w.pull = 340; w.dur = 2.2; w.grind = true; w.dmg = 14; w.cd = 3.6; } },
  { base: 'espresso', requires: 'lens', name: 'RISTRETTO RAILGUN',
    desc: 'Instant charge, endless pierce!',
    apply: function (w) { w.name = 'RISTRETTO RAILGUN'; w.instant = true; w.baseDmg = 55; w.maxBonus = 30; } },
  { base: 'pineapple', requires: 'leftovers', name: 'FORTRESS FRUIT',
    desc: 'A mighty aura that heals on payback!',
    apply: function (w) { w.name = 'FORTRESS FRUIT'; w.spikes = 16; w.dmg = 48; w.heal = 6; } },
  // ---- hero-rework evolutions (Tasks 6-8) ----
  { base: 'sentrybot', requires: 'duplicator', name: 'SWARM PROTOCOL',
    desc: 'Twin turbo bots + rapid deploys!',
    apply: function (w) {
      w.name = 'SWARM PROTOCOL';
      w.bots = 2; w.dmg = 22; w.burstCd = 0.55; w.cd = 7; w.life = 16;
    } },
  { base: 'comet', requires: 'duplicator', name: 'METEOR SHOWER',
    desc: 'The sky itself rains meteors!',
    apply: function (w) {
      w.name = 'METEOR SHOWER';
      w.comets = 4; w.dmg = 70; w.cd = 1.8; w.impactR = 50;
    } },
  { base: 'haymaker', requires: 'fan', name: 'KNOCKOUT QUEEN',
    desc: 'An unstoppable healing flurry!',
    apply: function (w) {
      w.name = 'KNOCKOUT QUEEN';
      w.cd = 0.16; w.dmg = 24; w.lifesteal = 3; w.fists = 3; w.reach = 70;
    } },
];
