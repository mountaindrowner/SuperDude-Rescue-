// mission3.js - BEAT 3: "GONE WILD" (Adventure Park). Danny travels to
// the park to pull Josh out. Cast dialogue from STORY_SPEC IV.2 is
// VERBATIM; the connective beat lines are new and in-voice (Josh gentle
// and unhurried, Danny earnest, Vic dry on the radio now that she's back
// on the grid) - Mark to review those.
// NOTE vs the spec: B3 is spec'd as an ESCORT (a caged animal cart from
// the pond to the Ranger Station). The quest engine has no escort beat
// type yet, so it ships as a HOLD at the pond while Josh's cart loads -
// same story purpose, existing code. Escort is a good later addition.
window.PC = window.PC || {};
PC.STORY = PC.STORY || {};
PC.STORY.missions = PC.STORY.missions || {};

PC.STORY.missions.stage3 = {
  id: 'stage3',
  name: 'STAGE 3: GONE WILD',
  objectives: [
    { // B1 - clear the Park Gates plaza
      type: 'clear', at: 'gates', count: 20, banner: 'CLEAR THE PARK GATES',
      intro: [
        { say: { speaker: 'josh', text: "…easy now... easy... oh, hey. Little help? The park's critters got into the junk and they are not themselves." } },
        { say: { speaker: 'danny', text: "Hang on, Josh, sending the cavalry. Me. I'm the cavalry." } },
      ],
      done: [
        { say: { speaker: 'josh', text: "Gates are clear? Good. Now mind the vines, somethin' in the Greenhouse is feedin' 'em." } },
      ],
    },
    { // B2 - cap the three vine vents. v0.78.0: an ORDERED sequence -
      // the Greenhouse vent feeds the other two, so it has to go first
      // (Vic says so; a player who ignores her gets the buzz)
      type: 'sequence', banner: 'CAP THE VENTS: GREENHOUSE FIRST',
      icon: 'icon_weapon_seeds',
      items: [
        { at: 'green', line: { speaker: 'vic', text: "Greenhouse vent is the big one, boss. Cap it and the other two lose pressure." } },
        { at: 'pond', line: { speaker: 'josh', text: "Pond vent's hissin' out. One more." } },
        { at: 'pens', line: { speaker: 'josh', text: "That's the last vent. Listen... the vines are goin' quiet." } },
      ],
      intro: [
        { say: { speaker: 'danny', text: "Three vents pushing this stuff out. Greenhouse, the pond dock, and the old enclosures. On it." } },
        { say: { speaker: 'vic', text: "Order matters, boss. Greenhouse first or the pressure just moves. Then the pond, then the pens." } },
      ],
      done: [
        { say: { speaker: 'josh', text: "That's the pressure off. Poor things'll settle some now, they were just scared." } },
      ],
    },
    { // B3 - hold the pond while Josh's cart loads (spec: escort)
      type: 'defend', at: 'pond', secs: 50, radius: 200,
      banner: 'HOLD THE POND DOCK',
      intro: [
        { say: { speaker: 'josh', text: "I got a cart of real animals down by the water. Buy me a minute and I'll get 'em to the station." } },
        { say: { speaker: 'danny', text: "Take your time. Nobody's getting past me." } },
      ],
      done: [
        { say: { speaker: 'josh', text: "Cart's away. …Ah. That's the part where the big one shows up, ain't it." } },
      ],
    },
    { // B4 - Boss: THE BROCCOLISK at the Ranger Station
      type: 'boss', at: 'ranger', banner: 'DEFEAT THE BROCCOLISK',
      boss: 'broccolisk',
      intro: [
        { say: { speaker: 'josh', text: "That's a big'un! Don't hurt it more'n you gotta, it didn't ask for this!" } },
        { say: { speaker: 'danny', text: "Gentle. Right. Gentle it is. SUPER DUDE, GO!" } },
      ],
      done: [
        { say: { speaker: 'danny', text: "It's just… a very large vegetable again. Josh, I think it's napping." } },
      ],
    },
    { // B5 - rescue JOSH
      type: 'rescue', at: 'ranger', hero: 'josh', banner: 'RESCUE JOSH',
      script: [
        { say: { speaker: 'josh', text: "Knew you'd come. Poor things are just scared and stuffed full of sugar." } },
        { say: { speaker: 'danny', text: "Can you wrangle the rest?" } },
        { say: { speaker: 'josh', text: "Son, wranglin's all I do." } },
        { action: 'chant' },
        { say: { speaker: 'vic', text: "Two down. Spend what you earned before we roll out, boss." } },
      ],
    },
  ],
};
