// debriefs.js - THE DEBRIEFS (v0.76.0). Mark's linear loop: "finish the
// mission, then a cinematic with portraits explaining what just happened
// and what the next mission is, then the shop, then the next mission."
// Each entry is a comms-link cutscene (PC_Cutscene mode 'comms'): big
// portraits facing each other, the speaker lights up. Keyed by the
// mission that just ENDED. stage1 also carries Vic's worked example of
// TECH vs GOLD (Mark: "explain tech and money, Victoria gives an
// example"). Stage 6 and 7 plant the reason the finale climbs the
// tower. No em dashes anywhere in here.
window.PC = window.PC || {};
PC.STORY = PC.STORY || {};

PC.STORY.debriefs = {
  stage1: [
    { comms: ['danny', 'vic'] },
    { music: 'warm' },
    { say: { speaker: 'vic', text: "Grid's live, Big Frank is a puddle, and I am OUT of that cage. Not a bad day, boss." } },
    { say: { speaker: 'danny', text: "One down. Four to go. Vic, where is everybody else?" } },
    { say: { speaker: 'vic', text: "Working on it. The Bloom Tower array can find every pad in the city, but the flood knocked it flat. That's our next job." } },
    { say: { speaker: 'vic', text: "First, your pockets. See that TECH number? Every gem you grabbed became TECH. TECH buys PASSIVES: tougher, faster, healthier. For the whole team." } },
    { say: { speaker: 'vic', text: "And the GOLD? Coins buy GEAR. Your Resizer Beam gets stronger. My Sentry Bot gets stronger. Every hero has their own row." } },
    { say: { speaker: 'vic', text: "Example. 30 TECH buys BIGGER MUSCLES rank one, so everything you have hits harder. 120 gold takes your Resizer Beam up a level. Spend it. Saving it helps nobody." } },
    { say: { speaker: 'danny', text: "Spend first, then Bloom Tower. Got it." } },
    { say: { speaker: 'vic', text: "And boss? Every mission, your gear picks its own upgrades from what drops. No two runs are the same. That's the fun part." } },
    { say: { speaker: 'vic', text: "Then I take point on the tower. My turn to drive." } },
  ],
  stage2: [
    { comms: ['vic', 'danny'] },
    { music: 'hopeful' },
    { say: { speaker: 'vic', text: "Array's up. Every pad in Adventure City just pinged me. Josh's pad is in the park. And it's moving." } },
    { say: { speaker: 'danny', text: "Moving is good. Moving means alive." } },
    { say: { speaker: 'vic', text: "Between you and him is the whole City Zoo. Everything in it ate the junk. The animals are not themselves." } },
    { say: { speaker: 'danny', text: "So I go in gentle." } },
    { say: { speaker: 'vic', text: "You go in UPGRADED. Spend what you earned. Then the park gates." } },
  ],
  stage3: [
    { comms: ['danny', 'josh', 'vic'] },
    { music: 'warm' },
    { say: { speaker: 'josh', text: "That's the Greenhouse settled. The critters'll calm down now the vines stopped feedin' them." } },
    { say: { speaker: 'danny', text: "Two down. Josh, the park's still crawling." } },
    { say: { speaker: 'josh', text: "Then it's my turn. I know every burrow in this park. Let me round 'em up my way." } },
    { say: { speaker: 'vic', text: "Josh takes point next. Gear up first, both of you." } },
  ],
  stage4: [
    { comms: ['josh', 'vic'] },
    { music: 'hopeful' },
    { say: { speaker: 'josh', text: "Park's quiet. Every last critter is back where it belongs. Told you they just needed a calm voice." } },
    { say: { speaker: 'vic', text: "Nice work, Josh. Next ping is Kevin's. Sweet Suburbs, and it's buried under frosting to the rooftops." } },
    { say: { speaker: 'josh', text: "Kevin's tough. He'll be holding a line somewhere." } },
    { say: { speaker: 'vic', text: "Danny drives this one. Upgrade first. Then dig." } },
  ],
  stage5: [
    { comms: ['danny', 'kevin', 'vic'] },
    { music: 'warm' },
    { say: { speaker: 'kevin', text: "Everybody's out of the school, Danny. Every last kid. That's the win that counts." } },
    { say: { speaker: 'danny', text: "Three rescued. Kevin, we've got two more." } },
    { say: { speaker: 'vic', text: "Super Dude Labs went dark an hour ago. Carlos was reading the Ray's pattern from the antenna array when the signal cut." } },
    { say: { speaker: 'kevin', text: "Then that's next. Gear up, team. We roll together." } },
  ],
  stage6: [
    { comms: ['danny', 'carlos', 'vic'] },
    { music: 'tense' },
    { say: { speaker: 'carlos', text: "Danny, listen. The Ray is not making a mess. It's making a BODY. Every district feeds power up one line, and that line ends at Adventure Tower." } },
    { say: { speaker: 'danny', text: "The tower. It went back to where the demo was." } },
    { say: { speaker: 'carlos', text: "It's sitting on the roof, growing. If we cut the power lines, it just grows slower. We have to climb up and shut it down at the top." } },
    { say: { speaker: 'vic', text: "Problem. The flood sealed every street to the tower. The only way to its lobby is UNDER the city. And that's Nayah's turf." } },
    { say: { speaker: 'danny', text: "So we get Nayah. Then we go up. Spend everything, team. This is the home stretch." } },
  ],
  stage7: [
    { comms: ['danny', 'nayah', 'carlos'] },
    { music: 'lift' },
    { say: { speaker: 'nayah', text: "Told you the tunnels were a blast! And guess where they come up. Right inside the Adventure Tower lobby." } },
    { say: { speaker: 'carlos', text: "Seventeen floors between the lobby and the roof. The Ray has grown a mouth and a name for itself. It calls itself CHOMP." } },
    { say: { speaker: 'danny', text: "Then the whole team goes up. Everybody. This is the one I can't do alone." } },
    { say: { speaker: 'nayah', text: "Spend every coin, boss. Nobody's saving for later. There is no later." } },
  ],
};
