Super Dude Danny - assets folder
================================

This proof of concept uses hand-coded pixel art generated in js/sprites.js, so
no image files are required for the game to run.

SWAPPING IN THE REAL CHURCH LOGO
--------------------------------
The intro card currently shows a placeholder "Church of the Crossroads" logo
drawn in code. To use the real logo instead:

  1. Save the logo image into this folder as:  logo.png
  2. Open js/sprites.js and find the comment block marked
       "LOGO SWAP POINT"
     Follow the two-line instruction there to load logo.png.

That is the only change needed - the intro card will display the real image,
scaled to fit, automatically.

SWAPPING IN FINAL ART AND MUSIC LATER
-------------------------------------
- Sprites are defined as small pixel maps in js/sprites.js. Each sprite can be
  replaced by loading a PNG instead - the rest of the game references sprites
  by name only.
- Music and sound effects are synthesized in js/audio.js (Web Audio API) and
  can be replaced with real audio files in a later pass.
