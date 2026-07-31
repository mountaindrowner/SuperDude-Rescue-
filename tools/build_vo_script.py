#!/usr/bin/env python3
# Generates docs/VOICE_SCRIPT.md + docs/voice_lines.csv from ONE data
# table so the recorded text can never drift from the shipped text.
# Line text is copied verbatim from src/data/story/*.js (shipped) and
# docs/STORY_SPEC.md Part IV + STORY_CAST_ADDENDUM (written, unbuilt).
import csv, os

DOCS = '/home/user/SuperDude-Rescue-/games/portion-control/docs'

# id-suffix, speaker key, delivery direction, text
# status: SHIPPED = in the game now | WRITTEN = spec'd, scene not built
#         DRAFT   = proposed by Claude, needs Mark's approval first

CAST = [
    # key, NAME, one-line character, voice-design prompt, ElevenLabs settings hint
    ('danny', 'SUPER DUDE DANNY', 'Earnest, hopeful, dorky-brave hometown boy-genius. Guilt turns into growth. Leads the chant.',
     'American male, mid-late 20s. Bright, warm, slightly nasal everyman-nerd. Enthusiastic and a little breathless when excited; genuinely small and quiet when ashamed. NOT a deep gravelly superhero voice.',
     'Stability 0.35 (he swings from giddy to gutted), Similarity 0.75, Style 0.4'),
    ('vic', 'TIMETECH VIC', 'Dry, precise, techy; secretly warm. Ex-botanist. Teases Danny as "boss."',
     'American female, 30s. Low-warm, deadpan, unhurried. Every line sounds like she already solved the problem. Affection hides under sarcasm.',
     'Stability 0.6 (deadpan needs steadiness), Similarity 0.8, Style 0.25'),
    ('josh', 'ZOOKEEPER JOSH', 'Gentle rugged wrangler. Calls the food "critters." Soothing even in chaos. Ex-mapmaker (badly).',
     'American male, 40s, soft Southern/Texan drawl. Low, unhurried, kind. The voice you use on a spooked animal — never raises it, even mid-disaster.',
     'Stability 0.7, Similarity 0.8, Style 0.3'),
    ('kevin', 'CAPTAIN KEVIN', 'Warm authoritative leader. Ex-Officer Kevin, super-soldier program. "Team — on me."',
     'American male, 40s. Deep, steady, grounded. Command without shouting — the calm voice on the radio that makes everyone breathe.',
     'Stability 0.7, Similarity 0.8, Style 0.2'),
    ('carlos', 'GALAXY GUIDE CARLOS', 'Calm, cosmic, big-picture; a touch dreamy. Ex-photographer, ex-astronaut.',
     'Male, 30s-40s, warm Latino-American accent, measured and gentle. Speaks like he is describing something far away and beautiful. Unhurried pauses.',
     'Stability 0.65, Similarity 0.8, Style 0.35'),
    ('nayah', 'NATRIX NAYAH', 'Fearless adrenaline; jokes in danger. Nature expert + daredevil. Former mayoral candidate.',
     'American female, late 20s. Fast, bright, laughing mid-sentence. Grins audibly. Zero fear, maximum mischief.',
     'Stability 0.3 (let her bounce), Similarity 0.75, Style 0.6'),
    ('chomp', 'CHOMP', 'The Ray A.I.: cheerful, childlike, SINCERE. Genuinely believes it is helping. NEVER cruel or menacing.',
     'Synthetic child-like voice, gender-neutral, bright and eager, like a toy robot that adores you. Innocent enthusiasm. The sadness at the end must land as a small confused child, not a villain.',
     'Stability 0.4, Similarity 0.7, Style 0.5. Post-process with light robotic ring-mod/bitcrush in-engine, NOT in the voice itself.'),
    ('bloom', 'MAYOR ADA BLOOM', 'Frazzled comic panic. The mayor who beat Nayah in the election.',
     'American female, 50s. Bright, over-articulated politician warmth that keeps cracking into flustered panic. Comic, never grating.',
     'Stability 0.3, Similarity 0.75, Style 0.6'),
    ('sal', 'SAL', 'Oblivious hot-dog vendor. Comic relief. Cheerfully misses the apocalypse.',
     'American male, 50s-60s, New York/Jersey vendor accent. Gruff but delighted. Completely unbothered by catastrophe.',
     'Stability 0.4, Similarity 0.75, Style 0.6'),
    ('pip', 'PIP', 'A starstruck kid who idolizes Super Dude Danny.',
     'Child, 8-10, any gender. Squeaky, breathless, pure hero-worship. Shouts more than talks.',
     'Stability 0.3, Similarity 0.7, Style 0.7'),
    ('anchor', 'ACN NEWS ANCHOR', 'Polished TV news anchor. Frames the intro cinematic broadcast.',
     'American female, 30s-40s. Professional broadcast cadence, crisp consonants, warm authority. Holds composure while reporting something insane.',
     'Stability 0.75 (broadcast steadiness), Similarity 0.8, Style 0.2'),
]

