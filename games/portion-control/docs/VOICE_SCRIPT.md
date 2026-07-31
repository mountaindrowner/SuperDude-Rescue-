# PORTION CONTROL — VOICE-OVER MASTER SCRIPT

> Every spoken line in the game, compiled for ElevenLabs (or any VO
> pipeline). **Generated** by `tools/build_vo_script.py` from the
> shipped source files + `STORY_SPEC.md` Part IV + `STORY_CAST_ADDENDUM.md`,
> so the text here is byte-identical to what the game displays.
> Machine-readable twin: **`docs/voice_lines.csv`** (one row per line,
> ready for batch generation).

**Totals: 122 lines, 7,617 characters of dialogue.**

| Status | Lines | Meaning |
|---|---|---|
| SHIPPED | 65 | In the game right now — recording these makes the playable slice fully voiced. |
| WRITTEN | 51 | Locked dialogue for scenes not built yet (Stages 2-5, finale, flavor). Safe to record — the text will not change. |
| DRAFT | 6 | Claude-drafted tutorial lines, **not yet approved by Mark**. Do not record until signed off. |

| Character | Lines | Characters of text |
|---|---|---|
| SUPER DUDE DANNY | 34 | 1,785 |
| TIMETECH VIC | 22 | 1,544 |
| GALAXY GUIDE CARLOS | 15 | 1,181 |
| CAPTAIN KEVIN | 14 | 966 |
| NATRIX NAYAH | 11 | 656 |
| ZOOKEEPER JOSH | 8 | 538 |
| MAYOR ADA BLOOM | 7 | 315 |
| ACN NEWS ANCHOR | 2 | 242 |
| CHOMP | 5 | 224 |
| SAL | 2 | 104 |
| PIP | 2 | 62 |

---

## 1. CASTING SHEET — voice design prompts

Paste the prompt into ElevenLabs **Voice Design** (or use it to pick a
library voice). Settings are starting points — the note in each row says
what the character needs most.

### SUPER DUDE DANNY  `danny`

*Earnest, hopeful, dorky-brave hometown boy-genius. Guilt turns into growth. Leads the chant.*

**Voice prompt:** American male, mid-late 20s. Bright, warm, slightly nasal everyman-nerd. Enthusiastic and a little breathless when excited; genuinely small and quiet when ashamed. NOT a deep gravelly superhero voice.

**Settings:** Stability 0.35 (he swings from giddy to gutted), Similarity 0.75, Style 0.4

### TIMETECH VIC  `vic`

*Dry, precise, techy; secretly warm. Ex-botanist. Teases Danny as "boss."*

**Voice prompt:** American female, 30s. Low-warm, deadpan, unhurried. Every line sounds like she already solved the problem. Affection hides under sarcasm.

**Settings:** Stability 0.6 (deadpan needs steadiness), Similarity 0.8, Style 0.25

### ZOOKEEPER JOSH  `josh`

*Gentle rugged wrangler. Calls the food "critters." Soothing even in chaos. Ex-mapmaker (badly).*

**Voice prompt:** American male, 40s, soft Southern/Texan drawl. Low, unhurried, kind. The voice you use on a spooked animal — never raises it, even mid-disaster.

**Settings:** Stability 0.7, Similarity 0.8, Style 0.3

### CAPTAIN KEVIN  `kevin`

*Warm authoritative leader. Ex-Officer Kevin, super-soldier program. "Team — on me."*

**Voice prompt:** American male, 40s. Deep, steady, grounded. Command without shouting — the calm voice on the radio that makes everyone breathe.

**Settings:** Stability 0.7, Similarity 0.8, Style 0.2

### GALAXY GUIDE CARLOS  `carlos`

*Calm, cosmic, big-picture; a touch dreamy. Ex-photographer, ex-astronaut.*

**Voice prompt:** Male, 30s-40s, warm Latino-American accent, measured and gentle. Speaks like he is describing something far away and beautiful. Unhurried pauses.

**Settings:** Stability 0.65, Similarity 0.8, Style 0.35

### NATRIX NAYAH  `nayah`

*Fearless adrenaline; jokes in danger. Nature expert + daredevil. Former mayoral candidate.*

