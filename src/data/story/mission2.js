// mission2.js - BEAT 2: "LOUD AND CLEAR" - the first SPOTLIGHT mission
// (v0.19.0). Same map as Stage 1, new character: you play as VIC right
// after rescuing her, which is Mark's "then you have a mission with
// Victoria" beat. Deliberately shorter and different-shaped than Stage
// 1 - no boss, no rescue, three objectives - so back-to-back missions on
// one map don't feel like a repeat. Dialogue is new (not spec'd) and
// written in-voice: Vic dry/precise, Danny on the radio, Bloom cameo.
window.PC = window.PC || {};
PC.STORY = PC.STORY || {};
PC.STORY.missions = PC.STORY.missions || {};

PC.STORY.missions.stage2 = {
  id: 'stage2',
  name: 'STAGE 2: LOUD AND CLEAR',
  objectives: [
    { // B1 - clear the approach to Bloom Tower
      type: 'clear', at: 'bloomtower', count: 16,
      banner: 'CLEAR THE TOWER APPROACH',
      intro: [
        { say: { speaker: 'vic', text: "Bloom Tower has the only array tall enough to hear anything. Naturally, it's buried." } },
      ],
      done: [
        { say: { speaker: 'bloom', text: "Is that you, Vic? Oh, careful, my whole beautiful tower is absolutely CRAWLING!" } },
        { say: { speaker: 'vic', text: "Noted, Mayor. Stay away from the windows." } },
      ],
    },
    { // B2 - salvage two signal boosters
      type: 'fetch', banner: 'SALVAGE THE BOOSTERS',
      itemName: 'SIGNAL BOOSTER',
      items: [
        { at: 'cityhall' },
        { at: 'garage', line: { speaker: 'danny', text: "Vic, that's my garage. Please don't reorganize it again." } },
      ],
      intro: [
        { say: { speaker: 'vic', text: "The array needs two boosters. City Hall has one. Your garage has the other, boss, assuming the fries haven't eaten it." } },
      ],
      done: [
        { say: { speaker: 'vic', text: "Both boosters. Let's find out who else is still breathing out there." } },
      ],
    },
    { // B3 - hold the tower while she triangulates
      type: 'defend', at: 'bloomtower', secs: 45, radius: 200,
      banner: 'HOLD THE ARRAY',
      intro: [
        { say: { speaker: 'vic', text: "Triangulating. Forty-five seconds of standing perfectly still, which is historically when everything shows up." } },
      ],
      done: [
        { say: { speaker: 'vic', text: "Got them. Five signals, five separate disasters." } },
        { say: { speaker: 'danny', text: "Give me the closest one." } },
        { say: { speaker: 'vic', text: "Adventure Park. That's Josh, and he's talking to the wildlife. Boss, he sounds calm." } },
        { say: { speaker: 'danny', text: "That's just Josh. Gear up, we're going to the zoo." } },
      ],
    },
  ],
};
