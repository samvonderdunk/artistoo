"use strict"

import SubCell from "../SubCell.js" 
import DNA from "./DNA.js" 

class Mitochondrion extends SubCell {

	/* eslint-disable */ 
    constructor (conf, kind, id, C) {
		super(conf, kind, id, C)
        
        this.DNA = new Array(this.conf["N_INIT_DNA"]).fill(new DNA(this.conf, this.C));
        
        this.V = this.conf["INIT_MITO_V"]

        this.makebuffer = [], this.importbuffer = []

        this.products = new Array(this.conf["N_OXPHOS"]+this.conf["N_TRANSLATE"]+this.conf["N_REPLICATE"]).fill(0)
        for (let i = 0 ; i < this.products.length; i++){
            if (i < this.conf["N_OXPHOS"] ){
                this.products[i] = this.conf["INIT_OXPHOS"]
            } else if (i <  (this.conf["N_OXPHOS"] +this.conf["N_TRANSLATE"])){
                this.products[i] = this.conf["INIT_TRANSLATE"]
            } else {
                this.products[i] = this.conf["INIT_REPLICATE"]
            }
        }
	}
	
	clear(){
        this.DNA = []
        this.products = new Array(this.conf["N_OXPHOS"]+this.conf["N_TRANSLATE"]+this.conf["N_REPLICATE"]).fill(0)
	}

    birth(parent, partition = 0.5){
        super.birth(parent)
		this.clear()
		this.divideProducts(parent.products, this.products, partition)
	   
		let new_parent = []
        for (let dna of parent.DNA){
            if (this.C.random() < partition){
				this.DNA.push(dna)
            } else {
                new_parent.push(dna)
            }   
		}
        parent.DNA = new_parent

		this.V = parent.V * partition
        parent.V *= (1-partition)
    }

    /* eslint-disable*/
    update(){
        let dV = 0
        dV += this.oxphos * this.conf["MITO_V_PER_OXPHOS"]
        if (this.oxphos < this.conf["MITOPHAGY_THRESHOLD"]) {
            dV -= this.conf["MITOPHAGY_SHRINK"]   
        }
        dV-=this.conf["MITO_SHRINK"]
        dV = Math.min(this.conf["MITO_GROWTH_MAX"], dV)
        if (dV > 0 && this.canGrow()){
            this.V += dV
        }
        if (dV < 0 && this.canShrink()){
            this.V += dV
        }
        this.repAndTranslate()
        this.deprecateProducts()
        
	}

   
    divideProducts(parent_arr, child_arr, partition){
        for (const [ix, product] of parent_arr.entries()){
            for (let i = 0; i < product; i ++){
                if (this.C.random() < partition){
                    parent_arr[ix]--
                    child_arr[ix]++
                }
            }
        }  
    }

    deprecateProducts(){
        for (const [ix, product] of this.products.entries()){
            this.products[ix] -= this.binomial(product, this.conf['deprecation_rate'])
        }
        for (let i = 0; i < this.DNA.length; i++){
            if (this.C.random() < this.conf["dna_deprecation_rate"]){
                this.DNA.splice(i, 1)
            }
        }
        // this.find_n_replisomes()
    }

    fuse(partner) {
        this.products = this.products.map(function (num, idx) {
            return num + partner.products[idx];
        })
        this.DNA = [...this.DNA, ...partner.DNA]
        this.V += partner.V
        // this.find_n_replisomes()
    }

    heteroplasmy(){
        // compute heteroplasmy
        if (this.DNA.length == 0){
            return NaN
        }
        let all_proteins = new DNA(this.conf, this.C).sumQuality()
        let heteroplasmy = 0
        for (let dna of this.DNA){
            heteroplasmy += (all_proteins - dna.sumQuality() )/all_proteins
            // console.log(all_proteins - dna.sumQuality() )
        }
        return 1 - (heteroplasmy/this.DNA.length)
    }

    tryIncrement(){
        // console.log(this.sum, this.vol, this.vol/this.sum)
        return (this.C.random() < (this.vol/this.sum))
    }

    // should be refactored away
    get sum(){
        return this.products.reduce((t, e) => t + e) + (this.n_replisomes * this.conf["N_REPLICATE"])
    }

    get n_replisomes(){ //should not be getter!!
        return this.DNA.reduce((t,e) =>  e.replicating > 0 ? t+1 : t, 0)
    }
   
    /**
     * @return {Number}
     */
    get vol(){
        return this.C.getVolume(this.id)
    }

    importAndProduce(){
        for (let i = 0 ; i < (this.makebuffer.length + this.importbuffer.length); i++){
            if (this.C.random() < this.makebuffer.length/(this.makebuffer.length + this.importbuffer.length)){
                let p = this.makebuffer.pop()
                if (this.tryIncrement()){
                    this.products[p]++
                }
            } else {
                let p = this.importbuffer.pop()
                if (this.tryIncrement()){
                    this.products[p]++
                } else {
                    this.C.getCell(this.host).cytosol[p]++
                }
            }
        }
    }

    repAndTranslate() {
        if (this.DNA.length == 0 ){ return }
        let replicate_attempts = this.replicate, translate_attempts = this.translate
        // replication and translation machinery try to find DNA to execute on
        this.shuffle(this.DNA)
        for (let i = 0; i < this.DNA.length ; i++){
            if (replicate_attempts + translate_attempts <= 0){break}
            let dna = this.DNA[i]
            if (dna.replicating > 0){
                // tick replisome
                dna.replicating--
                if (dna.replicating == 0){
                    this.DNA.unshift(new DNA(this.conf, this.C, dna)) // add to beginning so it does not evaluate again
                    i++ // array is longer at beginning
                    for (let ix = 0 ; ix < this.replication_products.length; ix++){
                        this.products[ix + this.conf["N_OXPHOS"] + this.conf["N_TRANSLATE"]] ++
                    }
                }
            } else if (this.C.random() < replicate_attempts/(replicate_attempts + translate_attempts)){
                // make replisome
                dna.replicating = this.conf["REPLICATE_TIME"] + 1
                for (let ix = 0 ; ix < this.conf["N_REPLICATE"]; ix++){
                    this.products[ix + this.conf["N_OXPHOS"] + this.conf["N_TRANSLATE"]] --
                }
                replicate_attempts--
            } else {
                // translate
                this.makebuffer.push(...dna.trues)
                translate_attempts-- 
            }
        }
    }

    get oxphos_products() {
        return this.products.slice(0, this.conf["N_OXPHOS"])
    }
    get translate_products() {
        return this.products.slice(this.conf["N_OXPHOS"], this.conf["N_OXPHOS"] + this.conf["N_TRANSLATE"])
    }
    get replication_products() {
        return this.products.slice(this.conf["N_OXPHOS"] + this.conf["N_TRANSLATE"] )
    }
    get replicate_products(){
        return this.replication_products()
    }
    get oxphos(){
        return Math.min.apply(Math, this.oxphos_products)
    }
    get translate(){
        return Math.min.apply(Math, this.translate_products)
    }
    get replicate(){
        return Math.min.apply(Math, this.replication_products) 
    }

	closeToV(){
		return Math.abs(this.V-this.vol) < this.conf["VOLCHANGE_THRESHOLD"]
    }
    canGrow(){
        return this.V-this.vol < this.conf["VOLCHANGE_THRESHOLD"]
    }
    canShrink(){
        return this.vol-this.V < this.conf["VOLCHANGE_THRESHOLD"]
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(this.C.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
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

export default Mitochondrion