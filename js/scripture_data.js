// scripture_data.js  - PER-STAGE ICB LESSON DATA  (NOT YET LOADED).
//
// Theory-craft for the post-stage scripture lesson scene. This file is
// data-only; it is INTENTIONALLY NOT loaded by index.html yet (Mark:
// "theory craft for now... maybe create the image without launching
// it"). See docs/SCRIPTURE_LESSONS_SPEC.md for the scene design.
//
// When wired up, the level scene's `finish()` calls go('lesson', ...)
// before the overworld for stages listed below, then the lesson scene
// chains on to the regular post-stage flow.
//
// VERSE TEXT = International Children's Bible (ICB), per Mark's brief.
// Verses are paraphrased lightly for kid readability where the ICB
// text was long; canonical reference is preserved.
//
// Lessons fire AFTER these stages (the ones NOT followed by an
// end-of-day Bible quiz):
//   2-1  Sky Above        (Day 2 stage 1 - Day 2 ends after 2-2 quiz)
//   3-1  Mountain Rise    (Day 3 stage 1)
//   4-1  Solar Climb      (Day 4 stage 1)
//   5-1  Wings of Day     (Day 5 stage 1)
//   6-1  Plains to Forest (Day 6 stage 1)
//   8-1  Adventure City   (secret bonus - rescue/teamwork theme)
//
// Day 1-1 already leads into the Day 2 quiz, so no lesson there.
// Day 7-1 leads into the FINALE cinematic, so no lesson there.
// Stages X-2 always lead into the X→X+1 quiz, so no lesson there.
window.SDD = window.SDD || {};

