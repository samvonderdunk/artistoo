
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

def select(timestep, time):
    timestep = json.loads(timestep)
    out = []
    min_unmut = 1
    for hostId, host in timestep.items():
        host_ndna = 0
        host_unmut = 0
        # for mitoId, mito in host['subcells'].items():
        #     host_ndna += mito['n DNA']
        #     if mito['n DNA'] > 0:
        #         host_unmut += mito['unmut'] *mito['n DNA']
        dctout = {"time":timestep['time'], "id":hostId}
        dctout.update(host['evolvables'])
        # print(dctout)
        out.append(dctout)
        
    return out


# picklefname='./ndna_at_death.pickle'
# dfs = process.get(force=False, folder='../current', reverse=False, selector=select, start=0,  verbose=True,   sortbykeywordix=[("fission_rate", -1), ("fusion_rate", -1), ("deprecation_rate", -1), ("division_volume", -1)])
dfs = []
for ix, folder in enumerate(["../210923_mutlifetime/", "../210927_mutrange2/"]):
    dfs.extend(process.get(force=options.f, picklefname=keywords.nfile(str(ix) +"evolvablesrev.pickle"),runs=keywords.getruns(),folder=folder,  selector=select, reverse=True, stop=100,  sortbykeywordix=keywords.getkeywordix(), sortbylineix=keywords.getlineix(),verbose=options.v))

# print(df)
# facecolor=plt.gcf().get_facecolor()

alldf = []
for path in dfs:
    df = pd.DataFrame(dfs[path]['data'])
    if df['time'].iloc[-1] < 15000:
        if options.v:
            print(path, "not making plot due to early end")
        continue
    if options.v:
        print(path, " making plot")
    
    # only take count individuals once
    # df = df.groupby(['id']).mean().reset_index()
    df = df.groupby(['id']).first()
    for colname, col in df.iteritems():
        if col.iloc[0] != 0:
            col /= col[0]
    # df["path"] = path
    df["NDNA_MUT_LIFETIME"] = dfs[path]["NDNA_MUT_LIFETIME"]
    alldf.append(df)

alldf= pd.concat(alldf, ignore_index=True)
alldf = pd.melt(alldf)
g = sns.swarmplot(data=alldf,x='variable', y='value', hue="NDNA_MUT_LIFETIME",palette="flare", ax=ax) 
g.set_title("evolvables at end of run (not all ran to end)")
fig.tight_layout()
plt.savefig(keywords.nfile("evolvablesmutsfirst.png"))
plt.savefig(keywords.nfile("evolvablesmutsfirst.svg"))
plt.close()
   