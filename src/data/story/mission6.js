// mission6.js - BEAT 6: "SIGNAL LOST" (Super Dude Labs). Danny fights
// through the junk-flooded campus, recovers the Ray blueprints, and
// pulls Carlos out - who then delivers THE REVEAL at the Antenna
// Array: the Ray climbed Adventure Tower and grew into something that
// thinks. Cast dialogue from STORY_SPEC IV.4 is VERBATIM (Carlos's
// radio intro + the whole reveal exchange); connective lines are new
// and in-voice (Carlos calm/cosmic, Danny earnest, Vic dry) - Mark to
// review those.
// NOTE vs the spec: the reveal cutscene ships as an in-world scripted
// beat ({action:'reveal'} -> quest.towerReveal: dim, tower silhouette,
// signal arc, flash) rather than a separate cinematic scene - same
// story purpose, existing dialogue engine.
window.PC = window.PC || {};
PC.STORY = PC.STORY || {};
PC.STORY.missions = PC.STORY.missions || {};

PC.STORY.missions.stage6 = {
  id: 'stage6',
  name: 'STAGE 6: SIGNAL LOST',
  objectives: [
    { // B1 - clear the front gate
      type: 'clear', at: 'gate', count: 24, banner: 'CLEAR THE FRONT GATE',
      intro: [
        { say: { speaker: 'carlos', text: "I've been watching the pattern from the array… it's not random, Danny. The Ray wants something. Come find me — I'll show you the big picture." } },
        { say: { speaker: 'danny', text: "My own labs. It mutated MY OWN LABS. Okay. Badge's still in my other coat, so we're doing this the loud way." } },
      ],
      done: [
        { say: { speaker: 'carlos', text: "Gate's clear. The blueprints for the Ray are still in the Prototype Vault — you'll want those for what comes next." } },
      ],
    },
    { // B2 - recover the Ray blueprints from the Vault
      type: 'fetch', banner: 'RECOVER THE RAY BLUEPRINTS',
      itemName: 'BLUEPRINT PAGE', icon: 'icon_passive_lens',
      items: [
        { at: 'vault', dx: -160, dy: -10,
          line: { speaker: 'carlos', text: "Page one. Power intake. See how big that number is? Keep moving." } },
        { at: 'vault', dx: 150, dy: 30,
          line: { speaker: 'danny', text: "Page two. I really thought 'unlimited portions' sounded friendlier on paper." } },
        { at: 'vault', dx: -10, dy: 120,
          line: { speaker: 'carlos', text: "That's the full set. Now — the reactor's cooking itself. Buy the vent team some time." } },
      ],
      intro: [
        { say: { speaker: 'danny', text: "Vault's sealed tight and frosted in... junk. Three pages, then I'm out." } },
      ],
      done: [
        { say: { speaker: 'vic', text: "Blueprints secured, boss. Reactor Yard's next — it went orange on my board two minutes ago." } },
      ],
    },
    { // B3 - hold the Reactor Yard while it vents
      type: 'defend', at: 'reactor', secs: 70, radius: 230,
      banner: 'STABILIZE THE REACTOR',
      intro: [
        { say: { speaker: 'carlos', text: "The junk keeps feeding on the reactor's charge. Hold the containment ring while it vents — seventy seconds." } },
        { say: { speaker: 'danny', text: "Standing on the glowing circle. Every childhood dream, wrong reasons." } },
      ],
      done: [
        { say: { speaker: 'carlos', text: "Reactor's stable. Danny… something very large just powered on in Central Control. It has a COIN SLOT." } },
      ],
    },
    { // B4 - Boss: the VENDING BEHEMOTH at Central Control
      type: 'boss', at: 'control', banner: 'DEFEAT THE VENDING BEHEMOTH',
      boss: 'vendingBehemoth',
      intro: [
        { say: { speaker: 'danny', text: "That's the break-room vending machine. It ate the OTHER machines. It's still blinking EXACT CHANGE ONLY." } },
        { say: { speaker: 'carlos', text: "Then let's give it its refund. Watch the dispensing tray!" } },
      ],
      done: [
        { say: { speaker: 'danny', text: "Out of order. Permanently. …I'm keeping the quarter." } },
      ],
    },
    { // B5 - rescue CARLOS at the Antenna Array + THE REVEAL
      type: 'rescue', at: 'antenna', hero: 'carlos', banner: 'FIND CARLOS AT THE ARRAY',
      script: [
        { say: { speaker: 'carlos', text: "Right on time. Come look at the big picture." } },
        { say: { speaker: 'carlos', text: "There. It climbed to the top of Adventure Tower and… grew. It's not a ray anymore. It's thinking." } },
        { action: 'reveal' },
        { say: { speaker: 'danny', text: "It's alive. Like everything else I broke." } },
        { say: { speaker: 'carlos', text: "Then we don't break it. We reach it." } },
        { action: 'chant' },
        { say: { speaker: 'vic', text: "Four rescued. One signal left on the board, boss — it's coming from UNDER the city." } },
      ],
    },
  ],
};
