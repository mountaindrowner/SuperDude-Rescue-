// chain.js - STORY-4: the LINEAR campaign spine (Mark v0.18: "since it's
// a linear story you're given the character and then given the mission").
// NO hero select in story mode - each stage assigns its hero. Assignment
// follows the rescue rotation: you play each stage as the hero rescued in
// the one before (Danny opens; Vic, freshly rescued, takes Stage 2; ...).
// Stage names / maps / rescues are verbatim STORY_SPEC Part II + IV.
// `map` keys into PC.STORY.maps; stages whose map isn't built yet render
// as SIGNAL SCRAMBLED (coming soon) on the mission board once revealed.
window.PC = window.PC || {};
PC.STORY = PC.STORY || {};

PC.STORY.CHAIN = [
  { id: 'stage1', map: 'central', hero: 'danny',
    title: 'STAGE 1: THE BIG OOPS', place: 'CENTRAL DISTRICT',
    rescued: 'VIC',
    blurb: "Vic's signal is coming from Frostbite Bank. Clear a path, boot the grid, get her out." },
  { id: 'stage2', map: 'park', hero: 'victoria',
    title: 'STAGE 2: GONE WILD', place: 'ADVENTURE PARK & CITY ZOO',
    rescued: 'JOSH',
    blurb: "The park's critters got into the junk and they are NOT themselves. Josh needs backup." },
  { id: 'stage3', map: 'suburbs', hero: 'josh',
    title: 'STAGE 3: SUGAR RUSH', place: 'SWEET SUBURBS',
    rescued: 'KEVIN',
    blurb: 'Frosting to the rooftops and folks are trapped. Kevin is holding the line somewhere inside.' },
  { id: 'stage4', map: 'labs', hero: 'kevin',
    title: 'STAGE 4: SIGNAL LOST', place: 'SUPER DUDE LABS',
    rescued: 'CARLOS',
    blurb: "Carlos has been reading the Ray's pattern from the antenna array. It's not random." },
  { id: 'stage5', map: 'sewers', hero: 'carlos',
    title: 'STAGE 5: GOING DEEP', place: 'THE UNDERGROUND',
    rescued: 'NAYAH',
    blurb: 'Down into the gross tunnels. Nayah is already having fun down there. Somehow.' },
  { id: 'finale', map: 'tower', hero: 'nayah',
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