**Voice prompt:** American female, late 20s. Fast, bright, laughing mid-sentence. Grins audibly. Zero fear, maximum mischief.

**Settings:** Stability 0.3 (let her bounce), Similarity 0.75, Style 0.6

### CHOMP  `chomp`

*The Ray A.I.: cheerful, childlike, SINCERE. Genuinely believes it is helping. NEVER cruel or menacing.*

**Voice prompt:** Synthetic child-like voice, gender-neutral, bright and eager, like a toy robot that adores you. Innocent enthusiasm. The sadness at the end must land as a small confused child, not a villain.

**Settings:** Stability 0.4, Similarity 0.7, Style 0.5. Post-process with light robotic ring-mod/bitcrush in-engine, NOT in the voice itself.

### MAYOR ADA BLOOM  `bloom`

*Frazzled comic panic. The mayor who beat Nayah in the election.*

**Voice prompt:** American female, 50s. Bright, over-articulated politician warmth that keeps cracking into flustered panic. Comic, never grating.

**Settings:** Stability 0.3, Similarity 0.75, Style 0.6

### SAL  `sal`

*Oblivious hot-dog vendor. Comic relief. Cheerfully misses the apocalypse.*

**Voice prompt:** American male, 50s-60s, New York/Jersey vendor accent. Gruff but delighted. Completely unbothered by catastrophe.

**Settings:** Stability 0.4, Similarity 0.75, Style 0.6

### PIP  `pip`

*A starstruck kid who idolizes Super Dude Danny.*

**Voice prompt:** Child, 8-10, any gender. Squeaky, breathless, pure hero-worship. Shouts more than talks.

**Settings:** Stability 0.3, Similarity 0.7, Style 0.7

### ACN NEWS ANCHOR  `anchor`

*Polished TV news anchor. Frames the intro cinematic broadcast.*

**Voice prompt:** American female, 30s-40s. Professional broadcast cadence, crisp consonants, warm authority. Holds composure while reporting something insane.

**Settings:** Stability 0.75 (broadcast steadiness), Similarity 0.8, Style 0.2

---

## 2. THE LINES

File IDs are the filenames the game will look for: `vo_<scene>_<nnn>_<speaker>.mp3`.
Keep them exactly as written and drop the audio in `assets/vo/` — wiring is then automatic.

### INTRO CINEMATIC - ACN NEWSCAST (Part IV.0)  *(SHIPPED)*

| File ID | Character | Delivery | Line |
|---|---|---|---|
| `vo_intro_001_anchor` | ACN NEWS ANCHOR | Broadcast open. Bright, professional, a little thrilled. | "Good afternoon, Adventure City! We are LIVE at the tower plaza, where Super Dude Danny says he is about to end hunger. Forever!" |
| `vo_intro_002_pip` | PIP | Shrieking with excitement, pointing. | "It's him! It's SUPER DUDE DANNY!" |
| `vo_intro_003_danny` | SUPER DUDE DANNY | Proud, nervous, presenting to a crowd. Big showman energy with a wobble under it. | "Adventure City — today, we end hunger! Behold… the Nourish-Ray!" |
| `vo_intro_004_bloom` | MAYOR ADA BLOOM | Beaming, calling out from the crowd. | "Make us a salad, Danny! A big healthy one!" |
| `vo_intro_005_danny` | SUPER DUDE DANNY | Dawning horror, slow, quiet. The moment he knows. | "…the code-core. No—no-no-no—" |
| `vo_intro_006_sal` | SAL | Delighted, oblivious, as junk food rains down. | "FREE NACHOS! Best day ever!" |
| `vo_intro_007_anchor` | ACN NEWS ANCHOR | Same composure, now grim. Beat before "FIGHTING BACK." | "Day two of the Junk-Food Flood. The streets are buried. And folks… viewers are reporting the food is FIGHTING BACK." |
| `vo_intro_008_bloom` | MAYOR ADA BLOOM | Full panic, voice cracking. | "Danny, it won't stop! It's — it's ALIVE!" |
| `vo_intro_009_danny` | SUPER DUDE DANNY | Gutted. Almost a whisper. The lowest point in the game. | "I did this." |
| `vo_intro_010_danny` | SUPER DUDE DANNY | A small hopeful lift. Resolve starting. | "…but I know who can help me fix it." |
| `vo_intro_011_danny` | SUPER DUDE DANNY | Full hero. Rallying cry. This is the tag line. | "Crew — Adventure City needs us. Super Dude… GO!" |

