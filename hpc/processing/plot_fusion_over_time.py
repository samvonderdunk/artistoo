
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
plt.rcParams['pdf.fonttype'] =  42
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
dfs = process.get(force=options.f, picklefname=keywords.nfile("evolvables.pickle"),runs=keywords.getruns(),folder=keywords.getfoldername(),  selector=select,  sortbykeywordix=keywords.getkeywordix(), sortbylineix=keywords.getlineix(),verbose=options.v, load = options.l)
dfs2 = process.get(picklefname="../210923_mutlifetime/processing/evolvables.pickle",runs=keywords.getruns(),force=options.f, folder='../210923_mutlifetime/', selector=select,  verbose=options.v,   sortbykeywordix=keywords.getkeywordix(), sortbylineix=keywords.getlineix(), load=options.l)
# dfs2 = process.get(force=options.f, picklefname=keywords.nfile("evolvablesrev.pickle"),runs=keywords.getruns(),folder="../210927_mutrange2",  selector=select, reverse=True, stop=500,  sortbykeywordix=keywords.getkeywordix(), sortbylineix=keywords.getlineix(),verbose=options.v)
# print(dfs2.columns)
for path in dfs2:
    dfs[path] = dfs2[path]
# print(df)
# facecolor=plt.gcf().get_facecolor()
alldf =[]
for path in dfs:
    df = pd.DataFrame(dfs[path]['data'])
    
    # df['fusion_rate'] = df['fusion_rate'] *1000000
    if df['time'].iloc[-1] < 150000:
        if options.v:
            print(path, "not making plot due to early end")
        continue
    if options.v:
        print(path, " making plot")
    for key, val in dfs[path].items():
        if key != 'data':
            # title += (key + " = " + str(val) + '\n')
            df[key] = val
    # df = df[(df['time'] %10000 == 0)]

    if options.v:
        print( df['fusion_rate'])
    df['path'] = path
    alldf.append(df)

alldf= pd.concat(alldf, ignore_index=True)
order = sorted(alldf["NDNA_MUT_LIFETIME"].unique())
g = sns.FacetGrid(data=alldf,  row="NDNA_MUT_LIFETIME", hue="path", sharex=True,sharey=True, palette='colorblind', row_order=order, aspect=3, height=4)
g.map(sns.scatterplot, 'time', 'fusion_rate', linewidth=0, s=0.1, alpha=0.7, rasterized=True)

# plt.savefig(keywords.nfile("evolvables/fusionperiod"+ path[-4:] +".svg"), dpi=600)
# fig, ax = plt.subplots()
plt.savefig(keywords.nfile("allfusionperiod.pdf"), dpi=600)
plt.savefig(keywords.nfile("allfusionperiod.png"), dpi=600)
# g.map(fixed_boxplot, "rep", "value", order=reporder)





    # fig, ax = plt.subplots()
    
    # # g = sns.lineplot(data=df, x='time', y='value',  hue="variable", palette="colorblind", ax=ax) 
    # g = sns.scatterplot(data=df, x='time', y='fusion_rate', linewidth=0, palette="colorblind", ax=ax, s=1, alpha=1) 
    # plt.legend(loc="upper left")
    # title = "fusion rate through time\n"
    # for key, val in dfs[path].items():
    #     if key != 'data':
    #         title += (key + " = " + str(val) + '\n')
    # g.set_title(title, y=0.85)
    # fig.tight_layout()
    # # ax.title.set_y(0.5)
    # fig.subplots_adjust(top=0.75)
    # plt.savefig(keywords.nfile("evolvables/fusionperiod"+ path[-4:] +".svg"), dpi=600)
    # plt.savefig(keywords.nfile("evolvables/fusionperiod"+ path[-4:] +".png"), dpi=600)
    # plt.close()


   