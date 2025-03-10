import json, os, pickle, re
import pandas as pd
from file_read_backwards import FileReadBackwards
from multiprocessing.dummy import Pool as ThreadPool
from functools import partial




def readfile(fname, selector=None, verbose=True, start=None, stop=None,  reverse=False, **kwargs):
    # print(stop)
    if not os.path.isfile(fname) or os.path.getsize(fname) == 0:
        if verbose:
            print("Cannot see: " + fname + " or it is empty")
        return
    # if os.path.getsize(fname) >1000000000 :
    #     print(fname + " is too large (> 1 GB)!! skipping for efficiency.")
    #     return None
    readout = []
    if (reverse):
        ifs = FileReadBackwards(fname)
    else:
        ifs = open(fname)

    line = ifs.readline()
    time = 0
    it = 0
    selectorline=None
    while line:
        # print(it)
        if line[0] == "%":
            time = int(line.replace('-','').replace('%', ''))
            if reverse and selectorline is not None:
                it += 1
                selected = selector(selectorline, time)
                readout.extend(selected)
        if (start != None and it < start):
            line = ifs.readline()
            it += 1
            continue
        # if (it % 1000 == 0 and verbose):
        #     print(time)
        if (stop != None and it > stop):
            break
        if line[0] == "{":
            it += 1
            selectorline = line
            selected = selector(selectorline, time)
            readout.extend(selected)
            #     timeline = ifs.readline()
            #     time = int(line.replace('-','').replace('%', ''))
        line = ifs.readline()
    ifs.close()

    
    return {"data":readout, "path":fname}


def retrieve(keystring=None, directory="runs", line=None, index=-1, verbose=False):
    """ Searches for keystring in path + config.cym file, takes index value in line. """
    ifs = open(os.path.join(directory, 'config.js'))
    out = None
    if line:
        linelst = ifs.readlines()[line].split()
        try:
            out =linelst[index]
        except IndexError:
            print("The handed index for line " + str(line) + " in " + directory+ " is unable to be retrieved!\nThis is the current ±1 line:" )
            print( ifs.readlines()[line-1:line+1])
            exit(1)
    else: 
        for line in ifs:
            if re.match(keystring + "\s+:\s+", line.strip()):
                out = line.split()[index].strip(',')
                break
            if re.match(keystring + ":\s+", line.strip()):
                out = line.split()[index].strip(',[]')
                break
            if re.match(keystring + "\s+:", line.strip()):
                out = line.split()[index].strip(':,[]')
                break
    ifs.close()
    if out is None:
        print("could not find " + keystring + " in " + os.path.join(directory, 'config.js'))
        return None
    try:
        out = float(out)
    except: 
        if verbose: 
            print("cannot make float of" + out)
    return out

def to_longform(shortform):
    longform = []
    for fname in shortform:
        df = shortform[fname]['data']
        df['path'] = [fname]*df.shape[0]
        for entry in dfs[fname]:
            if entry != 'data':
                df[entry] = [dfs[fname][entry]] * df.shape[0]
        longform.append(df)
    return pd.concat(longform)


def openruns(fname='Mitochondrialog.txt', folder='current', runs=None, longform=False,  sortbykeywordix=[], sortbylineix=[], **kwargs):
    """ opens all files in a folder, attempts to read with read_df and saves this annotated by the sortby retrieved values from the config file  """
    dfs = {}

    if runs == None or runs== 'all':
        runs = [dirname for dirname in os.listdir(folder)]
    allruns = sorted([os.path.join(folder, dirname, fname) for dirname in runs])
    pool = ThreadPool(len(allruns))
    dataread = pool.map(partial(readfile, **kwargs), allruns)
    for dct in dataread:
        if dct is not None:
            subdir = os.path.dirname(dct['path'])
            dfs[subdir]=dct
            # print(df)
            for kw, ix in sortbykeywordix:
                dfs[subdir][kw]=retrieve(keystring=kw, directory=subdir, index=ix)
            for tup in sortbylineix:
                if len(tup)==3:
                    dfs[subdir][tup[2]] = retrieve(line=tup[0], directory=subdir, index=tup[1])
                else:
                    dfs[subdir][tup[0]]=retrieve(line=tup[0], directory=subdir, index=tup[1])[0]
            if kwargs["verbose"]:
                string = ""
                for key, value in dfs[subdir].items():
                    if key != "data":
                        string += str(key) + " = " + str(value) +";  "
                print(string)
        
    if longform:
        dfs = {folder : to_longform(dfs)}
    return dfs


def get(picklefname = "./tmp.pickle", force=False, load=False, **kwargs):
    if os.path.isfile(picklefname) and force==False:
        with open(picklefname, 'rb') as ifs:
            try:   
                dfdct = pickle.load(ifs)
            except:
                print("can't retrieve, making new.")
                dfdct = [None]
        if "params" in dfdct:
            kwargscp = dict(kwargs)
            del kwargscp['verbose']
            del dfdct['params']['verbose']
            if (dfdct["params"] == kwargscp) or load:
                del dfdct["params"]
                return dfdct["data"]
    df = pd.DataFrame(openruns(**kwargs))
    dfdct = {"data" : df}
    dfdct["params"] = kwargs
    with open(picklefname,"wb+") as ofs:
        pickle.dump(dfdct, ofs)   
    return df
