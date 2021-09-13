import DNA from "./DNA.js" 

class nDNA extends DNA {

	/* eslint-disable */ 
	constructor (conf, C ,parent) {
        super(conf,C, parent)
        if (parent instanceof DNA){
            this.quality = [...parent.quality]
        } else {
            this.quality = new Array(this.conf["N_OXPHOS"]+this.conf["N_TRANSLATE"]+this.conf["N_REPLICATE"]).fill(1)
            this.exists = new Array(this.conf["N_OXPHOS"]+this.conf["N_TRANSLATE"]+this.conf["N_REPLICATE"]).fill(1)
            for (let i = 0 ; i < this.quality.length; i++){
                if (i < this.conf["N_OXPHOS"]  + this.conf["N_TRANSLATE"])
                    this.quality[i] = 0
                    this.exists[i] = 0
            }
        }
    }

}

export default nDNA