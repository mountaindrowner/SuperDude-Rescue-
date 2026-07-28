// scripts.js - STORY dialogue data (docs/STORY_SPEC.md Part IV,
// VERBATIM - the spec is locked; do not rewrite lines here).
window.PC = window.PC || {};
PC.STORY = PC.STORY || {};
PC.STORY.scripts = {};

// IV.0 - INTRO CINEMATIC (plays on New Game / STORY)
PC.STORY.scripts.intro = [
  { scene: 'plaza_sunny' },
  { music: 'hopeful' },
  { say: { speaker: 'pip', text: "It's him! It's SUPER DUDE DANNY!" } },
  { say: { speaker: 'danny', text: "Adventure City — today, we end hunger! Behold… the Nourish-Ray!" } },
  { say: { speaker: 'bloom', text: "Make us a salad, Danny! A big healthy one!" } },
  { action: 'sodatip' },
  { say: { speaker: 'danny', text: "…the code-core. No—no-no-no—" } },
  { action: 'floodburst' },
  { say: { speaker: 'sal', text: "FREE NACHOS! Best day ever!" } },
  { action: 'smashcut', text: 'ONE DAY LATER' },
  { music: 'tense' },
  { scene: 'plaza_flooded' },
  { say: { speaker: 'bloom', text: "Danny, it won't stop! It's — it's ALIVE!" } },
  { say: { speaker: 'danny', text: "I did this." } },
  { music: 'lift' },
  { say: { speaker: 'danny', text: "…but I know who can help me fix it." } },
  { action: 'portraits6' },
  { say: { speaker: 'danny', text: "Crew — Adventure City needs us. Super Dude… GO!" } },
];