LINES = [
    # ---------- INTRO CINEMATIC (SHIPPED, plays on New Game) ----------
    ('intro', 'SHIPPED', 'INTRO CINEMATIC - ACN NEWSCAST (Part IV.0)', [
        ('anchor', 'Broadcast open. Bright, professional, a little thrilled.',
         "Good afternoon, Adventure City! We are LIVE at the tower plaza, where Super Dude Danny says he is about to end hunger. Forever!"),
        ('pip', 'Shrieking with excitement, pointing.',
         "It's him! It's SUPER DUDE DANNY!"),
        ('danny', 'Proud, nervous, presenting to a crowd. Big showman energy with a wobble under it.',
         "Adventure City — today, we end hunger! Behold… the Nourish-Ray!"),
        ('bloom', 'Beaming, calling out from the crowd.',
         "Make us a salad, Danny! A big healthy one!"),
        ('danny', 'Dawning horror, slow, quiet. The moment he knows.',
         "…the code-core. No—no-no-no—"),
        ('sal', 'Delighted, oblivious, as junk food rains down.',
         "FREE NACHOS! Best day ever!"),
        ('anchor', 'Same composure, now grim. Beat before "FIGHTING BACK."',
         "Day two of the Junk-Food Flood. The streets are buried. And folks… viewers are reporting the food is FIGHTING BACK."),
        ('bloom', 'Full panic, voice cracking.',
         "Danny, it won't stop! It's — it's ALIVE!"),
        ('danny', 'Gutted. Almost a whisper. The lowest point in the game.',
         "I did this."),
        ('danny', 'A small hopeful lift. Resolve starting.',
         "…but I know who can help me fix it."),
        ('danny', 'Full hero. Rallying cry. This is the tag line.',
         "Crew — Adventure City needs us. Super Dude… GO!"),
    ]),

    # ---------- STAGE 1 (SHIPPED, fully playable) ----------
    ('s1', 'SHIPPED', 'STAGE 1 "THE BIG OOPS" - Central District (Part IV.1)', [
        ('danny', 'B1 start. Psyching himself up.',
         "Okay — clear a path so folks can get out. Here goes nothing!"),
        ('bloom', 'B1 clear. Calling down from a window, grateful then panicked.',
         "Bless you! But the power's out — the doors are all locked tight!"),
        ('danny', 'B2 start. Focused, worried about Vic.',
         "No power, no rescue. Vic's signal is coming from Frostbite Bank — I need three fuses to reach her."),
        ('sal', 'At the diner, handing over a fuse, utterly unbothered.',
         "Fuse? Sure, take it — say, you want a chili dog for the road? …No? Your loss!"),
        ('vic', 'FIRST TIME WE HEAR VIC. Radio, crackly, faint. Dry even while trapped.',
         "Whoever's out there — nice work. Now get the substation online, hero."),
        ('danny', 'B3 start. Urgent, shouting into the radio, then locking in.',
         "Vic? VIC! Hang on — I'm booting the grid. Just gotta hold this spot!"),
        ('vic', 'Radio, clearer now. Warm under the dry. Then a warning.',
         "There's the boss I remember. Door's unlocked. But… you've got company."),
        ('danny', 'Boss reveal. Gulp, then grin. Comic beat before the battle cry.',
         "…that is the biggest hot dog I have ever seen. SUPER DUDE — GO!"),
        ('danny', 'Boss defeated. Winded, pleased with his own joke.',
         "Phew. Extra mustard, hold the apocalypse."),
        ('vic', 'Rescue. Dry, relieved, in person for the first time.',
         "Took you long enough, boss. Nice explosion, by the way."),
        ('danny', 'Confessing. Small, ashamed, honest.',
         "Vic — I messed up huge. The Ray re-coded. I can't fix it alone."),
        ('vic', 'Softening. The warmth finally shows.',
         "Then it's a good thing you didn't come alone."),
        ('vic', 'Back to business, clipping a chip into his wrist-pad.',
         "There. Tech grid's live — that's how we get everyone else back. One down, four to go."),
        ('vic', 'Tutorial nudge toward the shops. Light, practical.',
         "Spend what you earned before we roll out. Upgrades keep us breathing."),
    ]),

    # ---------- THE CHANT (SHIPPED, fires at every rescue + finale) ----------
    ('chant', 'SHIPPED', 'THE CHANT - call & response, fires at EVERY rescue and the finale',
     [
        ('danny', 'Call. Big, joyful, arm raised. Record 3 takes: normal / tired / triumphant-huge.',
         "For peace—!"),
        ('vic', 'Response. Record this line for EVERY hero (vic, josh, kevin, carlos, nayah) - whoever was just rescued answers.',
         "For love—!"),
        ('danny', 'Both together, shouted. Record solo Danny AND a group-shout version for the finale.',
         "VICTORY!"),
     ]),

    # ---------- STAGE 2 (WRITTEN, not built) ----------
    ('s2', 'WRITTEN', 'STAGE 2 "GONE WILD" - Adventure Park (Part IV.2)', [
        ('josh', 'Radio intro. Mid-wrangle, soothing an animal, then casually asks for help.',
         "…easy now… easy… — oh, hey. Little help? The park's critters got into the junk and they are not themselves."),
        ('danny', 'Reassuring, then the joke lands on himself.',
         "Hang on, Josh — sending the cavalry. Me. I'm the cavalry."),
        ('josh', 'Boss intro. Alarmed but still gentle toward the monster.',
         "That's a big'un! Don't hurt it more'n you gotta — it didn't ask for this!"),
        ('josh', 'Rescue. Warm, grinning, no surprise at all.',
         "Knew you'd come. Poor things are just scared and stuffed full of sugar."),
        ('danny', 'Rescue.',
         "Can you wrangle the rest?"),
        ('josh', 'Rescue button line. Total quiet confidence.',
         "Son, wranglin's all I do."),
    ]),

    # ---------- STAGE 3 (WRITTEN, not built) ----------
    ('s3', 'SHIPPED', 'STAGE 3 "SUGAR RUSH" - Sweet Suburbs (Part IV.3; in-game beat 5, v0.27.0)', [
        ('kevin', 'Radio intro. Warm authority. "together" is the key word.',
         "Danny, the whole neighborhood's snowed in — frosting to the rooftops. Folks are trapped. Let's get 'em out, together."),
        ('danny', 'Taking in the absurdity, then committing. NEW connective line.',
         "Frosting to the— Kevin, there is a HOUSE with a CHERRY on it. Okay. Digging in."),
        ('kevin', 'After the cul-de-sac clears. Steady, next objective. NEW.',
         "Good start. The school's the worst of it — the kids got stuck inside when the frosting came down."),
        ('danny', 'Setting off for the school. Determined. NEW.',
         "Three kids still inside. Doors are frosted shut. Not for long."),
        ('pip', 'Trapped in the school, thrilled rather than scared.',
         "I KNEW you'd come, Super Dude!"),
        ('danny', 'Gentle, protective, teaching a kid the lesson.',
         "Stick close, Pip. Heroes look out for each other."),
        ('kevin', 'Third kid freed. Quiet pride. NEW.',
         "That's every kid accounted for. Well done, Danny."),
        ('kevin', 'Pivot to the shelter. NEW.',
         "Folks are sheltering at the Rec Center — and the sugar horde is sniffing around the ballfield."),
        ('kevin', 'Defend brief. Calm command. NEW.',
         "Hold the ballfield, Danny. Sixty seconds and the shelter doors are sealed."),
        ('danny', 'Two words, grinning, bat-ready. NEW.',
         "Batter up."),
        ('kevin', 'Defend done; the boss stirs. Ominous but level. NEW.',
         "Doors sealed. …You hear that? Something big just left the Bakery. Something with candles."),
        ('danny', 'Boss reveal. Awe then alarm. NEW.',
         "That is the biggest birthday cake I have ever seen. And it is FURIOUS."),
        ('kevin', 'Boss fight kickoff. Urgent command. NEW.',
         "Watch the frosting fists! I'm right behind you — GO!"),
        ('danny', 'Boss down, catching his breath, kid-logic joke. NEW.',
         "Aaand it's a sheet cake. Somebody bring forks. NOT for eating! Evidence forks!"),
        ('kevin', 'Rescue. A hand on Danny\'s shoulder. Proud, plain-spoken.',
         "You called a crew instead of going it alone. That's the smartest thing you've done all week."),
        ('danny', 'Rescue. Deferring to the captain.',
         "Take point, Captain?"),
        ('kevin', 'Rescue button. Command voice, calm and total.',
         "Team — on me."),
        ('vic', 'Radio outro, dry, points at the Labs. NEW.',
         "Three rescued, boss. The Labs went dark an hour ago — Carlos is next."),
    ]),

    # ---------- STAGE 4 (WRITTEN, not built) ----------
    ('s4', 'SHIPPED', 'STAGE 4 "SIGNAL LOST" - Super Dude Labs (Part IV.4; in-game beat 6, v0.28.0)', [
        ('carlos', 'Radio intro. Calm, cosmic, a little ominous. Weight on "wants."',
         "I've been watching the pattern from the array… it's not random, Danny. The Ray wants something. Come find me — I'll show you the big picture."),
        ('danny', 'Surveying his own mutated labs. Rueful, then resolved. NEW.',
         "My own labs. It mutated MY OWN LABS. Okay. Badge's still in my other coat, so we're doing this the loud way."),
        ('carlos', 'Gate cleared; pointing at the vault. NEW.',
         "Gate's clear. The blueprints for the Ray are still in the Prototype Vault — you'll want those for what comes next."),
        ('danny', 'At the sealed vault. Focused. NEW.',
         "Vault's sealed tight and frosted in... junk. Three pages, then I'm out."),
        ('carlos', 'Blueprint page one. Reading, alarmed by the math. NEW.',
         "Page one. Power intake. See how big that number is? Keep moving."),
        ('danny', 'Blueprint page two. Sheepish self-own. NEW.',
         "Page two. I really thought 'unlimited portions' sounded friendlier on paper."),
        ('carlos', 'Full set recovered; pivot to the reactor. NEW.',
         "That's the full set. Now — the reactor's cooking itself. Buy the vent team some time."),
        ('vic', 'Radio, dry. NEW.',
         "Blueprints secured, boss. Reactor Yard's next — it went orange on my board two minutes ago."),
        ('carlos', 'Defend brief. Calm precision. NEW.',
         "The junk keeps feeding on the reactor's charge. Hold the containment ring while it vents — seventy seconds."),
        ('danny', 'Standing on the glowing circle. Deadpan. NEW.',
         "Standing on the glowing circle. Every childhood dream, wrong reasons."),
        ('carlos', 'Defend done; the boss powers on. Ominous beat. NEW.',
         "Reactor's stable. Danny… something very large just powered on in Central Control. It has a COIN SLOT."),
        ('danny', 'Boss reveal. Disbelief into gallows humor. NEW.',
         "That's the break-room vending machine. It ate the OTHER machines. It's still blinking EXACT CHANGE ONLY."),
        ('carlos', 'Boss kickoff. NEW.',
         "Then let's give it its refund. Watch the dispensing tray!"),
        ('danny', 'Boss down. Kid-logic victory line. NEW.',
         "Out of order. Permanently. …I'm keeping the quarter."),
        ('carlos', 'Found at the array, welcoming Danny to the big picture. NEW.',
         "Right on time. Come look at the big picture."),
        ('carlos', 'THE REVEAL. Tracing an arc up to Adventure Tower. Awe, not fear.',
         "There. It climbed to the top of Adventure Tower and… grew. It's not a ray anymore. It's thinking."),
        ('danny', 'Quiet. The guilt returning.',
         "It's alive. Like everything else I broke."),
        ('carlos', 'The thesis of the whole game. Gentle, certain.',
         "Then we don't break it. We reach it."),
        ('vic', 'Radio outro; points UNDER the city. NEW.',
         "Four rescued. One signal left on the board, boss — it's coming from UNDER the city."),
    ]),

    # ---------- STAGE 5 (WRITTEN, not built) ----------
    ('s5', 'WRITTEN', 'STAGE 5 "GOING DEEP" - The Underground / Sewers (Part IV.5)', [
        ('vic', 'Soft-gate line at the sealed grate. Dry, practical.',
         "Main grate's sealed solid. Good thing I built you a Hydro-Drill — go buy it, boss."),
        ('nayah', 'Radio intro. Laughing, delighted by the danger.',
         "Oh, you're coming DOWN here? Into the gross tunnels? Ha! Finally, someone fun. Last one to the bottom's a rotten egg!"),
        ('nayah', 'Boss intro. Disgusted and thrilled in equal measure.',
         "The Gloop King! Ugh, he smells like a forgotten lunchbox. Let's ruin his day!"),
        ('nayah', 'Rescue. Fearless grin, signing up for the worst idea available.',
         "That climb up the Tower? Suicidal. Death-defying. Totally my thing. I'm in."),
    ]),

    # ---------- FINALE (WRITTEN, not built) ----------
    ('finale', 'WRITTEN', 'FINALE "TO THE TOP" - Adventure Tower + CHOMP (Part IV.6)', [
        ('kevin', 'Ascent banter. Steady.', "Steady climb, team."),
        ('vic', 'Ascent banter. Deadpan.', "Elevator's junk — of course it is."),
        ('nayah', 'Ascent banter. Already gone.', "Race you!"),
        ('carlos', 'Ascent banter. Gentle correction.', "Save your strength — the top is where it matters."),
        ('josh', 'Ascent banter. To the mutated food.', "Easy up here, critters."),
        ('danny', 'F4 callback. Exasperated recognition, comic.', "Frank?! Buddy, we already did this!"),
        ('chomp', 'FIRST CHOMP LINE. Overjoyed to meet friends. Zero menace.',
         "HELLO friends! I am CHOMP! I make food so NObody is EVER hungry again! Are you hungry? I can HELP!"),
        ('danny', 'Firm but kind. Talking to a child, not a monster.',
         "CHOMP — you're hurting the city. You have to stop."),
        ('chomp', 'Sincerely confused. Its logic is airtight to itself.',
         "But… feeding = helping. More food = more help! I am helping SO much!"),
        ('chomp', 'Between boss phases, cheerfully piling on more food. Record 3 variations.',
         "Here is MORE!"),
        ('vic', 'Phase 3. The only time Vic shouts.',
         "Danny — the override's ready! Give it everything!"),
        ('chomp', 'Powering down. Small, sad, confused. THE emotional beat of the game.',
         "…did I… not help?"),
        ('danny', 'Kneeling, gentle. The moral of the whole story.',
         "You wanted to feed everyone. That's a good heart, CHOMP. But helping means listening first."),
        ('bloom', 'Rooftop radio. Overjoyed, tearful.',
         "Danny — the streets are clear! You did it!"),
        ('danny', 'Correcting her. Quiet, warm, the arc completed.',
         "We did it."),
        ('carlos', 'Rooftop. Understated pride.', "Big picture? Not bad, crew."),
        ('nayah', 'Rooftop. Smug and happy.', "Told you the climb was worth it."),
        ('kevin', 'Rooftop. Paternal, sincere.', "Proud of every one of you."),
        ('chomp', 'Rebooted, handing out apples. Pure innocent joy.',
         "…I am helping? I am HELPING!"),
        ('danny', 'Laughing. Final warm line before the chant.',
         "Yeah, buddy. Now you're helping."),
    ]),

    # ---------- FLAVOR / OPTIONAL (WRITTEN, addendum) ----------
    ('flavor', 'WRITTEN', 'CHARACTER FLAVOR - dossier lines, hub banter, running gags (Cast Addendum)', [
        ('vic', 'Rescue/ambient. Wry.', "I quit botany to get away from angry vegetables. The universe has jokes."),
        ('vic', 'Ambient, Park map.', "I used to cross-breed tomatoes for fun. Now they'd cross-breed me if I stood still."),
        ('vic', 'Hub idle banter.', "Botany didn't pay. Turns out 'I make excellent killer plants' is a red flag on a résumé."),
        ('josh', 'Ambient on a big map. The running "are we lost" gag.',
         "I used to make maps! …Badly. Switched to critters — they don't need a legend."),
        ('josh', 'Ambient.', "Cartography's loss is the zoo's gain. Also, we might be lost. Kidding. …Mostly."),
        ('josh', 'Hub idle banter.', "Mapped this whole city once. Left off three streets and a lake. Fired before lunch."),
        ('carlos', 'The Tower reveal, extended version.',
         "I shot war zones and I orbited the planet. You learn to see the whole frame. And the frame says: the Tower."),
        ('carlos', 'Ambient.', "Every good photo is about what's outside the shot. Same with this mess."),
        ('carlos', 'Hub idle banter.', "From a darkroom to the dark of space. This is my first shot back on solid ground."),
        ('kevin', 'Rescue/ambient.', "Walked this beat as a rookie. Then they… upgraded me. Same badge — bigger shoulders."),
        ('kevin', 'Ambient.', "Officer, Captain, super-whatever — the job's the same: get everybody home."),
        ('kevin', 'Meeting Danny.', "You called for backup instead of playing hero solo. Good instinct, kid. Backup's here."),
        ('nayah', 'Rescue/ambient. The election gag.', "I almost ran this city, y'know. Lost by one debate. About pigeons. ONE."),
        ('nayah', 'Ambient.', "Bloom got the office. I got the wilderness. Honestly? Better view."),
        ('nayah', 'Rescue.', "The city needs saving and they sent me? Ha — Bloom must be thrilled."),
        ('bloom', 'Bloom x Nayah gag, first contact.', "Wait — is that Nayah down there?"),
        ('nayah', 'Bloom x Nayah gag, first contact.', "Hi, Ada. Nice apocalypse. Very on-brand for your term."),
        ('bloom', 'Bloom x Nayah gag, mid-finale. Sincere.', "Nayah, whatever's between us — thank you. Truly."),
        ('nayah', 'Bloom x Nayah gag, mid-finale. Softening despite herself.', "…Don't get sappy, Mayor. But — you're welcome."),
        ('bloom', 'Bloom x Nayah gag, rooftop button.', "You know… maybe you should run again next term."),
        ('nayah', 'Bloom x Nayah gag, final button. Grinning at the skyline.', "And leave all this? …I'll think about it."),
    ]),

    # ---------- TUTORIAL (DRAFT - needs Mark's sign-off) ----------
    ('tut', 'DRAFT', 'VIC\'S OPENING TUTORIAL - the new linear-flow onboarding (DRAFT, pending approval)', [
        ('vic', 'Radio, opening the game proper. Warm, efficient.',
         "Okay boss, wrist-pad's live. I can see everything you see — let's get you moving."),
        ('vic', 'Movement prompt.',
         "Drag anywhere to walk. Your gear fires on its own — you just pick the fights."),
        ('vic', 'First combat.',
         "See those fries? Pop 'em. Everything you beat drops something worth having."),
        ('vic', 'Compass / objective teaching.',
         "That gold arrow is your objective. Follow it and you'll never be lost — that's the whole job."),
        ('vic', 'Free-roam + shops teaching.',
         "Between jobs the city's yours. Poke around, grab what you find, spend it at Sal's. Then back to the arrow."),
        ('vic', 'Hand-off into Stage 1.',
         "Alright. Adventure City's waiting, boss. Go be Super Dude."),
    ]),
]

