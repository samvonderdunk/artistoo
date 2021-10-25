
import auxiliary.processthread as process
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt 
import seaborn as sns
import numpy as np
import json
import keywords

options = keywords.getarguments()
plt.rcParams['svg.fonttype'] = 'none'
sns.set(style="whitegrid", rc={'figure.figsize':(10,5)})

def selectDeath(timestep, time):
    dctin = json.loads(timestep)
    dctout = {}
    dctout['time'] = dctin['time']
    dctout['type'] = dctin['type']
    dctout['V'] = dctin['V']
    # dctout['fusion rate'] = dctin['evolvables']['fusion rate']
    if 'time of birth' in dctin:
        dctout['time of birth'] = dctin['time of birth']
    else:
        dctout['time of birth'] = 0
    
    return  [dctout]

def selectPopSize(timestep, time):
    dctin = json.loads(timestep)
    dctout = {}
    dctout['hosts'] = len(dctin)
    dctout['mitos'] = 0
    for host in dctin:
        dctout['time'] = dctin[host]['time'] # will set too many times but okay
        dctout['mitos'] += len(dctin[host]['subcells'])
    # print(dctout)
    return [dctout]

popsizedfs = process.get(picklefname=keywords.nfile('popsizes.pickle'),fname='Mitochondrialog.txt',runs=keywords.getruns(),force=options.f, folder=keywords.getfoldername(), selector=selectPopSize,  verbose=options.v,   sortbykeywordix=keywords.getkeywordix(), load=options.l)
dfs = process.get(picklefname=keywords.nfile('mitodeath.pickle'),fname='deaths.txt',runs=keywords.getruns(),force=options.f, folder=keywords.getfoldername(), selector=selectDeath,  verbose=options.v,   sortbykeywordix=keywords.getkeywordix(),load=options.l)



# pd.set_option('display.max_rows', None)
alldf = []
for path in dfs:
    # print(dfs[path]['data'])
    df = pd.DataFrame.from_dict(dfs[path]['data'])
    dfpopsize = pd.DataFrame.from_dict(popsizedfs[path]['data'])
    # for dct in dfs[path]['data']:
    #     dct['hosts'] = dfpopsize[dct[]]
    # print(dfpopsize)
    if df['time'].iloc[-1] < 50000:
        if options.v:
            print("short run, only making with flag -c")
        if not options.c:
            continue
    
    df['time'] = df['time'].round(decimals=-1)
    df['time'] += 1
    # df = df[(df['V']  < 100)]
    # df = df.set_index('time')
    dfpopsize = dfpopsize.set_index('time')
    dfpopsize = dfpopsize.reindex(df['time'], method="ffill")
    # df['perhost'] = 1/dfpopsize['hosts'] 
    dfpopsize = dfpopsize.reset_index()
    # df = df.combine(dfpopsize, take_smaller)
    # print(dfpopsize)
    # print(dfpopsize['time'].isin(df['time']))
    
    # hostpopsize = dfpopsize[(dfpopsize['time'].isin(df[(df['type'] =='host')]['time']))]
    # mitopopsize = dfpopsize[(dfpopsize['time'].isin(df[(df['type'] =='mito')]['time']))]
    # print(dfpopsize, df)
    # if options.v:
    #     print(df, df.columns)
    
    # print(df.shape, path)
    # if df['time'].iloc[-1] < 15000:
    #     continue
    # fig, ax = plt.subplots()
    # g = sns.histplot(data=df, x='time')

    df['perhost'] = 1/dfpopsize['hosts']
    df['permito'] = 1/dfpopsize['mitos']
    if options.v:
        print(df)
    # print(perhost.reset_index())
    fig, ax = plt.subplots(nrows=2)
    alldf.append(df)
    
    # print(len(perhost), df[(df['type'] == 'host')].shape)
    g1 = sns.histplot(data=df[(df['type'] == 'mito')], x='time',stat='frequency', ax=ax[0], weights='permito', bins=100)
    ax[0].set_ylim(0, 0.0065)
    # g1 = sns.lineplot(data=df[(df['type'] == 'mito')], x='time',stat='density', ax=ax[0])
    g2 = sns.histplot(data=df[(df['type'] == 'host')], x='time', stat='frequency' ,ax=ax[1], weights='perhost', bins=30)
    ax[1].set_ylim(0, 0.00085)
    # fig, ax = plt.subplots()
    # g = sns.histplot(df, x="time", hue="type", element="step",stat="probability", common_norm=False,multiple='fill')
    
    # fig, ax = plt.subplots()
    # g1 = sns.histplot(data=df[(df['type'] == 'mito')], x='time', ax=ax, element="step")
    # ax2 = ax.twinx()
    # g2 = sns.histplot(data=df[(df['type'] == 'host')], x='time', ax=ax2, color=sns.color_palette()[1], element="step", alpha=0.6)

    # g = sns.lineplot(data=df, x='time', y='deathscorrected',  hue="type", lw=1, palette="colorblind", ax=ax) 
    title = "Host death through time\n"
    for key, val in dfs[path].items():
        if key != 'data':
            title += (key + " = " + str(val) + '\n')
    # fig.set_title(title, y=0.9)
    fig.suptitle(title)
    fig.tight_layout()
    # ax.title.set_y(0.5)
    fig.subplots_adjust(top=0.8)
    plt.savefig(keywords.nfile("deaths/corrected"+ path[-4:] +".png"))
    plt.savefig(keywords.nfile("deaths//svgs/corrected"+ path[-4:] +".svg"))
    plt.close()

fig, ax = plt.subplots(nrows=2)
ax[0].set_ylim(0, 0.0065)
ax[1].set_ylim(0, 0.00085)

lstdf = alldf
alldf = pd.concat(alldf, ignore_index=True)

# ASSUMES ALL RUNS HAVE RUN AS LONG AS EACH OTHER!!!
# best practice would be to div by time point how many unique runs have been there
alldf['perhost'] /= len(lstdf)
alldf['permito'] /= len(lstdf)

g1 = sns.histplot(data=alldf[(alldf['type'] == 'mito')], x='time',stat='frequency', ax=ax[0], weights='permito', bins=100)
g2 = sns.histplot(data=alldf[(alldf['type'] == 'host')], x='time', stat='frequency' ,ax=ax[1], weights='perhost', bins=30)
plt.savefig(keywords.nfile("allcorrectedmorebins.png"))
plt.savefig(keywords.nfile("allcorrectedmorebins.svg"))

plt.close()
fig, ax = plt.subplots(nrows=2)
ax[0].set_ylim(0, 0.0065)
ax[1].set_ylim(0, 0.00085)

g1 = sns.histplot(data=alldf[(alldf['type'] == 'mito')], x='time',stat='frequency', ax=ax[0], weights='permito', bins=1)
g2 = sns.histplot(data=alldf[(alldf['type'] == 'host')], x='time', stat='frequency' ,ax=ax[1], weights='perhost', bins=1)
plt.savefig(keywords.nfile("allcorrected.png"))
plt.savefig(keywords.nfile("allcorrected.svg"))