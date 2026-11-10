#!/usr/bin/env bash
# build_itch.sh - packs the itch.io HTML5 upload.
#   dist/portion-control-<version>-itch.zip
# index.html sits at the ZIP ROOT (itch requires it), and only what the
# game actually loads goes in: index.html, version.json, src/, vendor/,
# assets/, CREDITS.txt. Docs, concepts, tools and markdown stay out.
# Refuses to build if PC_BUILD and version.json disagree (the lockstep
# pair - a mismatch makes the self-healing loader reload forever-ish).
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$PWD"

VER=$(sed -n "s/.*PC_BUILD = '\([0-9.]*\)'.*/\1/p" index.html | head -1)
JV=$(sed -n 's/.*"build": *"\([0-9.]*\)".*/\1/p' version.json | head -1)
if [ -z "$VER" ] || [ "$VER" != "$JV" ]; then
  echo "ERROR: index.html PC_BUILD ($VER) != version.json ($JV)" >&2
  exit 1
fi

OUT="$ROOT/dist/portion-control-$VER-itch.zip"
STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT

cp index.html version.json CREDITS.txt "$STAGE"/
cp -r src vendor assets "$STAGE"/
find "$STAGE" \( -name '.DS_Store' -o -name '*.md' -o -name 'Thumbs.db' \) -delete

mkdir -p "$ROOT/dist"
rm -f "$OUT"
(cd "$STAGE" && zip -qr -X "$OUT" .)

FILES=$(cd "$STAGE" && find . -type f | wc -l | tr -d ' ')
RAW=$(du -sh "$STAGE" | cut -f1)
ZIPSZ=$(du -h "$OUT" | cut -f1)
echo "built $OUT"
echo "  version $VER | $FILES files | $RAW unpacked | $ZIPSZ zipped"
