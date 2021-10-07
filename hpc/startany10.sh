#!/usr/bin/env bash


path='./'
path+=$1
path+="run%04d"
# echo "$path/run%04d" $(($2))
cd $(printf "$path" $(($2)))

#cat ~/artistoo/build/artistoo-cjs.js
# rm *.txt > tmpout
node config.js "$1" "$2" 
# echo "video_unmut_${$1}"
# ffmpeg -y -r 6 -i Mitochondria-t%d0.png -pix_fmt yuv420p -c:v libx264 -crf 18 -preset fast -level:v 4.0 -hide_banner -loglevel error -codec:a aac  video_unmut.mp4 >tmpout.txt
# ffmpeg -y -r 60 -i Mitochondria-t%d0.png -pix_fmt yuv420p -c:v libx264 -crf 18 -preset fast -level:v 4.0 -hide_banner -loglevel error -codec:a aac  video_unmut_$2.mp4 >tmpout.txt
# find . -name "Mitochondria-t*.png" -delete 

ffmpeg -y -r 60 -i Mitochondria-fraction_unmutated-t%d0.png -pix_fmt yuv420p -c:v libx264 -crf 18 -preset fast -level:v 4.0 -hide_banner -loglevel error -codec:a aac -nostdin   video_unmut_$2.mp4 >tmpout.txt
ffmpeg -y -r 60 -i Mitochondria-n_DNA-t%d0.png -pix_fmt yuv420p -c:v libx264 -crf 18 -preset fast -level:v 4.0 -hide_banner -loglevel error -codec:a aac -nostdin   video_ndna_$2.mp4 >tmpout.txt
ffmpeg -y -r 60 -i Mitochondria-oxphos_avg-t%d0.png -pix_fmt yuv420p -c:v libx264 -crf 18 -preset fast -level:v 4.0 -hide_banner -loglevel error -codec:a aac -nostdin   video_oxphos_$2.mp4 >tmpout.txt
ffmpeg -y -i video_unmut_$2.mp4 -i video_ndna_$2.mp4 -i video_oxphos_$2.mp4 -filter_complex "[1:v][0:v]scale2ref=oh*mdar:ih[1v][0v];[2:v][0v]scale2ref=oh*mdar:ih[2v][0v];[0v][1v][2v]hstack=3,scale='2*trunc(iw/2)':'2*trunc(ih/2)'" -hide_banner -loglevel error -nostdin  video_all_$2.mp4
find . -name "Mitochondria*.png" -delete 