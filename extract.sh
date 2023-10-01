#!/bin/bash

method01() {
  rm -rf screens/*.jpg
  ffmpeg -i samples/waves.mkv -filter:v fps=fps=1 screens/01_%03d.jpg
}

method02() {
  rm -rf screens/*.jpg
  ffmpeg -i samples/waves.mkv -r 1/1 screens/02_%03d.jpg
}

method03() {
  rm -rf screens/*.jpg
  for i in {0..28}; do ffmpeg -accurate_seek -ss "$i" -i samples/waves.mkv -frames:v 1 "screens/03_$i.jpg"; done
}

export -f method01 method02 method03

hyperfine --shell=bash method01 method02 method03 --export-markdown extract.md # --show-output