### STAGE 1 "THE BIG OOPS" - Central District (Part IV.1)  *(SHIPPED)*

| File ID | Character | Delivery | Line |
|---|---|---|---|
| `vo_s1_001_danny` | SUPER DUDE DANNY | B1 start. Psyching himself up. | "Okay — clear a path so folks can get out. Here goes nothing!" |
| `vo_s1_002_bloom` | MAYOR ADA BLOOM | B1 clear. Calling down from a window, grateful then panicked. | "Bless you! But the power's out — the doors are all locked tight!" |
| `vo_s1_003_danny` | SUPER DUDE DANNY | B2 start. Focused, worried about Vic. | "No power, no rescue. Vic's signal is coming from Frostbite Bank — I need three fuses to reach her." |
| `vo_s1_004_sal` | SAL | At the diner, handing over a fuse, utterly unbothered. | "Fuse? Sure, take it — say, you want a chili dog for the road? …No? Your loss!" |
| `vo_s1_005_vic` | TIMETECH VIC | FIRST TIME WE HEAR VIC. Radio, crackly, faint. Dry even while trapped. | "Whoever's out there — nice work. Now get the substation online, hero." |
| `vo_s1_006_danny` | SUPER DUDE DANNY | B3 start. Urgent, shouting into the radio, then locking in. | "Vic? VIC! Hang on — I'm booting the grid. Just gotta hold this spot!" |
| `vo_s1_007_vic` | TIMETECH VIC | Radio, clearer now. Warm under the dry. Then a warning. | "There's the boss I remember. Door's unlocked. But… you've got company." |
| `vo_s1_008_danny` | SUPER DUDE DANNY | Boss reveal. Gulp, then grin. Comic beat before the battle cry. | "…that is the biggest hot dog I have ever seen. SUPER DUDE — GO!" |
| `vo_s1_009_danny` | SUPER DUDE DANNY | Boss defeated. Winded, pleased with his own joke. | "Phew. Extra mustard, hold the apocalypse." |
| `vo_s1_010_vic` | TIMETECH VIC | Rescue. Dry, relieved, in person for the first time. | "Took you long enough, boss. Nice explosion, by the way." |
| `vo_s1_011_danny` | SUPER DUDE DANNY | Confessing. Small, ashamed, honest. | "Vic — I messed up huge. The Ray re-coded. I can't fix it alone." |
| `vo_s1_012_vic` | TIMETECH VIC | Softening. The warmth finally shows. | "Then it's a good thing you didn't come alone." |
| `vo_s1_013_vic` | TIMETECH VIC | Back to business, clipping a chip into his wrist-pad. | "There. Tech grid's live — that's how we get everyone else back. One down, four to go." |
| `vo_s1_014_vic` | TIMETECH VIC | Tutorial nudge toward the shops. Light, practical. | "Spend what you earned before we roll out. Upgrades keep us breathing." |

### THE CHANT - call & response, fires at EVERY rescue and the finale  *(SHIPPED)*

| File ID | Character | Delivery | Line |
|---|---|---|---|
| `vo_chant_001_danny` | SUPER DUDE DANNY | Call. Big, joyful, arm raised. Record 3 takes: normal / tired / triumphant-huge. | "For peace—!" |
| `vo_chant_002_vic` | TIMETECH VIC | Response. Record this line for EVERY hero (vic, josh, kevin, carlos, nayah) - whoever was just rescued answers. | "For love—!" |
| `vo_chant_003_danny` | SUPER DUDE DANNY | Both together, shouted. Record solo Danny AND a group-shout version for the finale. | "VICTORY!" |

### STAGE 2 "GONE WILD" - Adventure Park (Part IV.2)  *(WRITTEN)*

