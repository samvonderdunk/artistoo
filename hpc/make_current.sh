# Uses preconfig.py and collect.py to convert a .js.tpl file (arg 2) and 
# move all new config files as config.js to ordered subfolders in 
# a new superfolder (arg 1)
# Copy number (arg 3) is handed over to preconfig, to make multiple
# copies of a parameter scan/seeded run (see preconfig.py help)

# USAGE: 
# ./make_current SUPERFOLDER_NAME CONFIGNAME.js.tpl COPY_NUMBER
# example:
#   ./make_current 211025_newsuperfolder config.js.tpl 5 


mkdir $1
cp $2 ./$1
python3 preconfig.py $2 $3
tplfile=$2

python3 ./collect.py run%%%%/config.js  "${tplfile:  0:$((${#tplfile}-7))}"*.js > tmp
mv run* $1/
