#!/usr/bin/env bash
# Builds one emoji per die face, shaped like a d10 with its value on the front face:
# assets/dice/1.png … 10.png for normal dice and h1.png … h10.png for Hunger dice.
# Needs ImageMagick 6 (`convert`). Run from the repository root.
set -euo pipefail
cd assets/dice
FONT=DejaVu-Sans-Bold

# A d10 seen from the front: a kite-shaped front face between two side faces.
T=256,16; L=44,240; R=468,240; B=256,496; IL=150,262; IR=362,262; IB=256,372
d10() { # $1 value, $2 front face, $3 side faces, $4 lower faces and edges, $5 number, $6 output
  local size=175
  [ ${#1} -gt 1 ] && size=135
  convert -size 512x512 xc:none \
    -stroke none \
    -fill "$3" -draw "polygon $T $R $IR $IB $IL $L" \
    -fill "$4" -draw "polygon $L $IL $IB $B" -draw "polygon $R $IR $IB $B" \
    -fill "$2" -draw "polygon $T $IR $IB $IL" \
    -stroke "$4" -strokewidth 12 -fill none \
    -draw "polyline $L $IL $T" -draw "polyline $R $IR $T" \
    -draw "polyline $IL $IB $IR" -draw "line $IB $B" \
    -strokewidth 18 -draw "polygon $T $R $B $L" \
    -gravity center -font "$FONT" -pointsize $size \
    -stroke '#1e1f22' -strokewidth 22 -annotate +0-22 "$1" \
    -stroke none -fill "$5" -annotate +0-22 "$1" \
    -resize 128x128 "$6"
}

# Normal dice: grey failures (a 1 means nothing), green successes on 6+, bright green 10.
for v in 1 2 3 4 5; do d10 "$v" '#9e9e9e' '#757575' '#424242' white "$v.png"; done
for v in 6 7 8 9; do d10 "$v" '#43c15a' '#2e9a40' '#1b5e20' white "$v.png"; done
d10 10 '#7dffa0' '#3df065' '#1b8a3a' white 10.png

# Hunger dice, in red: a 1 is black with a red number, the risk of a Bestial Failure.
d10 1 '#2b2b2b' '#1a1a1a' '#b71c1c' '#ff3d3d' h1.png
for v in 2 3 4 5; do d10 "$v" '#8e2a2a' '#6d1f1f' '#3d0d0d' white "h$v.png"; done
for v in 6 7 8 9; do d10 "$v" '#e53935' '#b71c1c' '#6a0f0f' white "h$v.png"; done
d10 10 '#ff6b6b' '#ff3d3d' '#a31515' white h10.png