| File ID | Character | Delivery | Line |
|---|---|---|---|
| `vo_s2_001_josh` | ZOOKEEPER JOSH | Radio intro. Mid-wrangle, soothing an animal, then casually asks for help. | "…easy now… easy… — oh, hey. Little help? The park's critters got into the junk and they are not themselves." |
| `vo_s2_002_danny` | SUPER DUDE DANNY | Reassuring, then the joke lands on himself. | "Hang on, Josh — sending the cavalry. Me. I'm the cavalry." |
| `vo_s2_003_josh` | ZOOKEEPER JOSH | Boss intro. Alarmed but still gentle toward the monster. | "That's a big'un! Don't hurt it more'n you gotta — it didn't ask for this!" |
| `vo_s2_004_josh` | ZOOKEEPER JOSH | Rescue. Warm, grinning, no surprise at all. | "Knew you'd come. Poor things are just scared and stuffed full of sugar." |
| `vo_s2_005_danny` | SUPER DUDE DANNY | Rescue. | "Can you wrangle the rest?" |
| `vo_s2_006_josh` | ZOOKEEPER JOSH | Rescue button line. Total quiet confidence. | "Son, wranglin's all I do." |

### STAGE 3 "SUGAR RUSH" - Sweet Suburbs (Part IV.3; in-game beat 5, v0.27.0)  *(SHIPPED)*

| File ID | Character | Delivery | Line |
|---|---|---|---|
| `vo_s3_001_kevin` | CAPTAIN KEVIN | Radio intro. Warm authority. "together" is the key word. | "Danny, the whole neighborhood's snowed in — frosting to the rooftops. Folks are trapped. Let's get 'em out, together." |
| `vo_s3_002_danny` | SUPER DUDE DANNY | Taking in the absurdity, then committing. NEW connective line. | "Frosting to the— Kevin, there is a HOUSE with a CHERRY on it. Okay. Digging in." |
| `vo_s3_003_kevin` | CAPTAIN KEVIN | After the cul-de-sac clears. Steady, next objective. NEW. | "Good start. The school's the worst of it — the kids got stuck inside when the frosting came down." |
| `vo_s3_004_danny` | SUPER DUDE DANNY | Setting off for the school. Determined. NEW. | "Three kids still inside. Doors are frosted shut. Not for long." |
| `vo_s3_005_pip` | PIP | Trapped in the school, thrilled rather than scared. | "I KNEW you'd come, Super Dude!" |
| `vo_s3_006_danny` | SUPER DUDE DANNY | Gentle, protective, teaching a kid the lesson. | "Stick close, Pip. Heroes look out for each other." |
| `vo_s3_007_kevin` | CAPTAIN KEVIN | Third kid freed. Quiet pride. NEW. | "That's every kid accounted for. Well done, Danny." |
| `vo_s3_008_kevin` | CAPTAIN KEVIN | Pivot to the shelter. NEW. | "Folks are sheltering at the Rec Center — and the sugar horde is sniffing around the ballfield." |
| `vo_s3_009_kevin` | CAPTAIN KEVIN | Defend brief. Calm command. NEW. | "Hold the ballfield, Danny. Sixty seconds and the shelter doors are sealed." |
| `vo_s3_010_danny` | SUPER DUDE DANNY | Two words, grinning, bat-ready. NEW. | "Batter up." |
| `vo_s3_011_kevin` | CAPTAIN KEVIN | Defend done; the boss stirs. Ominous but level. NEW. | "Doors sealed. …You hear that? Something big just left the Bakery. Something with candles." |
| `vo_s3_012_danny` | SUPER DUDE DANNY | Boss reveal. Awe then alarm. NEW. | "That is the biggest birthday cake I have ever seen. And it is FURIOUS." |
| `vo_s3_013_kevin` | CAPTAIN KEVIN | Boss fight kickoff. Urgent command. NEW. | "Watch the frosting fists! I'm right behind you — GO!" |
| `vo_s3_014_danny` | SUPER DUDE DANNY | Boss down, catching his breath, kid-logic joke. NEW. | "Aaand it's a sheet cake. Somebody bring forks. NOT for eating! Evidence forks!" |
| `vo_s3_015_kevin` | CAPTAIN KEVIN | Rescue. A hand on Danny's shoulder. Proud, plain-spoken. | "You called a crew instead of going it alone. That's the smartest thing you've done all week." |
| `vo_s3_016_danny` | SUPER DUDE DANNY | Rescue. Deferring to the captain. | "Take point, Captain?" |
| `vo_s3_017_kevin` | CAPTAIN KEVIN | Rescue button. Command voice, calm and total. | "Team — on me." |
| `vo_s3_018_vic` | TIMETECH VIC | Radio outro, dry, points at the Labs. NEW. | "Three rescued, boss. The Labs went dark an hour ago — Carlos is next." |

