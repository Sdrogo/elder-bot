#!/usr/bin/env bash
# Builds one emoji per die value (assets/dice/1.png … 10.png) from the artwork in
# assets/dice/art, with the value drawn on the face so it always sits with its die.
# Needs ImageMagick 6 (`convert`). Run from the repository root.
set -euo pipefail
cd assets/dice
FONT=DejaVu-Sans-Bold
SIZE=128

number() { # $1 = text, $2 = output image to draw on
  convert "$2" -gravity southeast -font "$FONT" -pointsize 50 \
    -stroke '#1e1f22' -strokewidth 8 -annotate +2+0 "$1" \
    -stroke none -fill white -annotate +2+0 "$1" "$2"
}

art() { # $1 = artwork, $2 = output, $3 = artwork height (default: full)
  convert -size ${SIZE}x${SIZE} xc:none \( "art/$1.png" -resize "x${3:-$SIZE}" \) \
    -gravity northwest -geometry +6+0 -composite "$2"
}

art one 1.png 96 && number 1 1.png
for v in 2 3 4 5 6 7; do
  convert -size 512x512 xc:none -fill '#8c8c8c' -draw 'circle 256 256 256 456' \
    -gravity center -font "$FONT" -pointsize 240 -fill white -annotate +0+8 "$v" \
    -resize ${SIZE}x${SIZE} "$v.png"
done
for v in 8 9; do art success "$v.png" && number "$v" "$v.png"; done
art ten 10.png && number 10 10.png
