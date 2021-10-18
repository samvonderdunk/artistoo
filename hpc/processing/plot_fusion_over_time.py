
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
        for mitoId, mito in host['subcells'].items():
            host_ndna += mito['n DNA']
            if mito['n DNA'] > 0:
                host_unmut += mito['unmut'] *mito['n DNA']
        dctout = {"time":time}
        dctout.update(host['evolvables'])
        # print(dctout)
        out.append(dctout)
        
    return out


# picklefname='./ndna_at_death.pickle'
# dfs = process.get(force=False, folder='../current', reverse=False, selector=select, start=0,  verbose=True,   sortbykeywordix=[("fission_rate", -1), ("fusion_rate", -1), ("deprecation_rate", -1), ("division_volume", -1)])
dfs = process.get(force=options.f, picklefname=keywords.nfile("evolvables.pickle"),runs=keywords.getruns(),folder=keywords.getfoldername(),  selector=select,  sortbykeywordix=keywords.getkeywordix(), sortbylineix=keywords.getlineix(),verbose=options.v)

# print(df)
# facecolor=plt.gcf().get_facecolor()

for path in dfs:
    df = pd.DataFrame(dfs[path]['data'])
    if df['time'].iloc[-1] < 15000:
        if options.v:
            print(path, "not making plot due to early end")
        continue
    if options.v:
        print(path, " making plot")

    if options.v:
        print( df)
    fig, ax = plt.subplots()
    
    # g = sns.lineplot(data=df, x='time', y='value',  hue="variable", palette="colorblind", ax=ax) 
    g = sns.scatterplot(data=df, x='time', y='fusion_rate',  hue="variable", linewidth=0, palette="colorblind", ax=ax, s=0.5, alpha=0.01) 
    plt.legend(loc="upper left")
    title = "fusion rate through time\n"
    for key, val in dfs[path].items():
        if key != 'data':
            title += (key + " = " + str(val) + '\n')
    g.set_title(title, y=0.85)
    fig.tight_layout()
    # ax.title.set_y(0.5)
    fig.subplots_adjust(top=0.75)
    plt.savefig(keywords.nfile("evolvables/fusion"+ path[-4:] +".svg"), dpi=600)
    plt.savefig(keywords.nfile("evolvables/fusion"+ path[-4:] +".png"), dpi=600)
    plt.close()


   