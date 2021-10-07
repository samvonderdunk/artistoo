
import auxiliary.process as process
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt 
import seaborn as sns
import keywords
import random
import json


# mode = 'any'
#  mode = "all"
sns.set(style="whitegrid", rc={'figure.figsize':(20,10)})
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
        out.append({"host":hostId, "parent":host["parent"], "time":time, "n DNA":host_ndna, "unmut":host_unmut, "fission rate":host['fission_rate'],"fusion_rate":host['fusion_rate'], "rep":host['rep']})
    return [out]

def gethostdct(line, host):
    return list(filter(lambda living: living['host'] == host, line))[0]

dfs = process.get(picklefname="hosts4000.pickle",force=False, stop=4000, folder=keywords.getfoldername(), reverse=True, selector=selectHost,  verbose=True,   sortbykeywordix=keywords.getkeywordix())

alldf = []
for path in dfs: 
    pre_df = []
    params = {}
    for key, val in dfs[path].items():
        if key != 'data':
            params[key]=float(val)
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

    df = pd.DataFrame(pre_df)
    # df = df.sort_values(by='time')
    # print(df)
    fig, ax = plt.subplots()
    # df['unmut'] /= df['n DNA']
    # g = sns.lineplot(data=df, x='time', y='unmut', palette="viridis", hue='n DNA', legend=None, ax=ax, sort=False, estimator=None) 
    g = sns.scatterplot(data=df, x='time', y='unmut', palette="viridis", hue='n DNA', legend=None, ax=ax, s=10, edgecolor=None) 
    title = "Unmutated DNA through last 4000 timesteps in single lineage\n"
    norm = plt.Normalize(df['n DNA'].min(), df['n DNA'].max())
    sm = plt.cm.ScalarMappable(cmap="viridis", norm=norm)
    sm.set_array([])
    ax.figure.colorbar(sm)
    fig.tight_layout()
    plt.savefig("current_processing/perrun/integer_unmut/last 4000 timesteps of "+ path[-4:] +".png", dpi=200)
    plt.close()
    # print("just trying one currently!")
    # break
    df['path'] = path
    df['time'] = pd.Series(range(0,df.shape[0])) 
    alldf.append(df)

alldf= pd.concat(alldf)
print(alldf)
g = sns.lineplot(data=alldf, x='time', y='unmut', palette="colorblind", hue='path',lw=1, units="path", estimator=None, legend=None) 
plt.savefig("current_processing/allancestortrace_unmut.png", dpi=600)

