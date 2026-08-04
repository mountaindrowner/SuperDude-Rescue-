// chain.js - STORY-4/5: the LINEAR campaign spine (Mark: "it's a
// pretty straightforward a,b,c,d,e,f,g... eight story beats. There's no
// branching ways. There's just extra things you can do on the way").
// NO hero select anywhere in story mode - each beat ASSIGNS its hero.
//
// SHAPE (Mark's "then you have a mission with Victoria, then maybe back
// to Danny"): Danny is the through-line - he runs the rescue missions on
// each new map. Right after a rescue, the freshly-rescued hero gets ONE
// spotlight mission on that same map, so the player learns "new
// character, city I already know" while the novelty is hot. The back
// half accelerates straight to the Tower.
//   1 Danny  / Central  -> rescue VIC
//   2 VIC    / Central     (spotlight - same map, new character)
//   3 Danny  / Park     -> rescue JOSH
//   4 JOSH   / Park        (spotlight)
//   5 Danny  / Suburbs  -> rescue KEVIN
//   6 Danny  / Labs     -> rescue CARLOS
//   7 Danny  / Sewers   -> rescue NAYAH
//   8 Danny  / Tower       FINALE (full team)
// Adding or cutting a beat is ONE row here - nothing else knows the
// order. `map` keys PC.STORY.maps; `id` keys PC.STORY.missions. A beat
// whose map/mission isn't built yet shows as SIGNAL SCRAMBLED.
window.PC = window.PC || {};
PC.STORY = PC.STORY || {};

PC.STORY.CHAIN = [
  { id: 'stage1', map: 'central', hero: 'danny',
    title: 'STAGE 1: THE BIG OOPS', place: 'CENTRAL DISTRICT',
    rescued: 'VIC',
    blurb: "Vic's signal is coming from Frostbite Bank. Clear a path, boot the grid, get her out." },

  { id: 'stage2', map: 'central', hero: 'victoria',
    title: 'STAGE 2: LOUD AND CLEAR', place: 'CENTRAL DISTRICT',
    rescued: null,
    blurb: "Vic takes point. Get the Bloom Tower array back up and find where the rest of the crew went down." },

  { id: 'stage3', map: 'park', hero: 'danny',
    title: 'STAGE 3: GONE WILD', place: 'ADVENTURE PARK & CITY ZOO',
    rescued: 'JOSH',
    blurb: "The park's critters got into the junk and they are NOT themselves. Josh needs backup." },

  { id: 'stage4', map: 'park', hero: 'josh',
    title: 'STAGE 4: CRITTER PATROL', place: 'ADVENTURE PARK & CITY ZOO',
    rescued: null,
    blurb: "Josh's turn. Round up what's left before the whole zoo goes sideways." },

  { id: 'stage5', map: 'suburbs', hero: 'danny',
    title: 'STAGE 5: SUGAR RUSH', place: 'SWEET SUBURBS',
    rescued: 'KEVIN',
    blurb: 'Frosting to the rooftops and folks are trapped. Kevin is holding the line somewhere inside.' },

  { id: 'stage6', map: 'labs', hero: 'danny',
    title: 'STAGE 6: SIGNAL LOST', place: 'SUPER DUDE LABS',
    rescued: 'CARLOS',
    blurb: "Carlos has been reading the Ray's pattern from the antenna array. It's not random." },

  { id: 'stage7', map: 'sewers', hero: 'danny',
    title: 'STAGE 7: DOWN THE DRAIN', place: 'THE UNDERGROUND',
    rescued: 'NAYAH',
    blurb: 'Down into the gross tunnels. Nayah is already having fun down there. Somehow.' },

  { id: 'finale', map: 'tower', hero: 'danny',
    title: 'FINALE: TO THE TOP', place: 'ADVENTURE TOWER',
    rescued: null,
    blurb: "The Ray climbed to the top of Adventure Tower and... grew. It's thinking. Reach it." },
];

PC.STORY.chainById = function (id) {
  for (var i = 0; i < PC.STORY.CHAIN.length; i++) {
    if (PC.STORY.CHAIN[i].id === id) return PC.STORY.CHAIN[i];
  }
  return null;
};

PC.STORY.chainIndex = function (id) {
  for (var i = 0; i < PC.STORY.CHAIN.length; i++) {
    if (PC.STORY.CHAIN[i].id === id) return i;
  }
  return -1;
};

// the next beat after `id`, or null at the end of the campaign
PC.STORY.nextInChain = function (id) {
  var i = PC.STORY.chainIndex(id);
  return (i >= 0 && i + 1 < PC.STORY.CHAIN.length) ? PC.STORY.CHAIN[i + 1] : null;
};

// is a beat actually playable (its map AND mission data both exist)?
PC.STORY.beatBuilt = function (entry) {
  return !!(entry && PC.STORY.maps && PC.STORY.maps[entry.map] &&
            PC.STORY.missions && PC.STORY.missions[entry.id]);
};
