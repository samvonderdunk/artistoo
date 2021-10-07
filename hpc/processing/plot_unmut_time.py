
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
            # heteroplasmy.append([time, int(mitoId), mito["n DNA"], mito["unmut"], mito['translate']])
            # host_ndna += mito["n DNA"]
            # if mito["unmut"]  is not None:
                # min_unmut = min(min_unmut, float(mito["unmut"]))
        # if len(host['subcells']) > 0:
        #     host_unmut /= len(host['subcells']
        out.append({"host":hostId, "time":time, "n DNA":host_ndna, "unmut":host_unmut})
    return out

def draw_heatmap(*args, **kwargs):
    data = kwargs.pop('data')
    d = data.pivot(index=args[1], columns=args[0], values=args[2])
    sns.heatmap(d, **kwargs)

# picklefname='./ndna_at_death.pickle'
# dfs = process.get(force=False, folder='../current', reverse=False, selector=select, start=0,  verbose=True,   sortbykeywordix=[("fission_rate", -1), ("fusion_rate", -1), ("deprecation_rate", -1), ("division_volume", -1)])
dfs = process.get(force=options.f, picklefname=keywords.nfile("unmut.pickle"),runs=keywords.getruns(),folder=keywords.getfoldername(),  selector=select,  verbose=options.v,   sortbykeywordix=keywords.getkeywordix())
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
        pre_df.append(dct)
        # print(dct)s
    processed[path] = pd.DataFrame(pre_df)

# print(df)
# facecolor=plt.gcf().get_facecolor()
if True:
    for path in processed:
        if options.v:
            print(path, " making plot")
        df = processed[path]
        # print(df)
        # keywords.rename(df)
        fig, ax = plt.subplots()

        df['time'] = df['time'].round(decimals=-3)
        df = df.groupby(by=["time"]).mean().reset_index()
        # df['unmut'] /= df['n DNA']
        df ['mut'] = df['n DNA'] - df['unmut']
        # df['time'] = df['time'].round(decimals=-3)
        g = sns.lineplot(data=df, x='time', y='mut', lw=1, palette="colorblind", legend=None, ax=ax) 
        title = "Mutated DNA per host through time\n"
        # for kw, ix in keywords.getkeywordix():
        #     # print(title, kw, df[kw][0])
        #     title += (kw + " = " + str(df[kw][0]) + '\n')
        g.set_title(title)
        fig.tight_layout()
        # ax.title.set_y(0.5)
        fig.subplots_adjust(top=0.8)
        plt.savefig(keywords.nfile("processing/unmut/mut mean through time of "+ path[-4:] +".png"))
        plt.close('all')

if True:
    alldf = []
    for path in processed:
        df = processed[path]
        df['time'] = df['time'].round(decimals=-3)
        df['unmut'] /= df['n DNA']
        df = df.groupby(["time", "SELECTIVE_FUSION"]).mean().reset_index()
        # print(df)
        df['path'] = path
        alldf.append(df)
    alldf= pd.concat(alldf, ignore_index=True)
    if options.v:
        print(alldf)
    sns.lineplot(data=alldf, x='time', y='unmut',hue="SELECTIVE_FUSION", lw=1, palette="colorblind")
    plt.savefig(keywords.nfile("processing/allunmut_time"))

# fg = keywords.getfacetgrid(df)
# fg.map_dataframe(draw_heatmap, 'fission_rate', 'fusion_rate', 'unmut', cbar=False, annot=True, square = True, label='small', fmt='.1f')
# for ax in fg.axes.flat:
#     ax.set_aspect('equal','box')
# fg.fig.tight_layout()

# fg.fig.suptitle("mean percentage unmutated DNA per vesicle at last 400 MCS")
# plt.savefig("current_processing/unmut vesicle at end.png")


