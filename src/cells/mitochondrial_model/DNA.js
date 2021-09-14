// Optional: get all DNA and product redundancy away through proper inheritance;
// this is for now too much work.

class DNA {

	/* eslint-disable */ 
	constructor (conf, C , idstr, parent) {
        this.C = C
        this.conf = conf
        this.id = idstr //unique string
        this.replicating = 0
        this.translateFlag = false
        // console.log("also in seed")
        if (parent instanceof DNA){
            this.quality = [...parent.quality]
            this.mutate(this.conf['MTDNA_MUT_REP'])
            this.exists = [...parent.exists]
        } else {
            this.quality = new Array(this.conf["N_OXPHOS"]+this.conf["N_TRANSLATE"]+this.conf["N_REPLICATE"]).fill(0)
            this.exists = new Array(this.conf["N_OXPHOS"]+this.conf["N_TRANSLATE"]+this.conf["N_REPLICATE"]).fill(0)
            for (let i = 0 ; i < this.quality.length; i++){
                if (i < this.conf["N_OXPHOS"]  + this.conf["N_TRANSLATE"]){
                    this.quality[i] = 1
                    this.exists[i] = 1
                }
            }
        }
    }

    mutate(rate){ 
        for (let ix = 0 ; ix < this.quality.length; ix++){
            if (this.C.random() < rate){
                this.quality[ix] = 0
            }
        }
    }

    notBusy(){
        return (this.replicating === 0 && this.translateFlag === false)
    }
    busy(){
        return !this.notBusy()
    }
    
    sumQuality(){
        return  this.quality.reduce((t, e) => t + e)
    }

    get trues(){
        return this.exists.reduce(
            (out, bool, index) => bool ? out.concat(index) : out, 
            []
          )
    }

    get oxphos_quality() {
        return this.quality.slice(0, this.conf["N_OXPHOS"])
    }
    get translate_quality() {
        return this.quality.slice(this.conf["N_OXPHOS"], this.conf["N_OXPHOS"] + this.conf["N_TRANSLATE"])
    }
    get replicate_quality() {
        return this.quality.slice(this.conf["N_OXPHOS"] + this.conf["N_TRANSLATE"] )
    }


}

export default DNA