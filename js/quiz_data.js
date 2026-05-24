// quiz_data.js - Bible verses (ESV) for the end-of-day scripture quiz.
//
// One entry per Day 2-7 (Day 1 has only one stage so no end-of-day quiz).
// Each day has three difficulty variants: easy uses famous + simple
// passages, medium uses less-famous verses from the day's Genesis
// passage, hard targets a specific name or word from that day's
// scripture. Same fill-in-the-blank format throughout - one word missing,
// kid types it in. Hints escalate on wrong answers (book/chapter ref ->
// first letter -> reveal answer with "ask a parent" prompt).
//
// `text` uses ___ (three underscores) to mark the blank. Quiz scene
// renders it with a gap and overlays the kid's typed letters.
window.SDD = window.SDD || {};

(function () {
  var SDD = window.SDD;

  SDD.quiz = {
    'day2': {
      easy: {
        ref: 'GENESIS 1:1',
        text: 'In the ___, God created the heavens and the earth.',
        answer: 'BEGINNING'
      },
      medium: {
        ref: 'GENESIS 1:6',
        text: 'Let there be an ___ in the midst of the waters.',
        answer: 'EXPANSE'
      },
      hard: {
        ref: 'GENESIS 1:8',
        text: 'And God called the expanse ___. And there was evening and there was morning, the second day.',
        answer: 'HEAVEN'
      }
    },
    'day3': {
      easy: {
        ref: 'GENESIS 1:11',
        text: 'Let the earth sprout ___.',
        answer: 'VEGETATION'
      },
      medium: {
        ref: 'GENESIS 1:10',
        text: 'God called the dry land ___.',
        answer: 'EARTH'
      },
      hard: {
        ref: 'GENESIS 1:11',
        text: 'Fruit trees bearing ___ in which is their seed.',
        answer: 'FRUIT'
      }
    },
    'day4': {
      easy: {
        ref: 'GENESIS 1:16',
        text: 'God made the two great lights - the greater light to rule the ___.',
        answer: 'DAY'
      },
      medium: {
        ref: 'GENESIS 1:14',
        text: 'Let there be ___ in the expanse of the heavens.',
        answer: 'LIGHTS'
      },
      hard: {
        ref: 'GENESIS 1:14',
        text: 'Let them be for ___, and for seasons, and for days and years.',
        answer: 'SIGNS'
      }
    },
    'day5': {
      easy: {
        ref: 'GENESIS 1:20',
        text: 'Let the waters swarm with ___ of living creatures.',
        answer: 'SWARMS'
      },
      medium: {
        ref: 'GENESIS 1:21',
        text: 'And God saw that it was ___.',
        answer: 'GOOD'
      },
      hard: {
        ref: 'GENESIS 1:22',
        text: 'Be fruitful and ___ and fill the waters in the seas.',
        answer: 'MULTIPLY'
      }
    },
    'day6': {
      easy: {
        ref: 'GENESIS 1:27',
        text: 'So God created man in his own ___.',
        answer: 'IMAGE'
      },
      medium: {
        ref: 'GENESIS 1:26',
        text: 'Let us make man in our image, after our ___.',
        answer: 'LIKENESS'
      },
      hard: {
        ref: 'GENESIS 1:31',
        text: 'And God saw everything that he had made, and behold, it was very ___.',
        answer: 'GOOD'
      }
    },
    'day7': {
      easy: {
        ref: 'GENESIS 2:2',
        text: 'And on the ___ day God finished his work.',
        answer: 'SEVENTH'
      },
      medium: {
        ref: 'GENESIS 2:3',
        text: 'So God blessed the seventh day and made it ___.',
        answer: 'HOLY'
      },
      hard: {
        ref: 'GENESIS 2:3',
        text: 'Because on it God rested from all his work that he had done in ___.',
        answer: 'CREATION'
      }
    }
  };

  // Returns the verse object for a given day (2-7) at the active
  // difficulty, or null if no quiz applies.
  SDD.quiz.forDay = function (day) {
    var key = 'day' + day;
    var entry = SDD.quiz[key];
    if (!entry) return null;
    var diff = SDD.save.curDifficulty();
    return entry[diff] || entry.medium;
  };
})();
