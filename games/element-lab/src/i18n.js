// i18n.js — EN/ES string table in Danny's voice (Brief §14).
window.DANNYLAB = window.DANNYLAB || {};

DANNYLAB.STRINGS = {
  en: {
    // UI & flow
    title_topper: "Super Dude Danny's",
    title_logo: 'ELEMENT LAB',
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
  },
  es: {
    title_topper: 'Super Dude Danny',
    title_logo: 'LABORATORIO',
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
  },
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
