#!/bin/bash
cd /Users/yousef/Desktop/mumotor/marketing/demo60
for L in ar he; do
  echo "=== render $L ==="
  rm -rf frames_$L
  node render_lang.mjs $L full 2>&1 | tail -3
  echo "=== encode $L ==="
  ffmpeg -y -framerate 30 -i frames_$L/%04d.png -i audio/calm.wav \
    -map 0:v:0 -map 1:a:0 -c:v libx264 -pix_fmt yuv420p -crf 20 -preset medium \
    -c:a aac -b:a 192k -shortest demo_$L.mp4 2>/dev/null
  ls -la demo_$L.mp4
  rm -rf frames_$L
done
echo "ALL_DONE"
