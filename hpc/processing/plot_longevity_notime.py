
import auxiliary.processthread as process
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt 
import seaborn as sns
import numpy as np
import json 
import keywords

sns.set(style="whitegrid", rc={'figure.figsize':(10,5)})

def select(timestep, time):
    dctin = json.loads(timestep)
    if dctin['type'] == 'mito':
        return []
    dctin.update(dctin['evolvables'])
    dctin['evolvables'] = None
    return [dctin]

options = keywords.getarguments()

dfs = process.get(picklefname=keywords.nfile('longevity.pickle'),fname='deaths.txt',runs=keywords.getruns(),force=options.f, folder=keywords.getfoldername(), selector=select,  verbose=options.v,   sortbykeywordix=keywords.getkeywordix())
dfs2 = process.get(force=options.f, picklefname=keywords.nfile('longevity2.pickle'),runs=keywords.getruns(),folder="../211013_longevitynomut/",  selector=select, sortbykeywordix=keywords.getkeywordix(), sortbylineix=keywords.getlineix(),verbose=options.v)
print(dfs2.columns)
for path in dfs2:
    dfs[path] = dfs2[path]

# dfs = process.get(force=False, folder='./fisfus1', reverse=True,stop=1, selector=selectOnlyTime,  verbose=True,   sortbykeywordix=[("fission_rate", -1), ("fusion_rate", -1), ("deprecation_rate", -1)])
# print (dfs.keys())
processed = {}
for path in dfs: 
    pre_df = []
    params = {}
    # entry = {}
    for key, val in dfs[path].items():
        if key != 'data':
            params[key]=val
    for dct in dfs[path]['data']:
        # print(dct)
        dct.update(params)
        # for key, val in dct.items():
        #     dct[key] = float(val)
        pre_df.append(dct)
        # print(dct)s
    processed[path] = pd.DataFrame(pre_df)

# print(df)
# facecolor=plt.gcf().get_facecolor()
alldf = []
for path in processed:
    if options.v:
        print("making  " + path)
    df = processed[path]
    # df = df[(df['V']  < 30)]
    df = df[(df['type'] == 'host')]
    df['10loglongevity'] = np.log10(df['time'] - df['time of birth'])
    end = df['time'].iloc[-1]
    # print(end)
    if end < 50000:
        if options.v and not options.c:
            print("short run, only making with flag -c")
        if options.c:
            continue
    df = df[(df['time'] > 5000)]        
    # df = df[(df['dna'] == True)]
    # df['time'] = df['time'].round(decimals=-4)
    bins = 6
    # print(df['time'])
    # end = df['time'].iloc[-1]
    df['time'] = np.digitize(df['time'], np.linspace(0, end, bins+1), right=True)
    df['time'] = df['time'] * end/bins
    # print(df['time'])
    # df['time'] = np.digitize(df['time'], [range(0, df['time'].iloc[-1], 6)])
    # df = df.groupby(by='time').reset_index()
    df['path'] = path
    alldf.append(df)
    # if True:
    #     continue
    if df.empty:
        continue
    fig, ax = plt.subplots()
    # g = sns.scatterplot(data=df, x='time', y='longevity', ax=ax) 
    # df = df[(df['time of birth'] > 0)]
    # df= df[(df['time'] > 200000)]
    meltdf = pd.melt(df, id_vars=['rep'], value_vars=["10loglongevity"])
    # print(df)
  
exit(0)
df = pd.concat(alldf, ignore_index=True)
if options.v:
    print(df)
# print(df[df.index.duplicated()])
fig, ax = plt.subplots()
g = sns.pairplot(data=df, vars=["10loglongevity", 'fission_rate', "fusion_rate", 'HOST_V_PER_OXPHOS', 'host_division_volume'], kind='hist', hue='path')
# df = df[(df['time of birth'] > 0)]
# df = df[(df['longevity'] > 20000)]
# df= df[(df['time'] > 270000)]
# g = sns.scatterplot(data=df, x='time', y='longevity', hue='rep', palette='plasma', linewidth=0, ax=ax, alpha=0.5, s=5) 
# g = sns.jointplot(x='rep', y='longevity', data=df, kind='kde')
# df['fission rate'] *= 1000
# df['fusion_rate'] *= 1000
# df= df[(df['time'] > 270000)]
# g = sns.pairplot(data=df, vars=["longevity", 'fission rate', "fusion_rate", 'rep'], kind='hist')
# g = sns.pairplot(data=df, vars=["longevity", 'fission rate', "fusion_rate", 'rep'], plot_kws={'linewidth':0, 'alpha':0.6, 's':3}, hue='path')
# df['time'] = df['time'].round(decimals=-3)
# df = df.groupby(by='time').mean().reset_index()
# g = sns.pairplot(data=df, vars=['fission events', "fusion events", 'fission rate', "fusion_rate"], kind='hist')
# title = "time of life of hosts through time\n"
# for kw, ix in keywords.getkeywordix():
#     # print(title, kw, df[kw][0])
#     title += (kw + " = " + str(processed[path][kw][0]) + '\n')
# g.set_title(title, y=0.9)
fig.tight_layout()
# ax.title.set_y(0.5)
# fig.subplots_adjust(top=0.8)
plt.savefig(keywords.nfile("allpair.png"))
plt.close()
    