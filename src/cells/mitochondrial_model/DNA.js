

class DNA {

	/* eslint-disable */ 
	constructor (conf, mt ,parent) {
        this.mt = mt
        this.conf = conf

        this.oxphos_quality = new Array(this.conf["N_OXPHOS"]).fill(1);
        this.translate_quality = new Array(this.conf["N_TRANSLATE"]).fill(1);
        this.replicate_quality = new Array(this.conf["N_REPLICATE"]).fill(0);
        this.replicateFlag = false
        this.translateFlag = false
        // console.log("also in seed", this.translate_quality)
        if (parent instanceof DNA){
            this.oxphos_quality = [...parent.oxphos_quality]
            this.translate_quality = [...parent.translate_quality]
            this.replicate_quality = [...parent.replicate_quality]
            if (this.mt.random() < conf["MTDNA_MUT_RATE"] ){
                this.mutate()
            }
        }
    }

    mutate(){ 
        let indices = this.oxphos_quality.concat(this.translate_quality, this.replicate_quality).reduce(function(arr, e, i) {
            if (e == 1) arr.push(i);
            return arr;
          }, [])
        let ix = indices[Math.floor(this.mt.random() * indices.length)]
        // console.log(indices, ix)
        if (ix < this.conf["N_OXPHOS"]){
            // console.log("setting oxphos ", ix)
            this.oxphos_quality[ix] = 0
        } else if (ix < (this.conf["N_OXPHOS"] + this.conf["N_TRANSLATE"])){
            // console.log("setting otranslate ", ix - this.conf["N_OXPHOS"])
            this.translate_quality[ix - this.conf["N_OXPHOS"] ] = 0
        } else {
            this.replicate_quality[ix - this.conf["N_OXPHOS"] - this.conf["N_TRANSLATE"] ] = 0
        }
    }

    notBusy(){
        return (this.replicateFlag == false && this.translateFlag == false)
    }
    
    sumQuality(){
        return  [this.oxphos_quality, this.translate_quality ,this.replicate_quality].reduce((t, e) => t.concat(e)).reduce((t, e) => t + e)
    }

}

export default DNA