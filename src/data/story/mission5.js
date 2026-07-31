// mission5.js - BEAT 5: "SUGAR RUSH" (Sweet Suburbs). Danny digs the
// neighborhood out of the dessert flood and pulls Captain Kevin out.
// Cast dialogue from STORY_SPEC IV.3 is VERBATIM (Kevin's intro radio
// call, Pip at the school, the whole rescue exchange); the connective
// beat lines are new and in-voice (Kevin warm command, Pip thrilled,
// Danny earnest, Vic dry on the radio) - Mark to review those.
// NOTE vs the spec: B2 is spec'd as "free 3 trapped townsfolk from the
// School (mini-fights)". It ships as a 3-item FETCH at the School with
// per-item spreads (quest.spawnItems dx/dy) and guarded pickups - same
// story purpose, existing code.
window.PC = window.PC || {};
PC.STORY = PC.STORY || {};
PC.STORY.missions = PC.STORY.missions || {};

PC.STORY.missions.stage5 = {
  id: 'stage5',
  name: 'STAGE 5: SUGAR RUSH',
  objectives: [
    { // B1 - clear the entry cul-de-sac
      type: 'clear', at: 'welcome', count: 22, banner: 'CLEAR THE CUL-DE-SAC',
      intro: [
        { say: { speaker: 'kevin', text: "Danny, the whole neighborhood's snowed in — frosting to the rooftops. Folks are trapped. Let's get 'em out, together." } },
        { say: { speaker: 'danny', text: "Frosting to the— Kevin, there is a HOUSE with a CHERRY on it. Okay. Digging in." } },
      ],
      done: [
        { say: { speaker: 'kevin', text: "Good start. The school's the worst of it — the kids got stuck inside when the frosting came down." } },
      ],
    },
    { // B2 - free the three kids trapped at the School
      type: 'fetch', banner: 'FREE THE TRAPPED KIDS',
      itemName: 'TRAPPED KID', icon: 'pickup_cage_1',
      items: [
        { at: 'school', dx: -170, dy: -10,
          line: { speaker: 'pip', text: "I KNEW you'd come, Super Dude!" } },
        { at: 'school', dx: 150, dy: 30,
          line: { speaker: 'danny', text: "Stick close, Pip. Heroes look out for each other." } },
        { at: 'school', dx: -20, dy: 120,
          line: { speaker: 'kevin', text: "That's every kid accounted for. Well done, Danny." } },
      ],
      intro: [
        { say: { speaker: 'danny', text: "Three kids still inside. Doors are frosted shut. Not for long." } },
      ],
      done: [
        { say: { speaker: 'kevin', text: "Folks are sheltering at the Rec Center — and the sugar horde is sniffing around the ballfield." } },
      ],
    },
    { // B3 - defend the Rec Center shelter
      type: 'defend', at: 'rec', secs: 60, radius: 210,
      banner: 'DEFEND THE REC CENTER',
      intro: [
        { say: { speaker: 'kevin', text: "Hold the ballfield, Danny. Sixty seconds and the shelter doors are sealed." } },
        { say: { speaker: 'danny', text: "Batter up." } },
      ],
      done: [
        { say: { speaker: 'kevin', text: "Doors sealed. …You hear that? Something big just left the Bakery. Something with candles." } },
      ],
    },
    { // B4 - Boss: the LAYER CAKE COLOSSUS at the Bakery
      type: 'boss', at: 'bakery', banner: 'DEFEAT THE LAYER CAKE COLOSSUS',
      boss: 'cakeColossus',
      intro: [
        { say: { speaker: 'danny', text: "That is the biggest birthday cake I have ever seen. And it is FURIOUS." } },
        { say: { speaker: 'kevin', text: "Watch the frosting fists! I'm right behind you — GO!" } },
      ],
      done: [
        { say: { speaker: 'danny', text: "Aaand it's a sheet cake. Somebody bring forks. NOT for eating! Evidence forks!" } },
      ],
    },
    { // B5 - rescue KEVIN
      type: 'rescue', at: 'bakery', hero: 'kevin', banner: 'RESCUE KEVIN',
      script: [
        { say: { speaker: 'kevin', text: "You called a crew instead of going it alone. That's the smartest thing you've done all week." } },
        { say: { speaker: 'danny', text: "Take point, Captain?" } },
        { say: { speaker: 'kevin', text: "Team — on me." } },
        { action: 'chant' },
        { say: { speaker: 'vic', text: "Three rescued, boss. The Labs went dark an hour ago — Carlos is next." } },
      ],
    },
  ],
};
