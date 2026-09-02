// mission7.js - STAGE 7: "DOWN THE DRAIN" (was "GOING DEEP" - Mark: sounds inappropriate) (STORY_SPEC Map 5 + IV.5).
// The Underground: clear Junction Alpha, restore the Pump Works (3
// guarded valves), SURVIVE THE SURGE across the Catwalk Maze (the new
// 'reach' objective), beat THE GLOOP KING at the Deep Sump, rescue
// NAYAH. Spec cast lines VERBATIM (Nayah's radio intro, boss call,
// rescue line + chant); connective tissue lines are NEW - flagged for
// Mark's review in docs/VOICE_SCRIPT.md like every other draft.
window.PC = window.PC || {};
PC.STORY = PC.STORY || {};
PC.STORY.missions = PC.STORY.missions || {};

PC.STORY.missions.stage7 = {
  id: 'stage7',
  name: 'STAGE 7: DOWN THE DRAIN',
  objectives: [
    { // B1 - clear Junction Chamber Alpha
      type: 'clear', at: 'junction', count: 22, banner: 'CLEAR JUNCTION ALPHA',
      intro: [
        { say: { speaker: 'nayah', text: "Oh, you're coming DOWN here? Into the gross tunnels? Ha! Finally, someone fun. Last one to the bottom's a rotten egg!" } },
        { say: { speaker: 'danny', text: "Nayah, everything down here IS a rotten egg." } },
      ],
      done: [
        { say: { speaker: 'nayah', text: "Junction's clear! Told you this place was a blast. Now the pumps, they've been dead for days and it REEKS." } },
      ],
    },
    { // B2 - restore the Pump Works: crank three valves (hold-to-turn -
      // v0.37.0, Mark: "make the valves a moment")
      type: 'fetch', banner: 'CRANK THE VALVES', hold: 3,
      itemName: 'VALVE OPEN',
      items: [
        { at: 'pumps' },
        { at: 'fungal', line: { speaker: 'nayah', text: "Careful in the mushroom room, they glow, they're gorgeous, do NOT taste one. Asking for a friend." } },
        { at: 'reservoir' },
      ],
      intro: [
        { say: { speaker: 'vic', text: "Pump Works are offline, boss. Three valves across the tunnels - stand on each one and CRANK until the flow catches. The goo will not love the noise." } },
      ],
      done: [
        { say: { speaker: 'nayah', text: "Pumps are singing! Whatever you hear next, that gurgling? That's not the pumps." } },
      ],
    },
    { // B3 - SURVIVE THE SURGE: cross the Catwalk Maze while it rises
      type: 'reach', at: 'catwalk', banner: 'SURVIVE THE SURGE',
      side: 'south',                    // the far side: cross top to bottom
      intro: [
        { say: { speaker: 'vic', text: "Restarting the flow woke the whole system - a sludge surge is coming through the Catwalk Maze. Cross it. Do not stop." } },
        { say: { speaker: 'nayah', text: "RUN THE PLANKS, SUPER DUDE! WOOO!" } },
      ],
      done: [
        { say: { speaker: 'danny', text: "Made it. My shoes did not. RIP, shoes." } },
      ],
    },
    { // B4 - Boss: THE GLOOP KING at the Deep Sump
      type: 'boss', at: 'sump', banner: 'DEFEAT THE GLOOP KING',
      boss: 'gloopKing',
      intro: [
        { say: { speaker: 'nayah', text: "The Gloop King! Ugh, he smells like a forgotten lunchbox. Let's ruin his day!" } },
      ],
      done: [
        { say: { speaker: 'danny', text: "Long live the king. In a sealed jar. Far away from me." } },
      ],
    },
    { // B5 - rescue NAYAH
      type: 'rescue', at: 'sump', hero: 'nayah', banner: 'RESCUE NAYAH',
      script: [
        { say: { speaker: 'nayah', text: "That climb up the Tower? Suicidal. Death-defying. Totally my thing. I'm in." } },
        { say: { speaker: 'danny', text: "That's everyone. Whole team, back together." } },
        { action: 'chant' },
        { say: { speaker: 'vic', text: "Five signals, five rescues, zero disasters left - except the big one. The Tower's waiting, boss." } },
      ],
    },
  ],
};
