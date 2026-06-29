// i18n.js — EN/ES string table in Danny's voice (Brief §14).
window.DANNYLAB = window.DANNYLAB || {};

DANNYLAB.STRINGS = {
  en: {
    // UI & flow
    title_topper: 'Super Dude Danny',
    title_logo: 'THE ELEMENT LAB',
    play: 'Play',
    how_to: 'How to Play',
    options: 'Options',
    exit: 'Exit',
    resume: 'Resume',
    restart: 'Restart',
    back: 'Back',
    sound: 'Sound',
    music: 'Music',
    language: 'Language',
    mode: 'Mode',
    endless: 'Endless',
    zen: 'Zen',
    on: 'On',
    off: 'Off',
    paused: 'Paused',
    collection: 'Collection',
    reset_collection: 'Reset Collection',
    confirm: 'You sure, science buddy?',
    yes: 'Yes',
    no: 'No',
    next: 'Next',
    score: 'Score',
    best: 'Best',
    play_again: 'Play Again',
    game_over: 'Aw, beans! It bubbled over!',
    exit_to_select: 'Exit to Game Select',
    howto_1: 'Grab the tweezers and tap to drop an element!',
    howto_2: 'Two of the SAME element FUSE into a new one. WHOA!',
    howto_3: "Just don't let the beaker bubble over!",
    // reaction toasts
    toast_cascade: 'Chain reaction!! WHOA!',
    toast_uranium: 'URANIUM?! You did it!!',
    toast_fission: 'KA-BOOM! Fission power!',
    discovery_intro: 'WHOA! You made {element}!',
    notes_title: "Danny's Lab Notes",
    next_label: 'Next',
    lab_level: 'Lab Level',
    lab_bonus: 'Lab Bonus',
    toast_overload: 'SCIENCE OVERLOAD!!',
    toast_mystery: "Ooh, a mystery sample, what'll it do?!",
    toast_levelup: 'LAB LEVEL UP!',
    loading_header: 'WONDERS OF CREATION',
    loading_sub: 'Warming up the lab...',
  },
  es: {
    title_topper: 'Super Dude Danny',
    title_logo: 'EL LABORATORIO',
    play: 'Jugar',
    how_to: 'Cómo Jugar',
    options: 'Opciones',
    exit: 'Salir',
    resume: 'Continuar',
    restart: 'Reiniciar',
    back: 'Atrás',
    sound: 'Sonido',
    music: 'Música',
    language: 'Idioma',
    mode: 'Modo',
    endless: 'Sin Fin',
    zen: 'Zen',
    on: 'Sí',
    off: 'No',
    paused: 'Pausa',
    collection: 'Colección',
    reset_collection: 'Borrar Colección',
    confirm: '¿Seguro, colega de ciencia?',
    yes: 'Sí',
    no: 'No',
    next: 'Siguiente',
    score: 'Puntos',
    best: 'Mejor',
    play_again: 'Jugar de Nuevo',
    game_over: '¡Rayos! ¡Se derramó!',
    exit_to_select: 'Salir al Menú de Juegos',
    howto_1: '¡Toma las pinzas y toca para soltar un elemento!',
    howto_2: '¡Dos elementos IGUALES se FUSIONAN en uno nuevo! ¡GUAU!',
    howto_3: '¡Solo no dejes que el vaso se derrame!',
    toast_cascade: '¡¡Reacción en cadena!! ¡GUAU!',
    toast_uranium: '¡¿URANIO?! ¡¡Lo lograste!!',
    toast_fission: '¡KA-BUM! ¡Energía de fisión!',
    discovery_intro: '¡GUAU! ¡Creaste {element}!',
    notes_title: 'Notas del Laboratorio de Danny',
    next_label: 'Siguiente',
    lab_level: 'Nivel de Lab',
    lab_bonus: 'Bono de Lab',
    toast_overload: '¡¡SOBRECARGA DE CIENCIA!!',
    toast_mystery: '¡Oh, una muestra misteriosa! ¿Qué hará?',
    toast_levelup: '¡SUBE DE NIVEL DE LAB!',
    loading_header: 'MARAVILLAS DE LA CREACIÓN',
    loading_sub: 'Calentando el laboratorio...',
  },
};

