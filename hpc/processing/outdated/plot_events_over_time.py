
import auxiliary.processthread as process
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt 
import seaborn as sns
import numpy as np
import json
import keywords
import logging
logging.basicConfig(filename=keywords.nfile("debug.log"), level=logging.DEBUG, 
                    format='%(asctime)s %(levelname)s %(name)s %(message)s')
logger=logging.getLogger(__name__)



options = keywords.getarguments()
sns.set(style="whitegrid", rc={'figure.figsize':(10,5)})

def selectDeath(timestep, time):
    dctin = json.loads(timestep)
    dctout = {}
    dctout['time'] = dctin['time']
    dctout['type'] = dctin['type']
    dctout['V'] = dctin['V']
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
try:
    popsizedfs = process.get(picklefname=keywords.nfile('popsizes.pickle'),fname='Mitochondrialog.txt',runs=keywords.getruns(),force=options.f, folder=keywords.getfoldername(), selector=selectPopSize,  verbose=options.v,   sortbykeywordix=keywords.getkeywordix())
    dfs = process.get(picklefname=keywords.nfile('mitodeath.pickle'),fname='deaths.txt',runs=keywords.getruns(),force=options.f, folder=keywords.getfoldername(), selector=selectDeath,  verbose=options.v,   sortbykeywordix=keywords.getkeywordix())
except Error as e:
    logging.error(e)


# pd.set_option('display.max_rows', None)

for path in dfs:
    # print(dfs[path]['data'])
    df = pd.DataFrame.from_dict(dfs[path]['data'])
    dfpopsize = pd.DataFrame.from_dict(popsizedfs[path]['data'])
    # for dct in dfs[path]['data']:
    #     dct['hosts'] = dfpopsize[dct[]]
    # print(dfpopsize)
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
    # print(len(perhost), df[(df['type'] == 'host')].shape)
    g1 = sns.histplot(data=df[(df['type'] == 'mito')], x='time',stat='frequency', ax=ax[0], weights='permito', bins=100)
    # g1 = sns.lineplot(data=df[(df['type'] == 'mito')], x='time',stat='density', ax=ax[0])
    g2 = sns.histplot(data=df[(df['type'] == 'host')], x='time', stat='frequency' ,ax=ax[1], weights='perhost', bins=30)

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
    plt.close()
