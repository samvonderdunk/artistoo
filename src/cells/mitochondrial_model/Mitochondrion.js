"use strict"

import SubCell from "../SubCell.js" 
import DNA from "./DNA.js" 

class Mitochondrion extends SubCell {

	/* eslint-disable */ 
    constructor (conf, kind, id, C) {
		super(conf, kind, id, C)
        
        this.DNA = new Array(this.conf["N_INIT_DNA"]).fill(new DNA(this.conf, this.C));
        
        // this.n_replisomes = 0

        // this.oxphos = this.conf["INIT_OXPHOS"]
        this.V = this.conf["INIT_MITO_V"]

        this.products = new Array(this.conf["N_OXPHOS"]+this.conf["N_TRANSLATE"]+this.conf["N_REPLICATE"]).fill(0)
        for (let i = 0 ; i < this.products.length; i++){
            if (i < this.conf["N_OXPHOS"] ){
                this.products[i] = this.conf["INIT_OXPHOS"]
            } else if (i < this.conf["N_TRANSLATE"]){
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
        // this.find_n_replisomes()
        // parent.find_n_replisomes()
		
		this.V = parent.V * partition
        parent.V *= 1-partition
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
    // find_n_replisomes(){ //should not be getter!!
    //     let sum = 0 
    //     for (let dna of this.DNA){
    //         if (dna.replicating > 0){
    //             sum++
    //         }
    //     }
    //     this.n_replisomes = sum
    // }
    /**
     * @return {Number}
     */
    get vol(){
        return this.C.getVolume(this.id)
    }

    repAndTranslate() {
        if (this.DNA.length == 0 ){ return }
        let replicate_attempts = this.replicate, translate_attempts = this.translate
        // replication and translation machinery try to find DNA to execute on
        this.shuffle(this.DNA)
        for (let dna of this.DNA){
            if (replicate_attempts + translate_attempts < 0){
                break
            } 
            if (dna.busy()){
                continue
            }

            if (this.C.random() < replicate_attempts/(replicate_attempts + translate_attempts)){
                dna.replicating = this.conf["REPLICATE_TIME"] + 1
                for (let i = 0 ; i < this.conf["N_REPLICATE"]; i++){
                    this.products[i + this.conf["N_OXPHOS"] + this.conf["N_TRANSLATE"]] --
                }
                replicate_attempts--
            } else {
                dna.translateFlag = true
                for (const [i, val] of dna.quality.entries()){
                    if (val  &&  this.tryIncrement()){
                        this.products[i] += val
                    }
                } 
                translate_attempts-- 
            }
        }
        // while ((replicate_attempts + translate_attempts) > 0){
        //     let dna = this.DNA[Math.floor(this.C.random() * this.DNA.length)]
        //     if (dna.busy()){
        //         continue
        //     }
        //     if (this.C.random() < replicate_attempts/(replicate_attempts + translate_attempts) && ){
                
        //     } else {

                
        //     }
        // }

        for (let dna of this.DNA){
            if (dna.translateFlag){ 
                dna.translateFlag = false
             } else if (dna.replicating > 0) { 
                // if (this.C.random() < this.conf['replication_rate'] && this.tryIncrement()){
                dna.replicating--
                if (dna.replicating == 0){
                    this.DNA.push(new DNA(this.conf, this.C, dna))
                    // this.n_replisomes--
                    // console.log("FULLY replicated mtDNA")
                    for (let i = 0 ; i < this.replication_products.length; i++){
                        this.products[i + this.conf["N_OXPHOS"] + this.conf["N_TRANSLATE"]] ++
                    }
                }
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