// "Godly science facts" shown on the loading screen between runs. Real,
// awe-inspiring facts about the created world, a few quietly echoing
// Scripture (dust of the heavens, stars beyond counting) but never preachy
// or cheesy. The wonder is meant to carry the reverence on its own.
DANNYLAB.FACTS = [
  { en: 'Every speck of carbon in you was forged in the heart of a star. We are made from the dust of the heavens.',
    es: 'Cada partícula de carbono en ti se forjó en el corazón de una estrella. Estamos hechos del polvo de los cielos.' },
  { en: 'There are more stars in the sky than grains of sand on every shore on Earth.',
    es: 'Hay más estrellas en el cielo que granos de arena en todas las costas de la Tierra.' },
  { en: 'Earth orbits in a narrow band where water can stay liquid. A little nearer or farther, and life could not hold.',
    es: 'La Tierra orbita en una franja estrecha donde el agua puede ser líquida. Un poco más cerca o más lejos, y la vida no resistiría.' },
  { en: 'The iron in your blood and the gold in the ground were both born in the death of stars.',
    es: 'El hierro de tu sangre y el oro de la tierra nacieron en la muerte de las estrellas.' },
  { en: 'Table salt is built from an explosive metal and a poison gas. Joined together, they season your bread.',
    es: 'La sal de mesa se forma de un metal explosivo y un gas venenoso. Unidos, sazonan tu pan.' },
  { en: 'Unwound, the DNA in a single one of your cells would stretch about two meters long.',
    es: 'Desenrollado, el ADN de una sola de tus células mediría unos dos metros de largo.' },
  { en: 'Water is one of the few things that floats when it freezes. If ice sank, lakes would freeze solid and the life below would end.',
    es: 'El agua es de las pocas cosas que flotan al congelarse. Si el hielo se hundiera, los lagos se congelarían del todo y la vida bajo ellos terminaría.' },
  { en: 'Every snowflake has six sides, and in all of history no two have ever been found alike.',
    es: 'Cada copo de nieve tiene seis lados, y en toda la historia jamás se han hallado dos iguales.' },
  { en: 'Light leaves the Sun and crosses ninety-three million miles to warm your face in about eight minutes.',
    es: 'La luz sale del Sol y cruza ciento cincuenta millones de kilómetros para calentar tu rostro en unos ocho minutos.' },
  { en: 'Your heart will beat around three billion times in a lifetime, and never once stops to rest.',
    es: 'Tu corazón latirá unas tres mil millones de veces en la vida, y nunca se detiene a descansar.' },
  { en: 'Honeybees build their combs in perfect hexagons, the shape that stores the most honey with the least wax.',
    es: 'Las abejas construyen sus panales en hexágonos perfectos, la forma que guarda más miel con menos cera.' },
  { en: 'Trees breathe in what we breathe out, and give back the very air we need.',
    es: 'Los árboles respiran lo que nosotros exhalamos, y nos devuelven el aire que necesitamos.' },
  { en: 'A teaspoon of a neutron star would weigh billions of tons here on Earth.',
    es: 'Una cucharadita de una estrella de neutrones pesaría miles de millones de toneladas aquí en la Tierra.' },
  { en: 'Your body is made of about thirty-seven trillion cells, and nearly every one carries the full plan to build you.',
    es: 'Tu cuerpo se compone de unos treinta y siete billones de células, y casi cada una lleva el plano completo para construirte.' },
  { en: 'The same carbon sits in pencil lead and in diamond. One element, two forms, set apart only by how its atoms are arranged.',
    es: 'El mismo carbono está en la mina del lápiz y en el diamante. Un elemento, dos formas, distinguidas solo por cómo se ordenan sus átomos.' },
  { en: 'Light from some galaxies has traveled billions of years to reach the sky above you tonight.',
    es: 'La luz de algunas galaxias ha viajado miles de millones de años para llegar al cielo sobre ti esta noche.' },
];

