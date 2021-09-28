import DNA from "./DNA.js" 

class nDNA extends DNA {

	/* eslint-disable */ 
	constructor (conf, C, idstr, parent) {
        super(conf,C, idstr, parent)
        if (parent instanceof DNA){
            this.quality = [...parent.quality]
            this.exists = [...parent.exists]
            this.mutate(this.conf['NDNA_MUT_REP'])
        } else {
            this.quality = new Array(this.conf["N_OXPHOS"]+this.conf["N_TRANSLATE"]+this.conf["N_REPLICATE"]).fill(1)
            this.exists = new Array(this.conf["N_OXPHOS"]+this.conf["N_TRANSLATE"]+this.conf["N_REPLICATE"]).fill(1)
            for (let i = 0 ; i < this.exists.length; i++){
                if (i < this.conf["N_OXPHOS"]  + this.conf["N_TRANSLATE"])
                    this.exists[i] = 0
            }
        }
        // console.log("New ndna", this.quality, this.exists)
    }

}

export default nDNA