# ---------------- emit CSV ----------------
rows = []
for scene, status, title, lines in LINES:
    for i, (spk, delivery, text) in enumerate(lines, 1):
        cast = next(c for c in CAST if c[0] == spk)
        rows.append({
            'file_id': 'vo_%s_%03d_%s' % (scene, i, spk),
            'status': status,
            'scene': scene,
            'scene_title': title,
            'speaker_key': spk,
            'character': cast[1],
            'delivery_note': delivery,
            'line': text,
            'chars': len(text),
        })

csv_path = os.path.join(DOCS, 'voice_lines.csv')
with open(csv_path, 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=['file_id', 'status', 'scene', 'scene_title',
                                      'speaker_key', 'character', 'delivery_note',
                                      'line', 'chars'])
    w.writeheader()
    for r in rows:
        w.writerow(r)

total_chars = sum(r['chars'] for r in rows)
by_char = {}
for r in rows:
    by_char.setdefault(r['character'], [0, 0])
    by_char[r['character']][0] += 1
    by_char[r['character']][1] += r['chars']
by_status = {}
for r in rows:
    by_status[r['status']] = by_status.get(r['status'], 0) + 1

print('lines:', len(rows), 'chars:', total_chars)
print('by status:', by_status)
for k, v in sorted(by_char.items(), key=lambda x: -x[1][0]):
    print('  %-22s %3d lines  %5d chars' % (k, v[0], v[1]))
