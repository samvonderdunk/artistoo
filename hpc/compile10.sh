#!/usr/bin/env bash

path='./'
path+=$1
path+="run%04d"
#echo $(($PARALLEL_SEQ -1))
#echo $PARALLEL_SEQ
cd $(printf "$path" $(($2)))
# pwd
#cat ~/artistoo/build/artistoo-cjs.js
# rm *.txt > tmpout

# echo "video_unmut_${$1}"
# ffmpeg -y -r 6 -i Mitochondria-t%d0.png -pix_fmt yuv420p -c:v libx264 -crf 18 -preset fast -level:v 4.0 -hide_banner -loglevel error -codec:a aac  video_unmut.mp4 >tmpout.txt
# ffmpeg -y -r 60 -i Mitochondria-t%d0.png -pix_fmt yuv420p -c:v libx264 -crf 18 -preset fast -level:v 4.0 -hide_banner -loglevel error -codec:a aac  ../video_intermediate_$1.mp4 >tmpout.txt
# ls Mitochondria-fraction_unmutated-t*.png
# rm -f intermediate_video_unmut_$2.mp4
# rm -f intermediate_video_ndna_$2.mp4
# rm -f intermediate_video_oxphos_$2.mp4
# rm -f  ../intermediate_video_all_$2.mp4
ffmpeg -y -r 60 -i Mitochondria-fraction_unmutated-t%d0.png -pix_fmt yuv420p -c:v libx264 -crf 25 -preset fast -level:v 4.0  -codec:a aac  -hide_banner -loglevel error -nostdin ../intermediate_video_unmut_$2.mp4 >tmpout.txt
ffmpeg -y -r 60 -i Mitochondria-n_DNA-t%d0.png -pix_fmt yuv420p -c:v libx264 -crf 25 -preset fast -level:v 4.0 -hide_banner -loglevel error -nostdin -codec:a aac  intermediate_video_ndna_$2.mp4 >tmpout.txt
ffmpeg -y -r 60 -i Mitochondria-oxphos_avg-t%d0.png -pix_fmt yuv420p -c:v libx264 -crf 25 -preset fast -level:v 4.0 -hide_banner -loglevel error -nostdin -codec:a aac  intermediate_video_oxphos_$2.mp4 >tmpout.txt
ffmpeg -y -i ../intermediate_video_unmut_$2.mp4 -i ./intermediate_video_ndna_$2.mp4 -i ./intermediate_video_oxphos_$2.mp4 -filter_complex "[1:v][0:v]scale2ref=oh*mdar:ih[1v][0v];[2:v][0v]scale2ref=oh*mdar:ih[2v][0v];[0v][1v][2v]hstack=3,scale='2*trunc(iw/2)':'2*trunc(ih/2)'" -hide_banner -loglevel error -nostdin ../intermediate_video_all_$2.mp4
# find . -name "Mitochondria*.png" -delete 