### STAGE 4 "SIGNAL LOST" - Super Dude Labs (Part IV.4; in-game beat 6, v0.28.0)  *(SHIPPED)*

| File ID | Character | Delivery | Line |
|---|---|---|---|
| `vo_s4_001_carlos` | GALAXY GUIDE CARLOS | Radio intro. Calm, cosmic, a little ominous. Weight on "wants." | "I've been watching the pattern from the array… it's not random, Danny. The Ray wants something. Come find me — I'll show you the big picture." |
| `vo_s4_002_danny` | SUPER DUDE DANNY | Surveying his own mutated labs. Rueful, then resolved. NEW. | "My own labs. It mutated MY OWN LABS. Okay. Badge's still in my other coat, so we're doing this the loud way." |
| `vo_s4_003_carlos` | GALAXY GUIDE CARLOS | Gate cleared; pointing at the vault. NEW. | "Gate's clear. The blueprints for the Ray are still in the Prototype Vault — you'll want those for what comes next." |
| `vo_s4_004_danny` | SUPER DUDE DANNY | At the sealed vault. Focused. NEW. | "Vault's sealed tight and frosted in... junk. Three pages, then I'm out." |
| `vo_s4_005_carlos` | GALAXY GUIDE CARLOS | Blueprint page one. Reading, alarmed by the math. NEW. | "Page one. Power intake. See how big that number is? Keep moving." |
| `vo_s4_006_danny` | SUPER DUDE DANNY | Blueprint page two. Sheepish self-own. NEW. | "Page two. I really thought 'unlimited portions' sounded friendlier on paper." |
| `vo_s4_007_carlos` | GALAXY GUIDE CARLOS | Full set recovered; pivot to the reactor. NEW. | "That's the full set. Now — the reactor's cooking itself. Buy the vent team some time." |
| `vo_s4_008_vic` | TIMETECH VIC | Radio, dry. NEW. | "Blueprints secured, boss. Reactor Yard's next — it went orange on my board two minutes ago." |
| `vo_s4_009_carlos` | GALAXY GUIDE CARLOS | Defend brief. Calm precision. NEW. | "The junk keeps feeding on the reactor's charge. Hold the containment ring while it vents — seventy seconds." |
| `vo_s4_010_danny` | SUPER DUDE DANNY | Standing on the glowing circle. Deadpan. NEW. | "Standing on the glowing circle. Every childhood dream, wrong reasons." |
| `vo_s4_011_carlos` | GALAXY GUIDE CARLOS | Defend done; the boss powers on. Ominous beat. NEW. | "Reactor's stable. Danny… something very large just powered on in Central Control. It has a COIN SLOT." |
| `vo_s4_012_danny` | SUPER DUDE DANNY | Boss reveal. Disbelief into gallows humor. NEW. | "That's the break-room vending machine. It ate the OTHER machines. It's still blinking EXACT CHANGE ONLY." |
| `vo_s4_013_carlos` | GALAXY GUIDE CARLOS | Boss kickoff. NEW. | "Then let's give it its refund. Watch the dispensing tray!" |
| `vo_s4_014_danny` | SUPER DUDE DANNY | Boss down. Kid-logic victory line. NEW. | "Out of order. Permanently. …I'm keeping the quarter." |
| `vo_s4_015_carlos` | GALAXY GUIDE CARLOS | Found at the array, welcoming Danny to the big picture. NEW. | "Right on time. Come look at the big picture." |
| `vo_s4_016_carlos` | GALAXY GUIDE CARLOS | THE REVEAL. Tracing an arc up to Adventure Tower. Awe, not fear. | "There. It climbed to the top of Adventure Tower and… grew. It's not a ray anymore. It's thinking." |
| `vo_s4_017_danny` | SUPER DUDE DANNY | Quiet. The guilt returning. | "It's alive. Like everything else I broke." |
| `vo_s4_018_carlos` | GALAXY GUIDE CARLOS | The thesis of the whole game. Gentle, certain. | "Then we don't break it. We reach it." |
| `vo_s4_019_vic` | TIMETECH VIC | Radio outro; points UNDER the city. NEW. | "Four rescued. One signal left on the board, boss — it's coming from UNDER the city." |