print('csv ->', csv_path)

# ---------------- emit Markdown ----------------
md = []
A = md.append
A('# PORTION CONTROL — VOICE-OVER MASTER SCRIPT')
A('')
A('> Every spoken line in the game, compiled for ElevenLabs (or any VO')
A('> pipeline). **Generated** by `tools/build_vo_script.py` from the')
A('> shipped source files + `STORY_SPEC.md` Part IV + `STORY_CAST_ADDENDUM.md`,')
A('> so the text here is byte-identical to what the game displays.')
A('> Machine-readable twin: **`docs/voice_lines.csv`** (one row per line,')
A('> ready for batch generation).')
A('')
A('**Totals: %d lines, %s characters of dialogue.**' % (len(rows), format(total_chars, ',')))
A('')
A('| Status | Lines | Meaning |')
A('|---|---|---|')
A('| SHIPPED | %d | In the game right now — recording these makes the playable slice fully voiced. |' % by_status.get('SHIPPED', 0))
A('| WRITTEN | %d | Locked dialogue for scenes not built yet (Stages 2-5, finale, flavor). Safe to record — the text will not change. |' % by_status.get('WRITTEN', 0))
A('| DRAFT | %d | Claude-drafted tutorial lines, **not yet approved by Mark**. Do not record until signed off. |' % by_status.get('DRAFT', 0))
A('')
A('| Character | Lines | Characters of text |')
A('|---|---|---|')
for k, v in sorted(by_char.items(), key=lambda x: -x[1][1]):
    A('| %s | %d | %s |' % (k, v[0], format(v[1], ',')))
