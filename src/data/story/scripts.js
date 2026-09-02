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
  { say: { speaker: 'danny', text: "Adventure City, today, we end hunger! Behold… the Nourish-Ray!" } },
  { say: { speaker: 'bloom', text: "Make us a salad, Danny! A big healthy one!" } },
  { action: 'sodatip' },
  { say: { speaker: 'danny', text: "…the code-core. No, no-no-no..." } },
  { action: 'floodburst' },
  { say: { speaker: 'sal', text: "FREE NACHOS! Best day ever!" } },
  { action: 'signallost' },
  { action: 'smashcut', text: 'ONE DAY LATER' },
  { music: 'tense' },
  { scene: 'flood' },
  { chrome: { banner: 'DAY 2: THE JUNK-FOOD FLOOD', live: true,
    ticker: 'DOWNTOWN BURIED IN SNACKS  +++  REPORTS: THE FOOD IS... MOVING?  +++  STAY INDOORS, ADVENTURE CITY' } },
  { say: { speaker: 'anchor', text: "Day two of the Junk-Food Flood. The streets are buried. And folks… viewers are reporting the food is FIGHTING BACK." } },
  { say: { speaker: 'bloom', text: "Danny, it won't stop! It's, it's ALIVE!" } },
  // v0.30.2: Danny answers the PRESS instead of brooding alone in his
  // room (Mark: "it should really be another interview... what are you
  // gonna do? I'm gonna find the team, and we're gonna fix this")
  { scene: 'danny_interview' },
  { chrome: { banner: 'SUPER DUDE DANNY RESPONDS', live: true,
    ticker: 'INVENTOR FACES THE PRESS  +++  CITY ASKS: CAN HE UNDO IT?' } },
  { say: { speaker: 'anchor', text: "Super Dude Danny! The whole city is buried. What are you going to DO?" } },
  { say: { speaker: 'danny', text: "I did this. So I'm going to fix it." } },
  { music: 'lift' },
  { say: { speaker: 'danny', text: "I'm gonna find my team, and we're gonna put this city back together. Every last crumb." } },
  { action: 'portraits6' },
  { say: { speaker: 'danny', text: "Crew, Adventure City needs us. Super Dude… GO!" } },
];

// THE CONFRONTATION (v0.45.0) - played IN THE GAME ENGINE on the roof of
// Adventure Tower the moment Danny steps off the last stair, before the
// final fight. Lines are VERBATIM from docs/VOICE_SCRIPT.md
// "FINALE 'TO THE TOP'" (vo_finale_007 .. 009) - do not rewrite them.
PC.STORY.scripts.confront = [
  { say: { speaker: 'chomp', text: "HELLO friends! I am CHOMP! I make food so NObody is EVER hungry again! Are you hungry? I can HELP!" } },
  { say: { speaker: 'danny', text: "CHOMP, you're hurting the city. You have to stop." } },
  { say: { speaker: 'chomp', text: "But… feeding = helping. More food = more help! I am helping SO much!" } },
];
