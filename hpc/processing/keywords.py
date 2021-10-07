
import seaborn as sns
import pandas as pd
import argparse
import os

def getfoldername():
    args= getarguments()
    if args.filename == None:
        return "../current"
    else:
        return args.filename
    # return "../210825_double_stoch_corr"

def nfile(relpath):
    path = getfoldername() + "processing/"
    for subdir in relpath.split('/')[:-1]:
        path += subdir + '/'
    if not os.path.exists(path):
        os.makedirs(path)
    path += relpath.split('/')[-1]
    return path
    # return "../210825_double_stoch_corr/"


def getruns():
    return 'all'
    # return ['run0003']
    # return ["run0012", "run0013", 'run0014', 'run0018', 'run0019', 'run0036', 'run0037', 'run0020', 'run0038', 'run0042', 'run0043', 'run0044']



def getkeywordix():
    return [
                # ("fission_rate", -1), 
                # ("fusion_rate", -1), 
                ("seed", -7),
                ("NDNA_MUT_REP", -1),
                ("NDNA_MUT_LIFETIME", -1),
                # ("SIGMA_REP", -1),
                # ("division_volume", -1), 
                # ("N_REPLICATE",-1), 
                # ("deprecation_rate",-1),
                # ("FACTOR_HOSTSHRINK_OVERFLOW", -1),
                # ("MITO_V_PER_OXPHOS", -1),
                # ("HOST_SHRINK", -1),
                # ("THRESHOLD_REPLICATION_STOP", -1),
                # ("MUT_REP2", -1),
                # ("SELECTIVE_FUSION", -1),
                ]

def getlineix():
    return [
        # (22, -2, "J_int")
        # (150, -1, "colorby")
    ]

def is_valid_file(parser, arg):
    if arg == None:
        return
    if not os.path.exists(arg):
        parser.error("The file %s does not exist!" % arg)
    # else:
        # return open(arg, 'r')  # return an open file handle

def getarguments():
    parser = argparse.ArgumentParser()
    parser.add_argument('-f', action='store_true')
    parser.add_argument('-v', action='store_true')
    parser.add_argument('-c', action='store_true')
    parser.add_argument("-i", dest="filename", required=False,
                    help="input folder")
    return parser.parse_args()

def rename(df):
    # return
    if 'p' not in df.columns:
        print(df.columns)
        df['r'] = df["REP_MACHINE_PER_OXPHOS"]
        df['p'] = df["deprecation_rate"]
        df['sig'] = df["SIGMA_REP"]/0.03
    print(pd.unique(df['sig']))
    df = df[(df['sig'] == pd.unique(df['sig'])[1])]
    df = df[(df['p'] == pd.unique(df['p'])[1])]
    df = df[(df['r'] == pd.unique(df['r'])[0])]
    print(pd.unique(df['sig']))
    return df
        # df['dna out'] = df["dna_deprecation_rate"]
        # df['div'] = df["division_volume"]
        # df["nrep"] = df["N_REPLICATE"] 
        # df['repthresh'] = df["THRESHOLD_REPLICATION_STOP"]
        # df['mutros'] = df["MTDNA_MUT_ROS"]

def getfacetgrid(df):
    df = rename(df)
    # df["krep"] = df["K_REPLICATE"] 
    fg = sns.FacetGrid(df, col='p', row='r')
    # fg =  sns.FacetGrid(df, col='dna out', row='nrep')
    return fg 