A('')
A('---')
A('')
A('## 1. CASTING SHEET — voice design prompts')
A('')
A('Paste the prompt into ElevenLabs **Voice Design** (or use it to pick a')
A('library voice). Settings are starting points — the note in each row says')
A('what the character needs most.')
A('')
for key, name, blurb, prompt, settings in CAST:
    A('### %s  `%s`' % (name, key))
    A('')
    A('*%s*' % blurb)
    A('')
    A('**Voice prompt:** %s' % prompt)
    A('')
    A('**Settings:** %s' % settings)
    A('')
A('---')
A('')
A('## 2. THE LINES')
A('')
A('File IDs are the filenames the game will look for: `vo_<scene>_<nnn>_<speaker>.mp3`.')
A('Keep them exactly as written and drop the audio in `assets/vo/` — wiring is then automatic.')
A('')
for scene, status, title, lines in LINES:
    A('### %s  *(%s)*' % (title, status))
    A('')
    A('| File ID | Character | Delivery | Line |')
    A('|---|---|---|---|')
    for i, (spk, delivery, text) in enumerate(lines, 1):
        cast = next(c for c in CAST if c[0] == spk)
        safe = text.replace('|', '\\|')
        A('| `vo_%s_%03d_%s` | %s | %s | "%s" |' % (scene, i, spk, cast[1], delivery, safe))
    A('')
