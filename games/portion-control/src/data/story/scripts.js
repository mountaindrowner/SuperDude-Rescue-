// scripts.js - STORY dialogue data (docs/STORY_SPEC.md Part IV). The
// spec's character lines are VERBATIM - do not rewrite them. v0.18.2
// reframes the intro as an ACN NEWSCAST on a tube TV (Mark's direction);
// the anchor's linking lines are new connective tissue, everything the
// cast says is straight from IV.0.
window.PC = window.PC || {};
PC.STORY = PC.STORY || {};
PC.STORY.scripts = {};

// IV.0 - INTRO CINEMATIC (plays on New Game / STORY)
PC.STORY.scripts.intro = [
  { scene: 'off' },
  { action: 'tvon' },
  { music: 'hopeful' },
  { scene: 'news_desk' },
  { chrome: { banner: 'BREAKING: THE END OF HUNGER?', live: true,
    ticker: "SUPER DUDE DANNY UNVEILS THE NOURISH-RAY TODAY  +++  MAYOR BLOOM: 'A HISTORIC DAY FOR ADVENTURE CITY'" } },
  { say: { speaker: 'anchor', text: "Good afternoon, Adventure City! We are LIVE at the tower plaza, where Super Dude Danny says he is about to end hunger. Forever!" } },
  { scene: 'demo' },
  { chrome: { banner: 'LIVE: THE NOURISH-RAY DEMO', live: true,
    ticker: 'CROWDS GATHER AT THE PLAZA  +++  FREE SALAD FOR EVERYONE, SAYS INVENTOR' } },
  { say: { speaker: 'pip', text: "It's him! It's SUPER DUDE DANNY!" } },
  { say: { speaker: 'danny', text: "Adventure City — today, we end hunger! Behold… the Nourish-Ray!" } },
  { say: { speaker: 'bloom', text: "Make us a salad, Danny! A big healthy one!" } },
  { action: 'sodatip' },
  { say: { speaker: 'danny', text: "…the code-core. No—no-no-no—" } },
  { action: 'floodburst' },
  { say: { speaker: 'sal', text: "FREE NACHOS! Best day ever!" } },
  { action: 'signallost' },
  { action: 'smashcut', text: 'ONE DAY LATER' },
  { music: 'tense' },
  { scene: 'flood' },
  { chrome: { banner: 'DAY 2: THE JUNK-FOOD FLOOD', live: true,
    ticker: 'DOWNTOWN BURIED IN SNACKS  +++  REPORTS: THE FOOD IS... MOVING?  +++  STAY INDOORS, ADVENTURE CITY' } },
  { say: { speaker: 'anchor', text: "Day two of the Junk-Food Flood. The streets are buried. And folks… viewers are reporting the food is FIGHTING BACK." } },
  { say: { speaker: 'bloom', text: "Danny, it won't stop! It's — it's ALIVE!" } },
  { scene: 'danny_room' },
  { say: { speaker: 'danny', text: "I did this." } },
  { music: 'lift' },
  { say: { speaker: 'danny', text: "…but I know who can help me fix it." } },
  { action: 'portraits6' },
  { say: { speaker: 'danny', text: "Crew — Adventure City needs us. Super Dude… GO!" } },
];