// A random fact (string) in the given language, avoiding an immediate repeat.
DANNYLAB._lastFact = -1;
DANNYLAB.randomFact = function (lang) {
  var n = DANNYLAB.FACTS.length;
  if (n === 0) return '';
  var i = Math.floor(Math.random() * n);
  if (n > 1 && i === DANNYLAB._lastFact) i = (i + 1) % n;
  DANNYLAB._lastFact = i;
  var f = DANNYLAB.FACTS[i];
  return (lang === 'es') ? f.es : f.en;
};

// Element names + "Danny's Lab Notes" fun facts (Brief §14).
DANNYLAB.ELEMENTS = {
  H:  { en: 'Hydrogen', es: 'Hidrógeno',
        fact_en: 'The lightest element in the universe, and stars are made mostly of it!',
        fact_es: '¡El elemento más ligero del universo, y las estrellas están hechas casi todas de él!' },
  He: { en: 'Helium', es: 'Helio',
        fact_en: "Lighter than air, so it makes balloons float!",
        fact_es: '¡Más ligero que el aire, por eso flotan los globos!' },
  C:  { en: 'Carbon', es: 'Carbono',
        fact_en: "It's in pencils AND diamonds, the same element in different shapes!",
        fact_es: '¡Está en los lápices Y en los diamantes, el mismo elemento en distintas formas!' },
  O:  { en: 'Oxygen', es: 'Oxígeno',
        fact_en: 'We breathe it to live, and fire needs it to burn!',
        fact_es: '¡Lo respiramos para vivir, y el fuego lo necesita para arder!' },
  Ne: { en: 'Neon', es: 'Neón',
        fact_en: 'It glows bright colors in signs and lights!',
        fact_es: '¡Brilla con colores vivos en letreros y luces!' },
  Na: { en: 'Sodium', es: 'Sodio',
        fact_en: 'Drop it in water and it fizzes and pops!',
        fact_es: '¡Échalo al agua y burbujea y chisporrotea!' },
  Fe: { en: 'Iron', es: 'Hierro',
        fact_en: 'It is magnetic, and it makes our blood red!',
        fact_es: '¡Es magnético, y hace que nuestra sangre sea roja!' },
  Au: { en: 'Gold', es: 'Oro',
        fact_en: 'Shiny treasure that never rusts or fades!',
        fact_es: '¡Un tesoro brillante que nunca se oxida ni se apaga!' },
  U:  { en: 'Uranium', es: 'Uranio',
        fact_en: 'One of the heaviest natural elements, and its atoms can split to release huge energy!',
        fact_es: '¡Uno de los elementos naturales más pesados, y sus átomos pueden dividirse y liberar muchísima energía!' },
};

// t(key, lang, params) — looks up a string and fills {placeholders}.
DANNYLAB.t = function (key, lang, params) {
  lang = (DANNYLAB.STRINGS[lang] ? lang : 'en');
  var s = DANNYLAB.STRINGS[lang][key];
  if (s == null) s = DANNYLAB.STRINGS.en[key];
  if (s == null) return key;
  if (params) {
    for (var p in params) s = s.replace('{' + p + '}', params[p]);
  }
  return s;
};

// Localized element name for a symbol.
DANNYLAB.elementName = function (sym, lang) {
  var e = DANNYLAB.ELEMENTS[sym];
  if (!e) return sym;
  return e[lang] || e.en;
};
DANNYLAB.elementFact = function (sym, lang) {
  var e = DANNYLAB.ELEMENTS[sym];
  if (!e) return '';
  return (lang === 'es') ? e.fact_es : e.fact_en;
};