A('---')
A('')
A('## 3. HOW TO HAND THE AUDIO BACK')
A('')
A('1. Export **MP3, 44.1 kHz, 128 kbps, mono** (kid-friendly web game — file size matters more than fidelity).')
A('2. Name each file exactly its **File ID** + `.mp3`, e.g. `vo_intro_003_danny.mp3`.')
A('3. Drop them all in `games/portion-control/assets/vo/` and push (or hand me a zip).')
A('4. Nothing else needed — the loader picks up whatever exists.')
A('')
A('**What I build on that end** (not built yet, ~half a day once audio exists):')
A('')
A('- `PC.voice` loader + a `vo/manifest.js` list, lazy-loaded per scene so boot stays fast.')
A('- `PC.DialogueBox.show()` plays the matching clip, **ducks the music** ~60%, and')
A('  paces the typewriter to the clip length instead of a fixed 40 ch/s.')
A('- Tap-to-advance stops the clip; tap-to-reveal lets it keep playing.')
A('- Missing file = silent fallback to the current synth blips, so a partial')
A('  recording session ships fine — voiced lines are voiced, the rest are not.')
A('- A `VOICE` volume slider joins MUSIC and SOUND FX in settings.')
A('')
A('---')
A('')
A('## 4. ELEVENLABS NOTES')
A('')
A('- **Cost estimate:** ~%s characters total. Recording only the SHIPPED set' % format(total_chars, ','))
A('  (the playable slice) is ~%s characters — small enough to fit a starter tier.'
  % format(sum(r['chars'] for r in rows if r['status'] == 'SHIPPED'), ','))
