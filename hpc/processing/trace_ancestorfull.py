
import auxiliary.processthread as process
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt 
import seaborn as sns
import keywords
import random
import json
import argparse

options = keywords.getarguments()

# mode = 'any'
#  mode = "all"
sns.set(style="whitegrid", rc={'figure.figsize':(20,3)})
random.seed(1)

def selectHost(timestep, time):
    timestep = json.loads(timestep)
    out = []
    # print(len(timestep.items()))
    for hostId, host in timestep.items():
        host_ndna = 0
        host_unmut = 0
        for mitoId, mito in host['subcells'].items():
            host_ndna += mito['n DNA']
            if mito['n DNA'] > 0:
                host_unmut += mito['unmut'] *mito['n DNA']
        dctout = {"host":hostId, "parent":host["parent"], "time":time, "n DNA":host_ndna, "unmut":host_unmut,  "vol": host['vol'], "total_vol": host['total_vol']}
        dctout.update(host['evolvables'])
        out.append(dctout)
    return [out]

def gethostdct(line, host):
    return list(filter(lambda living: living['host'] == host, line))[0]


dfs = process.get(picklefname=keywords.nfile("hoststrace.pickle"),force=options.f,runs=keywords.getruns(), folder=keywords.getfoldername(), reverse=True, selector=selectHost,  verbose=options.v,   sortbykeywordix=keywords.getkeywordix(), sortbylineix=keywords.getlineix())

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
        # print(current)
        current.update(params)
        pre_df.append(current)
    if options.v:
        print("making " + path)
    df = pd.DataFrame(pre_df)
    # if df['time'].iloc[-1] < 15000:
    #     if options.v:
    #         print(path, "not making plot due to early end")
    #     continue
    # df = df.sort_values(by='time')
    # print(df)
    fig, ax = plt.subplots()
    df['unmut'] /= df['n DNA']
    df['mito_vol'] = df['total_vol'] - df['vol']
    df['vol'] /= 1600
    df['mito_vol'] /=1600
    # g = sns.lineplot(data=df, x='time', y='unmut', palette="viridis", hue='n DNA', legend=None, ax=ax, sort=False, estimator=None) 
    df['fission rate (x2000)'] = df['fission_rate'] * 2000
    df['fusion rate (x2000)'] = df['fusion_rate'] * 2000
    df['rep (x0.1)'] = df['rep'] * 0.1
    # df['rep2 (x0.1)'] = df['rep2'] * 0.1
    # df['fission events'] /= 50
    # df['fusion events'] /=50
    # df['fusion events (10x)'] = df['fusion events'] * 10
    # df['time'] = df['time'].round(decimals=-1)
    # df = df[(df['time'] > 200000)]
    # df = df.tail(5000)
    df = df.groupby(by='time').mean().reset_index()
    # df = pd.melt(df, id_vars=['time'], value_vars=['fission rate (x2000)', 'fusion rate (x2000)', 'rep (x0.1)', 'rep2 (x0.1)'])
    df = pd.melt(df, id_vars=['time'], value_vars=['unmut', 'vol',"mito_vol"])
    # df = pd.melt(df, id_vars=['time'], value_vars=['fission events', 'fusion events', 'unmut', 'vol'])
    g = sns.lineplot(data=df, x='time', y='value',  hue="variable", lw=1, palette="colorblind", ax=ax) 
    title = "Single lineage\n"
    for key, val in dfs[path].items():
        if key != 'data':
        # print(title, kw, df[kw][0])
            title += (key + " = " + str(val) + '\n')
    g.set_title(title, y=0.9)
    # norm = plt.Normalize(df['rep'].min(), df['rep'].max())
    # sm = plt.cm.ScalarMappable(cmap="viridis", norm=norm)
    # sm.set_array([])
    # ax.figure.colorbar(sm)
    fig.tight_layout()
    plt.savefig(keywords.nfile("traces/"+ path[-4:] +".png"), dpi=200)
    # plt.savefig(keywords.nfile("traces/limited/"+ path[-4:] +".png"), dpi=200)
    # plt.savefig(keywords.nfile("traces/evolvables"+ path[-4:] +".png"), dpi=200)
    plt.close()
    # print("just trying one currently!")
    # break
    df['path'] = path
    df['time'] = pd.Series(range(0,df.shape[0])) 
    alldf.append(df)

# alldf= pd.concat(alldf)
# print(alldf)
# g = sns.lineplot(data=alldf, x='time', y='unmut', palette="colorblind", hue='path',lw=1, units="path", estimator=None, legend=None) 
# plt.savefig("current_processing/fullrun_allancestortrace_unmut.png", dpi=600)

