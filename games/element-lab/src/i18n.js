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
    collection: 'Cards',
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
    howto_1: 'Drag to aim the tweezers, lift your finger to drop!',
    howto_2: 'Two of the SAME element FUSE into a new one. WHOA!',
    howto_3: "Just don't let the beaker bubble over!",
    howto_4: 'A rainbow MYSTERY SAMPLE shows up now and then. Anything can happen!',
    howto_5: 'Merges fill the LAB CHARGE bar. Level up for a bigger score bonus!',
    howto_6: 'Playing earns CARDS! Collect every card to find Super Dude Danny.',
    // reaction toasts
    toast_cascade: 'Chain reaction!! WHOA!',
    toast_uranium: 'URANIUM?! You did it!!',
    toast_fission: 'KA-BOOM! Fission power!',
    toast_flash: 'GOLDEN FLASH! Small elements dissolved!',
    discovery_intro: 'WHOA! You made {element}!',
    notes_title: "Danny's Lab Notes",
    next_label: 'Next',
    lab_level: 'Lab Level',
    lab_bonus: 'Lab Bonus',
    toast_overload: 'SCIENCE OVERLOAD!!',
    toast_mystery: "Ooh, a mystery sample, what'll it do?!",
    toast_levelup: 'LAB LEVEL UP!',
    toast_newcard: 'NEW CARD: {name}!',
    go_combo: 'Best Combo',
    go_discovered: 'DISCOVERED THIS RUN',
    go_newcards: 'NEW CARDS EARNED!',
    go_next: 'NEXT CARD',
    daily: 'Daily',
    daily_tag: 'Daily Experiment: same lab for everyone today!',
    go_dailybest: 'Daily Best',
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
    collection: 'Cartas',
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
    howto_1: '¡Arrastra para apuntar las pinzas y suelta el dedo para dejar caer!',
    howto_2: '¡Dos elementos IGUALES se FUSIONAN en uno nuevo! ¡GUAU!',
    howto_3: '¡Solo no dejes que el vaso se derrame!',
    howto_4: '¡A veces aparece una MUESTRA MISTERIOSA arcoíris. ¡Todo puede pasar!',
    howto_5: '¡Las fusiones llenan la barra de CARGA DEL LAB. Sube de nivel para más puntos!',
    howto_6: '¡Jugar te da CARTAS! Colecciónalas todas para encontrar a Super Dude Danny.',
    toast_cascade: '¡¡Reacción en cadena!! ¡GUAU!',
    toast_uranium: '¡¿URANIO?! ¡¡Lo lograste!!',
    toast_fission: '¡KA-BUM! ¡Energía de fisión!',
    toast_flash: '¡DESTELLO DORADO! ¡Elementos pequeños disueltos!',
    discovery_intro: '¡GUAU! ¡Creaste {element}!',
    notes_title: 'Notas del Laboratorio de Danny',
    next_label: 'Siguiente',
    lab_level: 'Nivel de Lab',
    lab_bonus: 'Bono de Lab',
    toast_overload: '¡¡SOBRECARGA DE CIENCIA!!',
    toast_mystery: '¡Oh, una muestra misteriosa! ¿Qué hará?',
    toast_levelup: '¡SUBE DE NIVEL DE LAB!',
    toast_newcard: '¡CARTA NUEVA: {name}!',
    go_combo: 'Mejor Combo',
    go_discovered: 'DESCUBIERTOS',
    go_newcards: '¡CARTAS NUEVAS!',
    go_next: 'PRÓXIMA CARTA',
    daily: 'Diario',
    daily_tag: '¡Experimento Diario: el mismo lab para todos hoy!',
    go_dailybest: 'Mejor Diario',
    loading_header: 'MARAVILLAS DE LA CREACIÓN',
    loading_sub: 'Calentando el laboratorio...',
  },
};