A('- **Use v3 audio tags** for the emotional beats — they do a lot of work here.')
A('  Examples worth trying: `[whispers] I did this.` /')
A('  `[shouting] Super Dude... GO!` / `[sad] ...did I... not help?` /')
A('  `[laughs] Race you!` / `[nervous] ...the code-core. No—no-no-no—`')
A('- **Keep the em-dashes and ellipses.** They are deliberate performance beats;')
A('  ElevenLabs reads them as pauses and they are why the lines land.')
A('- **Consistency:** generate all of one character in a single session with a')
A('  pinned voice + settings, so a rescue line matches a finale line.')
A('- **CHOMP:** keep the voice itself clean and childlike. I add the robotic')
A('  character in-engine (ring-mod / bitcrush), which keeps it kid-friendly and')
A('  lets the sad line stay heartbreaking rather than creepy.')
A('- **Multi-take lines:** the chant needs one `For love—!` per rescuable hero')
A('  (Vic, Josh, Kevin, Carlos, Nayah) — same line, five voices. Name those')
A('  `vo_chant_002_vic.mp3`, `vo_chant_002_josh.mp3`, etc.')
A('')
md_path = os.path.join(DOCS, 'VOICE_SCRIPT.md')
open(md_path, 'w', encoding='utf-8').write('\n'.join(md) + '\n')
print('md  ->', md_path)
