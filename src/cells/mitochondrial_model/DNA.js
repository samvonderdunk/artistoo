

class DNA {

		/* eslint-disable */ 
	constructor (conf, mt ,parent) {
        this.oxphos_quality = new Array(this.conf["N_OXPHOS"]).fill(1);
        this.translate_quality = new Array(this.conf["N_TRANSLATE"]).fill(1);
        this.replicate_quality = new Array(this.conf["N_REPLICATE"]).fill(0);
        this.mt = mt
        this.conf = conf
        this.replicateFlag = false
        this.translateFlag = false
        if (parent instanceof DNA){
            this.quality = parent.quality
            if (this.mt.random > conf["MTDNA_MUT_RATE"] ){
                this.mutate()
            }
        }
    }

    mutate(){ 
        indices = this.oxphos_quality.concat(this.translate_quality, this.replicate_quality).reduce(function(arr, e, i) {
            if (e == 1) arr.push(i);
            return arr;
          }, [])
        let ix = Math.floor(mt.random() * indices.length)

        if (ix <= this.conf["N_OXPHOS"]){
            this.oxphos_quality[ix] = 0
        } else if (ix <= (this.conf["N_OXPHOS"] + this.conf["N_TRANSLATE"])){
            this.translate_quality[ix - this.conf["N_OXPHOS"] ] = 0
        } else {
            this.replicate_quality[ix - this.conf["N_OXPHOS"] - this.conf["N_TRANSLATE"] ] = 0
        }
    }

    notBusy(){
        return (this.replicateFlag == false && this.translateFlag == false)
    }

    setReplicateFlag(bool){
        this.replicateFlag = bool
    }

    setTranslateFlag(bool){
        this.replicateFlag = bool
    }
}

export default DNA