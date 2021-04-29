

class DNA {

	/* eslint-disable */ 
	constructor (conf, mt ,parent) {
        this.mt = mt
        this.conf = conf

        this.replicateFlag = false
        this.translateFlag = false
        // console.log("also in seed", this.translate_quality)
        if (parent instanceof DNA){
            this.quality = [...parent.quality]
            if (this.mt.random() < conf["MTDNA_MUT_RATE"] ){
                this.mutate()
            }
        } else {
            this.quality = new Array(this.conf["N_OXPHOS"]+this.conf["N_TRANSLATE"]+this.conf["N_REPLICATE"]).fill(0)
            for (let i = 0 ; i < this.quality.length; i++){
                if (i < this.conf["N_OXPHOS"]  + this.conf["N_TRANSLATE"])
                    this.quality[i] = 1
            }
        }
    }

    mutate(){ 
        // find ones - mutation is always loss
        let randomtrue = Math.floor(this.mt.random() * this.sumQuality()), i = 0
        for (const [ix,gene] of this.quality.entries()){
            if(gene === 1){
                i++
            }
            if (i == randomtrue){
                this.quality[ix] = 0
                break
            }
        }
    }

    notBusy(){
        return (this.replicateFlag == false && this.translateFlag == false)
    }
    
    sumQuality(){
        return  this.quality.reduce((t, e) => t + e)
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