// quiz_data.js - Bible verses (ESV) for the end-of-day scripture quiz.
//
// One entry per Day 2-7 (Day 1 has only one stage so no end-of-day quiz).
// Each day has three difficulty POOLS (easy / medium / hard); forDay()
// picks one at random from the active difficulty's pool so repeated
// playthroughs stay fresh. Same fill-in-the-blank format throughout -
// one word missing, kid types it in. Hints escalate on wrong answers
// (book/chapter ref -> first letter -> reveal answer with "ask a
// parent" prompt).
//
// `text` uses ___ (three underscores) to mark the blank. Quiz scene
// renders it with a gap and overlays the kid's typed letters.
//
// NOTE (Mark to review): the second entry in several pools was added to
// expand the question bank - all are ESV Genesis 1-2; please vet the
// wording/answers.
window.SDD = window.SDD || {};

(function () {
  var SDD = window.SDD;

  SDD.quiz = {
    'day2': {
      easy: [
        { ref: 'GENESIS 1:1', text: 'In the ___, God created the heavens and the earth.', answer: 'BEGINNING' },
        { ref: 'GENESIS 1:2', text: 'And the Spirit of God was hovering over the face of the ___.', answer: 'WATERS' }
      ],
      medium: [
        { ref: 'GENESIS 1:6', text: 'Let there be an ___ in the midst of the waters.', answer: 'EXPANSE' },
        { ref: 'GENESIS 1:7', text: 'God separated the waters under the expanse from the waters ___ the expanse.', answer: 'ABOVE' }
      ],
      hard: [
        { ref: 'GENESIS 1:8', text: 'And God called the expanse ___. And there was evening and there was morning, the second day.', answer: 'HEAVEN' }
      ]
    },
    'day3': {
      easy: [
        { ref: 'GENESIS 1:11', text: 'Let the earth sprout ___.', answer: 'VEGETATION' },
        { ref: 'GENESIS 1:9', text: 'Let the dry ___ appear.', answer: 'LAND' }
      ],
      medium: [
        { ref: 'GENESIS 1:10', text: 'God called the dry land ___.', answer: 'EARTH' },
        { ref: 'GENESIS 1:10', text: 'The waters that were gathered together he called ___.', answer: 'SEAS' }
      ],
      hard: [
        { ref: 'GENESIS 1:11', text: 'Fruit trees bearing ___ in which is their seed.', answer: 'FRUIT' }
      ]
    },
    'day4': {
      easy: [
        { ref: 'GENESIS 1:16', text: 'God made the two great lights - the greater light to rule the ___.', answer: 'DAY' },
        { ref: 'GENESIS 1:16', text: 'And the lesser light to rule the ___.', answer: 'NIGHT' }
      ],
      medium: [
        { ref: 'GENESIS 1:14', text: 'Let there be ___ in the expanse of the heavens.', answer: 'LIGHTS' },
        { ref: 'GENESIS 1:16', text: 'And God made the stars ___.', answer: 'ALSO' }
      ],
      hard: [
        { ref: 'GENESIS 1:14', text: 'Let them be for ___, and for seasons, and for days and years.', answer: 'SIGNS' }
      ]
    },
    'day5': {
      easy: [
        { ref: 'GENESIS 1:20', text: 'Let the waters swarm with ___ of living creatures.', answer: 'SWARMS' },
        { ref: 'GENESIS 1:20', text: 'And let ___ fly above the earth.', answer: 'BIRDS' }
      ],
      medium: [
        { ref: 'GENESIS 1:21', text: 'And God saw that it was ___.', answer: 'GOOD' },
        { ref: 'GENESIS 1:21', text: 'So God created the great ___ creatures.', answer: 'SEA' }
      ],
      hard: [
        { ref: 'GENESIS 1:22', text: 'Be fruitful and ___ and fill the waters in the seas.', answer: 'MULTIPLY' }
      ]
    },
    'day6': {
      easy: [
        { ref: 'GENESIS 1:27', text: 'So God created man in his own ___.', answer: 'IMAGE' },
        { ref: 'GENESIS 1:27', text: 'Male and ___ he created them.', answer: 'FEMALE' }
      ],
      medium: [
        { ref: 'GENESIS 1:26', text: 'Let us make man in our image, after our ___.', answer: 'LIKENESS' },
        { ref: 'GENESIS 1:28', text: 'Be fruitful and multiply and fill the ___.', answer: 'EARTH' }
      ],
      hard: [
        { ref: 'GENESIS 1:31', text: 'And God saw everything that he had made, and behold, it was very ___.', answer: 'GOOD' }
      ]
    },
    'day7': {
      easy: [
        { ref: 'GENESIS 2:2', text: 'And on the ___ day God finished his work.', answer: 'SEVENTH' },
        { ref: 'GENESIS 2:2', text: 'And he ___ on the seventh day from all his work.', answer: 'RESTED' }
      ],
      medium: [
        { ref: 'GENESIS 2:3', text: 'So God blessed the seventh day and made it ___.', answer: 'HOLY' },
        { ref: 'GENESIS 2:1', text: 'Thus the heavens and the earth were ___.', answer: 'FINISHED' }
      ],
      hard: [
        { ref: 'GENESIS 2:3', text: 'Because on it God rested from all his work that he had done in ___.', answer: 'CREATION' }
      ]
    }
  };

  // Returns a verse object for a given day (2-7) at the active
  // difficulty, picking one at random from that difficulty's pool.
  // Tolerates either a pool array or a single object (back-compat).
  SDD.quiz.forDay = function (day) {
    var key = 'day' + day;
    var entry = SDD.quiz[key];
    if (!entry) return null;
    var diff = SDD.save.curDifficulty();
    var pool = entry[diff] || entry.medium;
    if (Array.isArray(pool)) {
      if (!pool.length) return null;
      return pool[Math.floor(Math.random() * pool.length)];
    }
    return pool;
  };
})();
