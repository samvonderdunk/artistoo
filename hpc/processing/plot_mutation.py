
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
        for mitoId, mito in host['subcells'].items():
            outdct = {'time':host['time']}
            ros = min(mito["products"][:10] +mito["bad products"][:10]) * mito['vol']/200
            if ros == 0:
                continue
            outdct['mut'] = sum(mito['sum dna']) * ros * 0.00005
            outdct['efficiency'] = mito['oxphos']/ros
            out.append(outdct)
        # out.append({"host":hostId, "time":time, "n DNA":host_ndna, "unmut":host_unmut})
    return out

# print(options.f)

dfs = process.get(picklefname=keywords.nfile("mutation.pickle"),runs=keywords.getruns(),force=options.f, folder=keywords.getfoldername(), selector=select,  verbose=options.v,   sortbykeywordix=keywords.getkeywordix(), sortbylineix=keywords.getlineix())

alldf = []
if True:
    for path in dfs:
        
        df = pd.DataFrame(dfs[path]['data'])
        
        if df['time'].iloc[-1] < 50000:
            if options.v:
                print(path, "not making plot due to early end")
            continue
        df = df[(df["time"] > 1000)]
     
        if options.v:
            print(path)
            print(df)
        # print(df[df['V']])
        fig, ax = plt.subplots()
        ax.set( yscale="log")
        # counts = df.apply(pd.value_counts).fillna(0)
        # g = sns.lineplot(data=df, x='time', y='vol', ax=ax)
        # g2 = sns.lineplot(data=df, x='time', y='mito_vol', ax=ax)
        df = df[(df['mut'] != 0)]
        g = sns.scatterplot(data=df, x='time', y='mut', ax=ax, s=0.2, alpha=0.3, linewidth=0)
        # g2 = sns.lineplot(data=df, x='time', y='n mito', ax=ax)
        # g2 = sns.scatterplot(data=df, x='time', y='mito_vol', ax=ax, s=0.5, alpha=0.1)
        # entries = []
        
        # ax.set_yscale('log')
        # ax
        title = "mutation chance per gene per timestep in each vesicle through time\n"
        for key, val in dfs[path].items():
            if key != 'data':
                title += (key + " = " + str(val) + '\n')
                df[key] = val
        g.set_title(title, y=0.9)
        # for kw, ix in keywords.getkeywordix():
        
        fig.tight_layout()

        # ax.title.set_y(0.5)
        # fig.subplots_adjust(top=0.8)
        
        plt.savefig(keywords.nfile("mutation/"+ path[-4:] +".png"), dpi=1200)
        plt.close("all")

for path in dfs:
        
    df = pd.DataFrame(dfs[path]['data'])
    
    if df['time'].iloc[-1] < 50000:
        if options.v:
            print(path, "not making plot due to early end")
        continue
    for key, val in dfs[path].items():
        if key != 'data':
            # title += (key + " = " + str(val) + '\n')
            df[key] = val
            # print(key)
    df = df[(df["time"] > 1000)]
    alldf.append(df)

alldf= pd.concat(alldf, ignore_index=True)
if True:
    means = []
    variances = []
    
    # meandf = pd.ariances)
    # meandf['time'] = df['time'].round(decimals=-3)
    # vardf['time'] = df['time'].round(decimals=-3)
    
    alldf = alldf.groupby(['time','NDNA_MUT_LIFETIME']).mean().reset_index()
    print(alldf)
    fig, ax = plt.subplots()
    g = sns.lineplot(data=alldf, x='time', y='n mito', hue="NDNA_MUT_LIFETIME", lw=1, palette="plasma", ax=ax) 
    g.set_title("mean N MITO through time")
    fig.tight_layout()
    plt.savefig(keywords.nfile("all_nmito"))
    plt.close()
    # fig, ax = plt.subplots()
    # g = sns.lineplot(data=vardf, x='time', y='vol', hue="path", lw=1, palette="plasma", ax=ax) 
    # g.set_title("variance volume through time")
    # fig.tight_layout()
    # plt.savefig("current_processing/volume_variance.png")
    # plt.close()
