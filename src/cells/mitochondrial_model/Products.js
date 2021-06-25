
class Products {

	/* eslint-disable */ 
	constructor (conf, C) {
        // this.C = C
        this.conf = conf
        this.arr = new Array(this.conf["N_OXPHOS"]+this.conf["N_TRANSLATE"]+this.conf["N_REPLICATE"]).fill(0)
        this.C = C
    }

    init(){
        for (let i = 0 ; i < this.arr.length; i++){
            if (i < this.conf["N_OXPHOS"] ){
                this.arr[i] = this.conf["INIT_OXPHOS"]
            } else if (i <  (this.conf["N_OXPHOS"] +this.conf["N_TRANSLATE"])){
                this.arr[i] = this.conf["INIT_TRANSLATE"]
            } else {
                this.arr[i] = this.conf["INIT_REPLICATE"]
            }
        }
    }
    // TODO: maybe encapsulate the .arr fully? ? 
    // increment(p){
    //     this.arr[p]++
    // }

    get oxphos() {
        return this.arr.slice(0, this.conf["N_OXPHOS"])
    }
    get translate() {
        return this.arr.slice(this.conf["N_OXPHOS"], this.conf["N_OXPHOS"] + this.conf["N_TRANSLATE"])
    }
    get replicate() {
        return this.arr.slice(this.conf["N_OXPHOS"] + this.conf["N_TRANSLATE"] )
    }

    sum(arr){
        return arr.reduce((t, e) => t + e)
    }

    get oxphos_sum(){
        return this.sum(this.oxphos)
    }
    get translate_sum(){
        return this.sum(this.translate)
    }
    get replicate_sum(){
        return this.sum(this.replicate)
    }

    deprecate(chance){
        for ( let ix = 0; ix < this.arr.length; ix++){
            this.arr[ix] -= this.binomial(this.arr[ix], chance)
        }
    }

    /* eslint-disable */
    binomial(n, p){
        let log_q = Math.log(1.0-p), k = 0, sum = 0
        for (;;){
            sum += Math.log(this.C.random())/(n-k)
            if (sum < log_q){
                return k
            }
            k++
        }
    }
    

}

export default Products