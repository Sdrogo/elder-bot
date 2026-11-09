#!/usr/bin/env bash
# Builds one emoji per die value (assets/dice/1.png … 10.png, and h1.png … h10.png for
# Hunger dice) from the artwork in
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

dot() { # $1 = value, $2 = colour, $3 = output: a plain failure
  convert -size 512x512 xc:none -fill "$2" -draw 'circle 256 256 256 456' \
    -gravity center -font "$FONT" -pointsize 240 -fill white -annotate +0+8 "$1" \
    -resize ${SIZE}x${SIZE} "$3"
}

# Normal dice: a 1 is just a failure; successes on 6+, a 10 counts twice.
for v in 1 2 3 4 5; do dot "$v" '#8c8c8c' "$v.png"; done
for v in 6 7 8 9; do art success "$v.png" && number "$v" "$v.png"; done
art ten 10.png && number 10 10.png

# Hunger dice (h1 … h10), in red: a 1 is the skull of a Bestial Failure.
art one h1.png 96 && number 1 h1.png
for v in 2 3 4 5; do dot "$v" '#7a1f1f' "h$v.png"; done
for v in 6 7 8 9; do art hunger-success "h$v.png" && number "$v" "h$v.png"; done
art hunger-ten h10.png && number 10 h10.png
