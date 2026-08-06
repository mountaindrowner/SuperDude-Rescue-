// mission8.js - THE FINALE: TO THE TOP (Adventure Tower).
// SKELETON, v0.45.0. The climb's objective beats and the boss fight are
// not authored yet (Mark: "after that, we'll figure out the boss battle
// mechanics"); what exists is the SHAPE - get to the roof, and the roof
// hands off to PC.Confront, which owns everything from the top stair to
// the first swing. Objective logic deliberately holds while it runs.
window.PC = window.PC || {};
PC.STORY = PC.STORY || {};
PC.STORY.missions = PC.STORY.missions || {};

PC.STORY.missions.finale = {
  id: 'finale',
  map: 'tower',
  title: 'FINALE: TO THE TOP',
  objectives: [
    {
      type: 'arrive', at: 'roof', banner: 'CLIMB TO THE ROOF',
      // seventeen floors of switchback. The crowd is the pressure; the
      // per-floor beats get authored on top of this.
      intro: [
        { say: { speaker: 'vic', text: "Elevator's junk - of course it is. Seventeen floors, boss. On foot." } },
        { say: { speaker: 'kevin', text: "Steady climb, team." } },
      ],
    },
  ],
};
