
import auxiliary.processthread as process
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt 
import seaborn as sns
import numpy as np
import json
import keywords

sns.set(style="whitegrid", rc={'figure.figsize':(10,3)})
options = keywords.getarguments()

def select(timestep, time):
    timestep = json.loads(timestep)
    out = []
    for hostId, host in timestep.items():
        out.append({"type":'host', "time":time, 'vol':host['vol'], 'total_vol':host['total_vol'],"id": hostId})
        # for mitoId, mito in host['subcells'].items():
        #    out.append({"type":'mito', "time":time, 'vol':mito['vol'], "id":mitoId})
    return out

# print(options.f)

dfs = process.get(picklefname=keywords.nfile("volumes.pickle"),runs=keywords.getruns(),force=options.f, folder=keywords.getfoldername(), selector=select,  verbose=options.v,   sortbykeywordix=keywords.getkeywordix(), sortbylineix=keywords.getlineix())


# dfs = process.get(force=False, folder='./fisfus1', reverse=True,stop=1, selector=selectOnlyTime,  verbose=True,   sortbykeywordix=[("fission_rate", -1), ("fusion_rate", -1), ("deprecation_rate", -1)])
# print (dfs.keys())
# processed = {}
# for path in dfs: 
#     pre_df = []
#     params = {}
#     # entry = {}
#     # for key, val in dfs[path].items():
#     #     if key != 'data':
#     #         params[key]=float(val)
#     for dct in dfs[path]['data']:
#         # print(dct)
#         # dct.update(params)
#         # for key, val in dct.items():
#         #     dct[key] = float(val)
#         pre_df.append(dct)
#         # print(dct)s
#     processed[path] = pd.DataFrame(pre_df)

# print(df)
# facecolor=plt.gcf().get_facecolor()
if True:
    for path in dfs:
        
        df = pd.DataFrame(dfs[path]['data'])
        # if dfs[path]['colorby'] != 'unmutated"':
        #     continue
        df = df[(df["time"] > 1000)]
        # df = df[(df["type"] == "mito")]
        # df = df.drop(columns=["type"])
        df['mito_vol'] = df['total_vol'] - df['vol']
        # df['time'] = df['time'].round(decimals=-3)
        
        # df = df.groupby(by=['time','id']).mean().reset_index()
        # df['vol'] = df['vol'].round(decimals=-1)
        # df = df.drop(columns=["id"])
        if options.v:
            print(path)
            print(df)
        # print(df[df['V']])
        if df['time'].iloc[-1] < 15000:
            continue
        fig, ax = plt.subplots()
        # counts = df.apply(pd.value_counts).fillna(0)
        g = sns.lineplot(data=df, x='time', y='vol', ax=ax)
        g2 = sns.lineplot(data=df, x='time', y='mito_vol', ax=ax)
        # g = sns.scatterplot(data=df, x='time', y='vol', ax=ax, s=0.5, alpha=0.1)
        # g2 = sns.scatterplot(data=df, x='time', y='mito_vol', ax=ax, s=0.5, alpha=0.1)
        # entries = []

        title = "volume through time\n"
        for key, val in dfs[path].items():
            if key != 'data':
                title += (key + " = " + str(val) + '\n')
        g.set_title(title, y=0.9)
        # for kw, ix in keywords.getkeywordix():
        
        fig.tight_layout()
        # ax.title.set_y(0.5)
        # fig.subplots_adjust(top=0.8)
        plt.savefig(keywords.nfile("volumes/scatter"+ path[-4:] +".png"))
        plt.close("all")


if False:
    means = []
    variances = []
    for path in dfs:
        df = pd.DataFrame(dfs[path]['data'])
        df = df[(df["time"] > 1000)]
        df['time'] = df['time'].round(decimals=-3)
        df = df.groupby(by=['time','id']).mean().reset_index()
        df = df[(df["type"] == "mito")]
        df = df.drop(columns=["type"])
        df["path"] = int(path[-2:])
        means.append(df.groupby(["time", "path"]).mean().reset_index())
        variances.append(df.groupby(["time", "path"]).var().reset_index())
       
        print(means)
    meandf = pd.concat(means)
    vardf = pd.concat(variances)
    meandf['time'] = df['time'].round(decimals=-3)
    vardf['time'] = df['time'].round(decimals=-3)
    fig, ax = plt.subplots()
    g = sns.lineplot(data=meandf, x='time', y='vol', hue="path", lw=1, palette="plasma", ax=ax) 
    g.set_title("mean volume through time")
    fig.tight_layout()
    plt.savefig("current_processing/volume_mean.png")
    plt.close()
    fig, ax = plt.subplots()
    g = sns.lineplot(data=vardf, x='time', y='vol', hue="path", lw=1, palette="plasma", ax=ax) 
    g.set_title("variance volume through time")
    fig.tight_layout()
    plt.savefig("current_processing/volume_variance.png")
    plt.close()
