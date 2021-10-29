import DNA from "./DNA.js" 

class nDNA extends DNA {

	/* eslint-disable */ 
	constructor (conf, C, idstr, parent) {
        super(conf,C, idstr, parent)
        if (parent instanceof DNA){
            this.mutate(this.conf['MTDNA_MUT_REP'])
        } else {
            for (let i = 0 ; i < this.quality.length; i++){
                if (i < this.conf["N_OXPHOS"]  + this.conf["N_TRANSLATE"]){
                    this.quality[i] = 1
                    this.exists[i] = 1
                }
            }
        }
    }

}

export default nDNA