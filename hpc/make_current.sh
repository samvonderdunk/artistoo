mkdir $1
cp $2 ./$1
python3 preconfig.py $2 $3
tplfile=$2
# echo "${tplfile::-7}"
python3 ~/collect.py run%%%%/config.js  "${tplfile::-7}"*.js > tmp
mv run* $1/
