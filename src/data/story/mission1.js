// mission1.js - STAGE 1: "THE BIG OOPS" (STORY_SPEC IV.1, dialogue
// VERBATIM). Objective chain B1-B5 on the Central District region.
// TP awards per STORY_SPEC I.2: 10/objective, 50 mission, 25 first clear.
window.PC = window.PC || {};
PC.STORY = PC.STORY || {};
PC.STORY.missions = PC.STORY.missions || {};

// keyed by MISSION id (v0.18 linear spine: a map can host several
// missions; the chain entry names which one to run)
PC.STORY.missions.stage1 = {
  id: 'stage1',
  name: 'STAGE 1: THE BIG OOPS',
  // v0.20.0 - Vic's radio tutorial (Mark: "maybe it starts off with
  // Time Tech Vic giving Super Dude Danny a quick rundown... and
  // through him, the player, a quick rundown of how the game is
  // played"). Plays ONCE per save, before B1. She is still trapped in
  // the Bank at this point, which is why it's radio-only.
  // NOTE: these six lines are NEW (not in the locked spec) - Mark to
  // review; they are also flagged DRAFT in docs/VOICE_SCRIPT.md.
  tutorial: [
    { say: { speaker: 'vic', text: "Okay boss, wrist-pad's live. I can see everything you see, let's get you moving." } },
    { say: { speaker: 'vic', text: "Drag anywhere to walk. Your gear fires on its own, you just pick the fights." } },
    { say: { speaker: 'vic', text: "See those fries? Pop 'em. Everything you beat drops something worth having." } },
    { say: { speaker: 'vic', text: "That gold arrow is your objective. Follow it and you'll never be lost, that's the whole job." } },
    { say: { speaker: 'vic', text: "Between jobs the city's yours. Poke around, grab what you find, spend it at Sal's or the Garage. Then back to the arrow." } },
    { say: { speaker: 'vic', text: "Alright. Adventure City's waiting, boss. Go be Super Dude." } },
  ],
  objectives: [
    { // B1 - clear the swarm at City Hall Plaza
      type: 'clear', at: 'cityhall', count: 22, banner: 'CLEAR CITY HALL PLAZA',
      intro: [
        { say: { speaker: 'danny', text: "Okay, clear a path so folks can get out. Here goes nothing!" } },
      ],
      done: [
        { say: { speaker: 'bloom', text: "Bless you! But the power's out, the doors are all locked tight!" } },
      ],
    },
    { // B2 - fetch the 3 Power Fuses
      type: 'fetch', banner: 'COLLECT THE POWER FUSES',
      itemName: 'POWER FUSE',
      items: [
        { at: 'diner', line: { speaker: 'sal', text: "Fuse? Sure, take it, say, you want a chili dog for the road? …No? Your loss!" } },
        { at: 'plaza' },
        { at: 'substation' },
      ],
      intro: [
        { say: { speaker: 'danny', text: "No power, no rescue. Vic's signal is coming from Frostbite Bank, I need three fuses to reach her." } },
      ],
      done: [
        { say: { speaker: 'vic', text: "Whoever's out there, nice work. Now get the substation online, hero." } },
      ],
    },
    { // B3 - defend the Substation for 60s
      // 60s was unbeatable on the fixed stage-1 loadout (Mark on-device)
      type: 'defend', at: 'substation', secs: 40, radius: 200,
      banner: 'DEFEND THE SUBSTATION',
      intro: [
        { say: { speaker: 'danny', text: "Vic? VIC! Hang on, I'm booting the grid. Just gotta hold this spot!" } },
      ],
      done: [
        { say: { speaker: 'vic', text: "There's the boss I remember. Door's unlocked. But… you've got company." } },
      ],
    },
    { // B4 - Boss: BIG FRANK at Frostbite Bank
      type: 'boss', at: 'bank', banner: 'DEFEAT BIG FRANK',
      intro: [
        { say: { speaker: 'danny', text: "…that is the biggest hot dog I have ever seen. SUPER DUDE, GO!" } },
      ],
      done: [
        { say: { speaker: 'danny', text: "Phew. Extra mustard, hold the apocalypse." } },
      ],
    },
    { // B5 - rescue VIC
      type: 'rescue', at: 'bank', hero: 'victoria', banner: 'RESCUE VIC',
      script: [
        { say: { speaker: 'vic', text: "Took you long enough, boss. Nice explosion, by the way." } },
        { say: { speaker: 'danny', text: "Vic, I messed up huge. The Ray re-coded. I can't fix it alone." } },
        { say: { speaker: 'vic', text: "Then it's a good thing you didn't come alone." } },
        { say: { speaker: 'vic', text: "There. Tech grid's live, that's how we get everyone else back. One down, four to go." } },
        { action: 'chant' },
        { say: { speaker: 'vic', text: "Spend what you earned before we roll out. Upgrades keep us breathing." } },
      ],
    },
  ],
};
PC.STORY.missions.central = PC.STORY.missions.stage1;   // legacy alias