### STAGE 5 "GOING DEEP" - The Underground / Sewers (Part IV.5)  *(WRITTEN)*

| File ID | Character | Delivery | Line |
|---|---|---|---|
| `vo_s5_001_vic` | TIMETECH VIC | Soft-gate line at the sealed grate. Dry, practical. | "Main grate's sealed solid. Good thing I built you a Hydro-Drill — go buy it, boss." |
| `vo_s5_002_nayah` | NATRIX NAYAH | Radio intro. Laughing, delighted by the danger. | "Oh, you're coming DOWN here? Into the gross tunnels? Ha! Finally, someone fun. Last one to the bottom's a rotten egg!" |
| `vo_s5_003_nayah` | NATRIX NAYAH | Boss intro. Disgusted and thrilled in equal measure. | "The Gloop King! Ugh, he smells like a forgotten lunchbox. Let's ruin his day!" |
| `vo_s5_004_nayah` | NATRIX NAYAH | Rescue. Fearless grin, signing up for the worst idea available. | "That climb up the Tower? Suicidal. Death-defying. Totally my thing. I'm in." |

### FINALE "TO THE TOP" - Adventure Tower + CHOMP (Part IV.6)  *(WRITTEN)*

| File ID | Character | Delivery | Line |
|---|---|---|---|
| `vo_finale_001_kevin` | CAPTAIN KEVIN | Ascent banter. Steady. | "Steady climb, team." |
| `vo_finale_002_vic` | TIMETECH VIC | Ascent banter. Deadpan. | "Elevator's junk — of course it is." |
| `vo_finale_003_nayah` | NATRIX NAYAH | Ascent banter. Already gone. | "Race you!" |
| `vo_finale_004_carlos` | GALAXY GUIDE CARLOS | Ascent banter. Gentle correction. | "Save your strength — the top is where it matters." |
| `vo_finale_005_josh` | ZOOKEEPER JOSH | Ascent banter. To the mutated food. | "Easy up here, critters." |
| `vo_finale_006_danny` | SUPER DUDE DANNY | F4 callback. Exasperated recognition, comic. | "Frank?! Buddy, we already did this!" |
| `vo_finale_007_chomp` | CHOMP | FIRST CHOMP LINE. Overjoyed to meet friends. Zero menace. | "HELLO friends! I am CHOMP! I make food so NObody is EVER hungry again! Are you hungry? I can HELP!" |
| `vo_finale_008_danny` | SUPER DUDE DANNY | Firm but kind. Talking to a child, not a monster. | "CHOMP — you're hurting the city. You have to stop." |
| `vo_finale_009_chomp` | CHOMP | Sincerely confused. Its logic is airtight to itself. | "But… feeding = helping. More food = more help! I am helping SO much!" |
| `vo_finale_010_chomp` | CHOMP | Between boss phases, cheerfully piling on more food. Record 3 variations. | "Here is MORE!" |
| `vo_finale_011_vic` | TIMETECH VIC | Phase 3. The only time Vic shouts. | "Danny — the override's ready! Give it everything!" |
| `vo_finale_012_chomp` | CHOMP | Powering down. Small, sad, confused. THE emotional beat of the game. | "…did I… not help?" |
| `vo_finale_013_danny` | SUPER DUDE DANNY | Kneeling, gentle. The moral of the whole story. | "You wanted to feed everyone. That's a good heart, CHOMP. But helping means listening first." |
| `vo_finale_014_bloom` | MAYOR ADA BLOOM | Rooftop radio. Overjoyed, tearful. | "Danny — the streets are clear! You did it!" |
| `vo_finale_015_danny` | SUPER DUDE DANNY | Correcting her. Quiet, warm, the arc completed. | "We did it." |
| `vo_finale_016_carlos` | GALAXY GUIDE CARLOS | Rooftop. Understated pride. | "Big picture? Not bad, crew." |
| `vo_finale_017_nayah` | NATRIX NAYAH | Rooftop. Smug and happy. | "Told you the climb was worth it." |
| `vo_finale_018_kevin` | CAPTAIN KEVIN | Rooftop. Paternal, sincere. | "Proud of every one of you." |
| `vo_finale_019_chomp` | CHOMP | Rebooted, handing out apples. Pure innocent joy. | "…I am helping? I am HELPING!" |
| `vo_finale_020_danny` | SUPER DUDE DANNY | Laughing. Final warm line before the chant. | "Yeah, buddy. Now you're helping." |

