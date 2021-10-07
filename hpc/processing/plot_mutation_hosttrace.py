
import auxiliary.processthread as process
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt 
import seaborn as sns
import numpy as np
import json
import keywords
import random

sns.set(style="whitegrid", rc={'figure.figsize':(10,3)})
options = keywords.getarguments()


def select(timestep, time):
    timestep = json.loads(timestep)
    out = []
    for hostId, host in timestep.items():
        outdct = {'time':host['time'], "host":hostId, "parent":host["parent"], 'totalmut':0}
        for mitoId, mito in host['subcells'].items():
            ros = min( [x + y for (x, y) in zip(mito["products"][:10], mito["bad products"][:10])]) * mito['vol']/200
            # if ros == 0:
            #     continue
            # print(ros,  mito["products"][:10] +mito["bad products"][:10])
            outdct['totalmut'] += sum(mito['sum dna']) * ros * 0.00005
            outdct['oxphos'] = mito['oxphos']
        out.append(outdct)
        # out.append({"host":hostId, "time":time, "n DNA":host_ndna, "unmut":host_unmut})
    return [out]

def gethostdct(line, host):
    # print(line, host)
    return list(filter(lambda living: living['host'] == host, line))[0]
# print(options.f)

dfs = process.get(picklefname=keywords.nfile("mutationhost.pickle"),runs=keywords.getruns(),force=options.f, reverse=True, folder=keywords.getfoldername(), selector=select,  verbose=options.v,   sortbykeywordix=keywords.getkeywordix(), sortbylineix=keywords.getlineix())



alldf = []
for path in dfs: 
    pre_df = []
    params = {}
    for key, val in dfs[path].items():
        if key != 'data':
            params[key]=val
    host = None
    parent =None
    # print(dfs[path]['data'])
    for line in dfs[path]['data']:
        # print(line)
        if type(line) is dict:
            line = [line]
        if host == None:
            current = random.choice(line)
            host = current['host']
            parent = current['parent']
            # print(host, "newly chosen")
        if host not in [dct['host'] for dct in line]:
            # print(line)
            host = str(parent)
            parent = gethostdct(line, host)['parent']
            if host == "-1" :
                break
        current = gethostdct(line, host)
        print(current)
        current.update(params)
        
        pre_df.append(current)
    
    df = pd.DataFrame(pre_df)
    if options.v:
        print("making " + path)
        print(df['totalmut'])
    # print(df[df['V']])
    fig, ax = plt.subplots()
    ax.set( yscale="log")
    # counts = df.apply(pd.value_counts).fillna(0)
    # g = sns.lineplot(data=df, x='time', y='vol', ax=ax)
    # g2 = sns.lineplot(data=df, x='time', y='mito_vol', ax=ax)
    df = df[(df['totalmut'] != 0)]
    g = sns.lineplot(data=df, x='time', y='totalmut', ax=ax)
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
    
    plt.savefig(keywords.nfile("traces/mutation/"+ path[-4:] +".png"), dpi=1200)
    plt.close("all")
