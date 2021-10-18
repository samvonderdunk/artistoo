
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

dfs = process.get(picklefname=keywords.nfile("volumes.pickle"),runs=keywords.getruns(),force=options.f, folder=keywords.getfoldername(), selector=select,  verbose=options.v,   sortbykeywordix=keywords.getkeywordix(), sortbylineix=keywords.getlineix(), load =options.l)
dfs2 = process.get(picklefname="../210923_mutlifetime/processing/volumes.pickle",runs=keywords.getruns(),force=options.f, folder=keywords.getfoldername(), selector=select,  verbose=options.v,   sortbykeywordix=keywords.getkeywordix(), sortbylineix=keywords.getlineix(), load=options.l)
# print(dfs2.columns)
for path in dfs2:
    dfs[path] = dfs2[path]

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
alldf =[]
if True:
    for ix, path in enumerate(dfs):
        
        df = pd.DataFrame(dfs[path]['data'])
        # if dfs[path]['colorby'] != 'unmutated"':
        #     continue
        df = df[(df["time"] > 1000)]
        df = df[(df["time"] % 100 == 0)]
        # df = df[(df["type"] == "mito")]
        # df = df.drop(columns=["type"])
        df['mito_vol'] = df['total_vol'] - df['vol']
        # df['time'] = df['time'].round(decimals=-3)
        
        df = df.groupby(by=['time']).mean().reset_index()
        # df['vol'] = df['vol'].round(decimals=-1)
        # df = df.drop(columns=["id"])
        if options.v:
            print(path)
            print(df)
        for key, val in dfs[path].items():
            if key != 'data':
                # title += (key + " = " + str(val) + '\n')
                df[key] = val
        # print(df[df['V']])
        if df['time'].iloc[-1] < 15000:
            continue
        fig, ax = plt.subplots()
        # counts = df.apply(pd.value_counts).fillna(0)
        # g = plt.stackplot(df['time'], [df['mito_vol'], df['vol']], labels=["mito vol", "cell vol"])
        g = sns.scatterplot(data=df, x='time', y='mito_vol', ax=ax, s=1, alpha=1)
        g2 = sns.scatterplot(data=df, x='time', y='total_vol', ax=ax, s=1, alpha=1)
        # entries = []
        df['fractional'] = df['mito_vol']/df['total_vol']

        title = "volume through time\n"
        for key, val in dfs[path].items():
            if key != 'data':
                title += (key + " = " + str(val) + '\n')
        ax.set_title(title, y=0.9)
        # for kw, ix in keywords.getkeywordix():
        
        fig.tight_layout()
        # ax.title.set_y(0.5)
        # fig.subplots_adjust(top=0.8)
        plt.savefig(keywords.nfile("volumes/scatter"+ str(ix) + path[-4:] +".png"))
        plt.savefig(keywords.nfile("volumes/scatter"+ str(ix) + path[-4:] +".svg"))
        plt.close("all")
        alldf.append(df)


alldf= pd.concat(alldf, ignore_index=True)
if True:
    means = []
    variances = []
    
    # meandf = pd.ariances)
    # alldf['time'] = df['time'].round(decimals=-3)
    # vardf['time'] = df['time'].round(decimals=-3)
    
    alldf = alldf.groupby(['time','NDNA_MUT_LIFETIME', 'path']).mean().reset_index()
    if options.v:
       print(alldf)
    fig, ax = plt.subplots()
    g = sns.lineplot(data=alldf, x='time', y='fractional', hue="NDNA_MUT_LIFETIME", lw=1, palette="flare", ax=ax, alpha=0.5) 
    # g = sns.scatterplot(data=alldf, x='time', y='n mito', hue="NDNA_MUT_LIFETIME",lw=1, palette="flare", ax=ax) 
    g.set_title("mean mitovol/totalvol through time")
    fig.tight_layout()
    plt.savefig(keywords.nfile("all_fracvol_meanpaths.png"))
    plt.savefig(keywords.nfile("all_fracvol_meanpaths.svg"))
    plt.close()
    # fig, ax = plt.subplots()
    # g = sns.lineplot(data=vardf, x='time', y='vol', hue="path", lw=1, palette="plasma", ax=ax) 
    # g.set_title("variance volume through time")
    # fig.tight_layout()
    # plt.savefig("current_processing/volume_variance.png")
    # plt.close()