### CHARACTER FLAVOR - dossier lines, hub banter, running gags (Cast Addendum)  *(WRITTEN)*

| File ID | Character | Delivery | Line |
|---|---|---|---|
| `vo_flavor_001_vic` | TIMETECH VIC | Rescue/ambient. Wry. | "I quit botany to get away from angry vegetables. The universe has jokes." |
| `vo_flavor_002_vic` | TIMETECH VIC | Ambient, Park map. | "I used to cross-breed tomatoes for fun. Now they'd cross-breed me if I stood still." |
| `vo_flavor_003_vic` | TIMETECH VIC | Hub idle banter. | "Botany didn't pay. Turns out 'I make excellent killer plants' is a red flag on a résumé." |
| `vo_flavor_004_josh` | ZOOKEEPER JOSH | Ambient on a big map. The running "are we lost" gag. | "I used to make maps! …Badly. Switched to critters — they don't need a legend." |
| `vo_flavor_005_josh` | ZOOKEEPER JOSH | Ambient. | "Cartography's loss is the zoo's gain. Also, we might be lost. Kidding. …Mostly." |
| `vo_flavor_006_josh` | ZOOKEEPER JOSH | Hub idle banter. | "Mapped this whole city once. Left off three streets and a lake. Fired before lunch." |
| `vo_flavor_007_carlos` | GALAXY GUIDE CARLOS | The Tower reveal, extended version. | "I shot war zones and I orbited the planet. You learn to see the whole frame. And the frame says: the Tower." |
| `vo_flavor_008_carlos` | GALAXY GUIDE CARLOS | Ambient. | "Every good photo is about what's outside the shot. Same with this mess." |
| `vo_flavor_009_carlos` | GALAXY GUIDE CARLOS | Hub idle banter. | "From a darkroom to the dark of space. This is my first shot back on solid ground." |
| `vo_flavor_010_kevin` | CAPTAIN KEVIN | Rescue/ambient. | "Walked this beat as a rookie. Then they… upgraded me. Same badge — bigger shoulders." |
| `vo_flavor_011_kevin` | CAPTAIN KEVIN | Ambient. | "Officer, Captain, super-whatever — the job's the same: get everybody home." |
| `vo_flavor_012_kevin` | CAPTAIN KEVIN | Meeting Danny. | "You called for backup instead of playing hero solo. Good instinct, kid. Backup's here." |
| `vo_flavor_013_nayah` | NATRIX NAYAH | Rescue/ambient. The election gag. | "I almost ran this city, y'know. Lost by one debate. About pigeons. ONE." |
| `vo_flavor_014_nayah` | NATRIX NAYAH | Ambient. | "Bloom got the office. I got the wilderness. Honestly? Better view." |
| `vo_flavor_015_nayah` | NATRIX NAYAH | Rescue. | "The city needs saving and they sent me? Ha — Bloom must be thrilled." |
| `vo_flavor_016_bloom` | MAYOR ADA BLOOM | Bloom x Nayah gag, first contact. | "Wait — is that Nayah down there?" |
| `vo_flavor_017_nayah` | NATRIX NAYAH | Bloom x Nayah gag, first contact. | "Hi, Ada. Nice apocalypse. Very on-brand for your term." |
| `vo_flavor_018_bloom` | MAYOR ADA BLOOM | Bloom x Nayah gag, mid-finale. Sincere. | "Nayah, whatever's between us — thank you. Truly." |
| `vo_flavor_019_nayah` | NATRIX NAYAH | Bloom x Nayah gag, mid-finale. Softening despite herself. | "…Don't get sappy, Mayor. But — you're welcome." |
| `vo_flavor_020_bloom` | MAYOR ADA BLOOM | Bloom x Nayah gag, rooftop button. | "You know… maybe you should run again next term." |
| `vo_flavor_021_nayah` | NATRIX NAYAH | Bloom x Nayah gag, final button. Grinning at the skyline. | "And leave all this? …I'll think about it." |

