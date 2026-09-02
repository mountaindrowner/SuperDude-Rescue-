// mission4.js - BEAT 4: "CRITTER PATROL" - the park SPOTLIGHT mission.
// You play as JOSH the beat after rescuing him, on the map you just
// fought through (Mark's shape: rescue, then a mission with that
// character). Same three-objective shape as Vic's spotlight so the
// rhythm between rescue missions and spotlights stays legible: no boss,
// no rescue, quicker. All dialogue is NEW and in-voice - Mark to review.
window.PC = window.PC || {};
PC.STORY = PC.STORY || {};
PC.STORY.missions = PC.STORY.missions || {};

PC.STORY.missions.stage4 = {
  id: 'stage4',
  name: 'STAGE 4: CRITTER PATROL',
  objectives: [
    { // B1 - the amphitheater is thick with the stuff
      type: 'clear', at: 'amphi', count: 18,
      banner: 'CLEAR THE AMPHITHEATER',
      intro: [
        { say: { speaker: 'josh', text: "Old amphitheater's packed tight. Let's thin it out gentle-like, no need to be rude about it." } },
      ],
      done: [
        { say: { speaker: 'josh', text: "There now. See? They scatter soon as they got somewhere to go." } },
      ],
    },
    { // B2 - round up the strays
      type: 'fetch', banner: 'ROUND UP THE STRAYS',
      itemName: 'CRITTER CRATE',
      items: [
        { at: 'aviary', line: { speaker: 'josh', text: "Easy, little fella. Nobody's eatin' anybody today." } },
        { at: 'carousel' },
        { at: 'pens' },
      ],
      intro: [
        { say: { speaker: 'josh', text: "Three crates got loose in the scramble. Aviary, the carousel, and the old pens. Real animals in 'em, mind the corners." } },
      ],
      done: [
        { say: { speaker: 'vic', text: "That's all three on my board. Josh, you've got a whole zoo in a wagon." } },
        { say: { speaker: 'josh', text: "Wagon's the easy part. Wait'll you meet the goose." } },
      ],
    },
    { // B3 - settle the pens
      type: 'defend', at: 'ranger', secs: 45, radius: 200,
      banner: 'SETTLE THE PENS',
      intro: [
        { say: { speaker: 'josh', text: "Last bit. Stand with me while they settle, critters spook if the fightin' gets close." } },
      ],
      done: [
        { say: { speaker: 'josh', text: "Sleepin' like lambs. Well. The lambs are. The ostrich has opinions." } },
        { say: { speaker: 'danny', text: "Josh, Vic's got a signal from the suburbs. Kevin's out there under all that frosting." } },
        { say: { speaker: 'josh', text: "Then let's go get the Captain. I'll drive." } },
      ],
    },
  ],
};