// "Wonders of creation" facts shown on the loading screen between runs. Real,
// accurate science framed with bright, joyful awe -- each one lands a warm,
// tasteful connection back to God the Maker. Upbeat and cool, never gloomy or
// preachy. Several quietly echo Scripture (stars named, knit together).
DANNYLAB.FACTS = [
  { en: 'Every speck of carbon in you was born in the glow of a star. God built you from the light of the heavens!',
    es: 'Cada partícula de carbono en ti nació en el brillo de una estrella. ¡Dios te formó con la luz de los cielos!' },
  { en: 'There are more stars blazing in the sky than grains of sand on every beach, and God knows each one by name.',
    es: 'Hay más estrellas ardiendo en el cielo que granos de arena en todas las playas, y Dios conoce a cada una por su nombre.' },
  { en: 'Earth spins in the perfect spot for water to flow and life to thrive, placed just right by the One who made it.',
    es: 'La Tierra gira en el lugar perfecto para que el agua fluya y la vida florezca, puesta justo a la medida por Aquel que la creó.' },
  { en: 'The iron in your blood and the gold in the ground were spun inside ancient stars. God scattered treasure across the whole universe!',
    es: 'El hierro de tu sangre y el oro de la tierra se forjaron dentro de estrellas antiguas. ¡Dios esparció tesoros por todo el universo!' },
  { en: 'Salt is a fiery metal joined to an invisible gas, two wild things God combined just to flavor your food.',
    es: 'La sal es un metal ardiente unido a un gas invisible, dos cosas salvajes que Dios combinó solo para dar sabor a tu comida.' },
  { en: 'The DNA coiled inside one tiny cell would stretch as long as your arm, a secret code God wrote to spell out you.',
    es: 'El ADN enrollado en una sola célula diminuta se estiraría tan largo como tu brazo, un código secreto que Dios escribió para formarte.' },
  { en: 'Water does something almost nothing else can: it floats when it freezes, so life keeps going under the ice God designed.',
    es: 'El agua hace algo que casi nada más puede: flota al congelarse, para que la vida siga bajo el hielo que Dios diseñó.' },
  { en: 'Every snowflake has six glittering sides, and no two have ever matched. God never makes the same one twice!',
    es: 'Cada copo de nieve tiene seis lados brillantes, y jamás dos han sido iguales. ¡Dios nunca hace el mismo dos veces!' },
  { en: 'Sunlight races 93 million miles and lands on your face in eight minutes, a warm hello sent straight from God\'s star.',
    es: 'La luz del sol recorre 150 millones de kilómetros y llega a tu rostro en ocho minutos, un cálido saludo enviado desde la estrella de Dios.' },
  { en: 'Your heart will beat about three billion times and never ask for a break, a faithful drum God set going before you were born.',
    es: 'Tu corazón latirá unas tres mil millones de veces sin pedir descanso, un tambor fiel que Dios echó a andar antes de que nacieras.' },
  { en: 'Honeybees build their honeycomb in flawless hexagons, the strongest shape there is. God gave tiny bees the math!',
    es: 'Las abejas construyen su panal en hexágonos perfectos, la forma más resistente que existe. ¡Dios les dio las matemáticas a las pequeñas abejas!' },
  { en: 'Trees breathe in what we breathe out and hand back fresh air, a perfect trade God designed so the whole world shares one breath.',
    es: 'Los árboles respiran lo que exhalamos y nos devuelven aire fresco, un intercambio perfecto que Dios diseñó para que el mundo comparta un mismo aliento.' },
  { en: 'A single teaspoon from a neutron star would weigh billions of tons. God packs unimaginable power into the smallest space!',
    es: 'Una sola cucharadita de una estrella de neutrones pesaría miles de millones de toneladas. ¡Dios encierra un poder inimaginable en el espacio más pequeño!' },
  { en: 'You are made of around 37 trillion cells, and every one holds the full blueprint of you, knit together by God.',
    es: 'Estás hecho de unos 37 billones de células, y cada una guarda el plano completo de ti, tejido por Dios.' },
  { en: 'The very same carbon makes both pencil lead and sparkling diamond. God can take the plainest thing and make it shine!',
    es: 'El mismo carbono forma la mina del lápiz y el diamante reluciente. ¡Dios puede tomar lo más sencillo y hacerlo brillar!' },
  { en: 'Light from far-off galaxies has traveled billions of years just to twinkle over you tonight, a sky God lit for you to enjoy.',
    es: 'La luz de galaxias lejanas ha viajado miles de millones de años solo para titilar sobre ti esta noche, un cielo que Dios encendió para tu deleite.' },
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
        fact_en: 'The lightest element there is, and stars are made mostly of it!',
        fact_es: '¡El elemento más ligero que existe, y las estrellas están hechas casi todas de él!' },
  He: { en: 'Helium', es: 'Helio',
        fact_en: 'Lighter than air, so balloons float! It was first found in the Sun.',
        fact_es: '¡Más ligero que el aire, por eso flotan los globos! Se halló primero en el Sol.' },
  C:  { en: 'Carbon', es: 'Carbono',
        fact_en: 'The same carbon makes soft pencil lead AND hard diamond!',
        fact_es: '¡El mismo carbono forma la mina blanda del lápiz Y el diamante duro!' },
  O:  { en: 'Oxygen', es: 'Oxígeno',
        fact_en: 'We breathe it to live, and fire needs it to burn!',
        fact_es: '¡Lo respiramos para vivir, y el fuego lo necesita para arder!' },
  Ne: { en: 'Neon', es: 'Neón',
        fact_en: 'It glows fiery orange-red when electrified. That is how signs shine!',
        fact_es: '¡Brilla naranja-rojizo al electrificarse. Así brillan los letreros!' },
  Na: { en: 'Sodium', es: 'Sodio',
        fact_en: 'A soft metal that fizzes and pops in water! With chlorine, it makes salt.',
        fact_es: '¡Un metal blando que burbujea y chisporrotea en agua! Con cloro, hace la sal.' },
  Fe: { en: 'Iron', es: 'Hierro',
        fact_en: 'It turns our blood red, and Earth\'s iron core makes our compass point!',
        fact_es: '¡Enrojece nuestra sangre, y el núcleo de hierro de la Tierra guía la brújula!' },
  Au: { en: 'Gold', es: 'Oro',
        fact_en: 'So tough it never rusts or fades, and it was forged in exploding stars!',
        fact_es: '¡Tan resistente que nunca se oxida ni se apaga, y se forjó en estrellas que estallaron!' },
  U:  { en: 'Uranium', es: 'Uranio',
        fact_en: 'One of the heaviest natural atoms. Split one and it unleashes huge energy!',
        fact_es: '¡Uno de los átomos naturales más pesados. Divídelo y libera muchísima energía!' },
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