(function () {
  var SDD = window.SDD;

  // Schema per lesson:
  //   day        : Genesis creation day (1-6), or 'rescue' for 8-1
  //   ref        : printed citation, e.g. 'GENESIS 1:6 (ICB)'
  //   verse      : the ICB verse text, displayed in the speech bubble.
  //                Use \n for forced line breaks; auto-wrap handles the
  //                rest. Keep <= ~140 chars per beat for readability.
  //   intro      : Danny's opening line (1-2 short sentences).
  //   reflect    : a single follow-up question with 2-3 answer options.
  //                One option carries `right:true` for the "correct"
  //                or most-encouraging answer; in practice no answer
  //                is "wrong" - every choice gets a gentle affirmation.
  //   close      : Danny's closing line (1 sentence).
  SDD.scripture = {

    // ----- 2-1  Sky Above (after Day 2 stage 1) -----
    '2-1': {
      day: 2,
      ref: 'GENESIS 1:6, 8 (ICB)',
      verse: 'Then God said, "Let there be something to divide the water in two."\nGod named the air "sky."',
      intro: 'WHAT A CLIMB! ON DAY TWO, GOD MADE THE SKY.\nLISTEN TO WHAT THE BIBLE SAYS:',
      reflect: {
        question: 'WHAT DID GOD CALL THE SPACE ABOVE THE WATER?',
        options: [
          { text: 'THE SKY',  right: true },
          { text: 'THE SEA' },
          { text: 'THE SUN' }
        ]
      },
      close: 'EVERY TIME YOU LOOK UP, REMEMBER - GOD MADE THAT!'
    },

    // ----- 3-1  Mountain Rise (after Day 3 stage 1) -----
    '3-1': {
      day: 3,
      ref: 'GENESIS 1:9-10 (ICB)',
      verse: 'Then God said, "Let the water under the sky be gathered together so the dry land will appear."\nGod saw that this was good.',
      intro: 'YOU MADE IT OVER THE MOUNTAINS!\nON DAY THREE, GOD MADE THE DRY LAND.',
      reflect: {
        question: 'WHEN GOD SAW THE LAND, WHAT DID HE SAY?',
        options: [
          { text: 'IT IS GOOD',     right: true },
          { text: 'IT IS HOT' },
          { text: 'IT IS LOUD' }
        ]
      },
      close: 'GOD MADE EVERY MOUNTAIN AND VALLEY - AND HE SAID IT IS GOOD!'
    },

    // ----- 4-1  Solar Climb (after Day 4 stage 1) -----
    '4-1': {
      day: 4,
      ref: 'GENESIS 1:14, 16 (ICB)',
      verse: 'Then God said, "Let there be lights in the sky to separate day from night."\nGod made the brighter light to rule the day.',
      intro: 'WHAT A HOT CLIMB! ON DAY FOUR, GOD MADE THE SUN AND MOON.\nLET\'S READ ABOUT IT:',
      reflect: {
        question: 'THE BRIGHTER LIGHT GOD MADE RULES THE...?',
        options: [
          { text: 'DAY',   right: true },
          { text: 'NIGHT' },
          { text: 'OCEAN' }
        ]
      },
      close: 'EVERY MORNING THE SUN COMES UP BECAUSE GOD PUT IT THERE!'
    },

    // ----- 5-1  Wings of Day (after Day 5 stage 1) -----
    '5-1': {
      day: 5,
      ref: 'GENESIS 1:20-21 (ICB)',
      verse: 'Then God said, "Let birds fly in the air above the earth."\nGod saw that this was good.',
      intro: 'YOU FLEW LIKE A BIRD! ON DAY FIVE, GOD MADE THE BIRDS AND THE FISH.',
      reflect: {
        question: 'WHERE DID GOD TELL THE BIRDS TO FLY?',
        options: [
          { text: 'IN THE AIR ABOVE THE EARTH', right: true },
          { text: 'UNDER THE SEA' },
          { text: 'IN THE FOREST' }
        ]
      },
      close: 'NEXT TIME YOU SEE A BIRD, REMEMBER GOD MADE IT FOR YOU TO ENJOY!'
    },

    // ----- 6-1  Plains to Forest (after Day 6 stage 1) -----
    '6-1': {
      day: 6,
      ref: 'GENESIS 1:24-25 (ICB)',
      verse: 'Then God said, "Let the earth be filled with animals - tame animals, small crawling animals, and wild animals."\nGod saw that this was good.',
      intro: 'WHAT A WILD ADVENTURE! ON DAY SIX, GOD MADE EVERY ANIMAL.',
      reflect: {
        question: 'WHICH OF THESE DID GOD MAKE ON DAY SIX?',
        options: [
          { text: 'ALL OF THEM!',         right: true },
          { text: 'JUST THE LIONS' },
          { text: 'JUST THE BEETLES' }
        ]
      },
      close: 'EVERY ANIMAL YOU\'VE EVER SEEN - GOD THOUGHT OF IT FIRST!'
    },

    // ----- 8-1  Adventure City (secret bonus, rescue theme) -----
    //
    // Adventure City is about rescue + teamwork, so it gets a verse
    // from Ecclesiastes instead of a creation passage. Fits the "rescue
    // team goes after Super Dude Danny" arc.
    '8-1': {
      day: 'rescue',
      ref: 'ECCLESIASTES 4:9-10 (ICB)',
      verse: 'Two people are better than one. They get more done by working together.\nIf one falls down, the other can help him up.',
      intro: 'THE RESCUE TEAM IS ON THE WAY! HERE\'S WHY TEAMWORK MATTERS:',
      reflect: {
        question: 'WHY ARE TWO PEOPLE BETTER THAN ONE?',
        options: [
          { text: 'THEY HELP EACH OTHER',    right: true },
          { text: 'THEY EAT MORE SNACKS' },
          { text: 'THEY ARE LOUDER' }
        ]
      },
      close: 'WHEN A FRIEND FALLS, HELP THEM UP - THAT\'S WHAT HEROES DO!'
    }
  };

  // Helper: returns the lesson entry for a 'd-s' stage key, or null.
  SDD.scriptureFor = function (day, stage) {
    return SDD.scripture[day + '-' + stage] || null;
  };
})();