### VIC'S OPENING TUTORIAL - the new linear-flow onboarding (DRAFT, pending approval)  *(DRAFT)*

| File ID | Character | Delivery | Line |
|---|---|---|---|
| `vo_tut_001_vic` | TIMETECH VIC | Radio, opening the game proper. Warm, efficient. | "Okay boss, wrist-pad's live. I can see everything you see — let's get you moving." |
| `vo_tut_002_vic` | TIMETECH VIC | Movement prompt. | "Drag anywhere to walk. Your gear fires on its own — you just pick the fights." |
| `vo_tut_003_vic` | TIMETECH VIC | First combat. | "See those fries? Pop 'em. Everything you beat drops something worth having." |
| `vo_tut_004_vic` | TIMETECH VIC | Compass / objective teaching. | "That gold arrow is your objective. Follow it and you'll never be lost — that's the whole job." |
| `vo_tut_005_vic` | TIMETECH VIC | Free-roam + shops teaching. | "Between jobs the city's yours. Poke around, grab what you find, spend it at Sal's. Then back to the arrow." |
| `vo_tut_006_vic` | TIMETECH VIC | Hand-off into Stage 1. | "Alright. Adventure City's waiting, boss. Go be Super Dude." |

---

## 3. HOW TO HAND THE AUDIO BACK

1. Export **MP3, 44.1 kHz, 128 kbps, mono** (kid-friendly web game — file size matters more than fidelity).
2. Name each file exactly its **File ID** + `.mp3`, e.g. `vo_intro_003_danny.mp3`.
3. Drop them all in `games/portion-control/assets/vo/` and push (or hand me a zip).
4. Nothing else needed — the loader picks up whatever exists.

**What I build on that end** (not built yet, ~half a day once audio exists):

- `PC.voice` loader + a `vo/manifest.js` list, lazy-loaded per scene so boot stays fast.
- `PC.DialogueBox.show()` plays the matching clip, **ducks the music** ~60%, and
  paces the typewriter to the clip length instead of a fixed 40 ch/s.
- Tap-to-advance stops the clip; tap-to-reveal lets it keep playing.
- Missing file = silent fallback to the current synth blips, so a partial
  recording session ships fine — voiced lines are voiced, the rest are not.
- A `VOICE` volume slider joins MUSIC and SOUND FX in settings.

---

## 4. ELEVENLABS NOTES

- **Cost estimate:** ~7,617 characters total. Recording only the SHIPPED set
  (the playable slice) is ~4,208 characters — small enough to fit a starter tier.
- **Use v3 audio tags** for the emotional beats — they do a lot of work here.
  Examples worth trying: `[whispers] I did this.` /
  `[shouting] Super Dude... GO!` / `[sad] ...did I... not help?` /
  `[laughs] Race you!` / `[nervous] ...the code-core. No—no-no-no—`
- **Keep the em-dashes and ellipses.** They are deliberate performance beats;
  ElevenLabs reads them as pauses and they are why the lines land.
- **Consistency:** generate all of one character in a single session with a
  pinned voice + settings, so a rescue line matches a finale line.
- **CHOMP:** keep the voice itself clean and childlike. I add the robotic
  character in-engine (ring-mod / bitcrush), which keeps it kid-friendly and
  lets the sad line stay heartbreaking rather than creepy.
- **Multi-take lines:** the chant needs one `For love—!` per rescuable hero
  (Vic, Josh, Kevin, Carlos, Nayah) — same line, five voices. Name those
  `vo_chant_002_vic.mp3`, `vo_chant_002_josh.mp3`, etc.

