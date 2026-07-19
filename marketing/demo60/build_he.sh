#!/bin/bash
cd /Users/yousef/Desktop/mumotor/marketing/demo60
rm -rf frames_he
node render_lang.mjs he full 2>&1 | tail -4
ffmpeg -y -framerate 30 -i frames_he/%04d.png -i audio/calm.wav \
  -map 0:v:0 -map 1:a:0 -c:v libx264 -pix_fmt yuv420p -crf 20 -preset medium \
  -c:a aac -b:a 192k -shortest demo_he.mp4 2>/dev/null
ls -la demo_he.mp4
rm -rf frames_he
echo HE_DONE
