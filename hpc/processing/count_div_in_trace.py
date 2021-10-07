
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
        out.append({"host":hostId, "parent":host["parent"], "time":time, "n DNA":host_ndna, "unmut":host_unmut, "vol": host['vol']})
        out.update(host['evolvables'])
    return [out]

def gethostdct(line, host):
    return list(filter(lambda living: living['host'] == host, line))[0]


dfs = process.get(picklefname="hosts.pickle",force=options.f,runs=keywords.getruns(), folder=keywords.getfoldername(), reverse=True, selector=selectHost,  verbose=options.v,   sortbykeywordix=keywords.getkeywordix())

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
    # if options.v:
    #     print("making " + path)
    
    df = pd.DataFrame(pre_df)
    
    # df = df.sort_values(by='time')
    
    # fig, ax = plt.subplots()
    df['unmut'] /= df['n DNA']
    df = df[(df['unmut'] < 1)]
    # df['vol'] /= 1600
    df['volchange'] = df['vol'].pct_change(periods=1)
    df['unmutchange'] = df['unmut'].pct_change(periods=1)
    
    df = df[(df['volchange'] < -0.1)]
    if options.v:
        print(df)
    df['path'] = path[-3:]
    # df= df.drop(columns=['host', 'time', 'parent'])
    alldf.append(df)


alldf= pd.concat(alldf, ignore_index=True)
df = df[df['time'].diff() <-51]
if options.v:
    print(alldf)
# print(alldf['vol'])
fig, ax = plt.subplots(figsize=(20,3))
g = sns.swarmplot(data=alldf, x='path', y='unmutchange', palette="colorblind", hue='SELECTIVE_FUSION', s=3, ax=ax) 
plt.savefig(keywords.getoutputfolder() + "current_processing/ancestor_division_success_run.png", dpi=600)

