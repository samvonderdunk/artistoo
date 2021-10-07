
import auxiliary.process as process
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

def selectAll(timestep, time):
    dctin = json.loads(timestep)
    return [dctin]

def gethostdct(line, host):
    return list(filter(lambda living: living['host'] == host, line))[0]


dfs = process.get(picklefname=keywords.nfile("pickle/divisiontrace.pickle"),fname="divisions.txt",force=options.f,runs=keywords.getruns(), folder=keywords.getfoldername(), reverse=True, selector=selectAll,  verbose=options.v,   sortbykeywordix=keywords.getkeywordix(), sortbylineix=keywords.getlineix())

alldf = []
for path in dfs: 
    pre_df = []
    params = {}
    for key, val in dfs[path].items():
        if key != 'data':
            params[key]=val

    divtimes = []
    current = None
    # print(dfs[path])
    for dct in dfs[path]['data']:
        # parentdct = dct['parent']
        # if type(line) is dict:
        #     line = [line]
        if current == None or current == dct['daughter']['id'] or current == dct['parent']['id']:
            outdct = dct['parent']
            dct['parent'].update(params)
            dct['parent'].update({"path": path})
            pre_df.append(dct['parent'])
            # print(host, "newly chosen")
            current = dct['parent']['id']
            if current == -1:
                break

    df = pd.DataFrame(pre_df)
    if options.v:
        print("making " + path)
        print(df)
    fig, ax = plt.subplots()
    
    g = sns.histplot(data=df, x='time', stat='count')

    # df = pd.melt(df, id_vars=['time'], value_vars=['fission rate (x2000)', 'fusion rate (x2000)', 'rep (x0.1)', 'rep2 (x0.1)'])
    # df = pd.melt(df, id_vars=['time'], value_vars=['unmut', 'vol',"mito_vol"])
    # df = pd.melt(df, id_vars=['time'], value_vars=['fission events', 'fusion events', 'unmut', 'vol'])
    # g = sns.lineplot(data=df, x='time', y='value',  hue="variable", lw=1, palette="colorblind", ax=ax) 
    title = "Ancestor divisions\n"
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
    plt.savefig(keywords.nfile("traces/divisions/"+ path[-4:] +".png"), dpi=200)
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

