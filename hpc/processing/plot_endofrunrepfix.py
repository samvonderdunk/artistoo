
import auxiliary.processthread as process
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt 
import seaborn as sns
import numpy as np
import json
import keywords
import argparse

options = keywords.getarguments()
plt.rcParams['svg.fonttype'] = 'none'
sns.set(style="whitegrid", rc={'figure.figsize':(10,3)})


def fixed_boxplot(*args, label=None, **kwargs):
    sns.boxplot(*args, **kwargs, labels=[label])

def select(timestep, time):
    timestep = json.loads(timestep)
    out = []
    min_unmut = 1
    for hostId, host in timestep.items():
        dctout = {"time":host['time'], "id":hostId}
        dctout.update(host['evolvables'])
        # print(dctout)
        out.append(dctout)
        
    return out


# picklefname='./ndna_at_death.pickle'
# dfs = process.get(force=False, folder='../current', reverse=False, selector=select, start=0,  verbose=True,   sortbykeywordix=[("fission_rate", -1), ("fusion_rate", -1), ("deprecation_rate", -1), ("division_volume", -1)])
dfs = process.get(force=options.f, picklefname=keywords.nfile("2evolvablesrev.pickle"),runs=keywords.getruns(),folder=keywords.getfoldername(),  selector=select, reverse=True, stop=500,  sortbykeywordix=keywords.getkeywordix(), sortbylineix=keywords.getlineix(),verbose=options.v)
print(dfs)
# exit(1)
# dfs2 = process.get(force=options.f, picklefname=keywords.nfile("evolvablesrev.pickle"),runs=keywords.getruns(),folder="../210927_mutrange2",  selector=select, reverse=True, stop=500,  sortbykeywordix=keywords.getkeywordix(), sortbylineix=keywords.getlineix(),verbose=options.v)
# print(dfs2.columns)
# for path in dfs2:
#     dfs[path] = dfs2[path]
# # dfs= pd.concat([dfs,dfs2])
# # dfs = pd.DataFrame(dfs)
# print(dfs)
# exit(1)
# print(df)
# facecolor=plt.gcf().get_facecolor()

alldf = []
for path in dfs:
    print(path)
    df = pd.DataFrame(dfs[path]['data'], dtype=np.float32)
    # print(df)
    # print(df['time'])
    
    if df['time'].iloc[-1] < 300000:
        if options.v:
            print(path, "not making plot due to early end")
        continue
    if options.v:
        print(path, " altering data")
    
    # only take count individuals once
    # df = df.groupby(['id']).mean().reset_index()
    # print(df.columns)
    df = df.groupby('id').first()
    # for colname, col in df.iteritems():
    #     try:
    #         if col.iloc[0] != 0:
    #             col /= col[0]
    #     except:
    #         pass
    for kw, ix in keywords.getkeywordix():
        # print(title, kw, df[kw][0])
        # print(kw, dfs[path][kw ])
        # if kw == "rep":
        #     continue
        df[kw] = float(dfs[path][kw])
    
    # df["path"] = path
    # df["rep"] = dfs[path]["rep"]
    df = df.drop(["seed"], axis=1)
    df['path'] = int(path[-3:])
    alldf.append(df)

fig, ax = plt.subplots()
alldf= pd.concat(alldf, ignore_index=True)
print(alldf.columns)
# print(alldf['rep'])
alldf = pd.melt(alldf, id_vars=["rep","NDNA_MUT_LIFETIME", "path"])
print(alldf)
order = sorted(alldf['variable'].unique())
reporder = sorted(alldf["rep"].unique())
alldf['value'] = alldf['value'] * 1000
g = sns.FacetGrid(alldf, col="variable",row="NDNA_MUT_LIFETIME", hue="path", sharex=False,sharey=False, palette='cubehelix', col_order=order, aspect=1.3)
# g.map(fixed_boxplot, "rep", "value", order=reporder)
g.map(sns.swarmplot, "rep", "value", order=reporder, s=3)
g.set_titles('{col_name}x1000')
g.add_legend()
fig.tight_layout()
plt.savefig(keywords.nfile("compareevolvablesmutsfirst.png"))
plt.savefig(keywords.nfile("compareevolvablesmutsfirst.svg"))
plt.close()
   