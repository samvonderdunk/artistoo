"use strict"

import SubCell from "../SubCell.js" 
import DNA from "./DNA.js" 

class Mitochondrion extends SubCell {

	/* eslint-disable */ 
    constructor (conf, kind, id, C) {
        super(conf, kind, id, C)
        
        this.last_dna_id = 0
        this.DNA = []
        for (let i= 0; i<this.conf["N_INIT_DNA"];i++){
            let dna = new DNA(this.conf, this.C, String(this.id) +"_"+ String(++this.last_dna_id))
            dna.mutate(this.conf["MTDNA_MUT_REP"])
            this.DNA.push(dna)
        }
        
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
        this.fs = undefined
    }

    // TODO add CPM level deathlistener that can log from Sim
    death(){
        super.death()
        let logpath = "./deaths.txt" //HARDCODED
        let mito = {}
        mito["time"] = this.C.time
        mito["V"] = this.V
        mito["host"] = this.host
        mito["vol"] = this.vol
        mito["n DNA"] = this.DNA.length
        mito["oxphos"] = this.oxphos
        mito["translate"] = this.translate
        mito["replicate"] = this.replicate
        mito["replisomes"] = this.n_replisomes
        mito["heteroplasmy"] = this.heteroplasmy()
        mito["translatable heteroplasmy"] = this.heteroplasmy("translatable")
        mito["replicating heteroplasmy"] = this.heteroplasmy("replicating")
        mito["products"] = this.products
        mito['sum dna'] = this.sum_dna()
        mito["unmut"] = this.unmutated/this.DNA.length
        let objstring = JSON.stringify(mito) + '\n'
		if( typeof window !== "undefined" && typeof window.document !== "undefined" ){
            // console.log("detected browser")
            // this.fs.appendFileSync(logpath, objstring)
        } else {
            // console.log("logged to  " + logpath + "\n\n" + objstring)
            if (!this.fs){
                this.fs = require('fs')
            }    
            this.fs.appendFileSync(logpath, objstring)
        }
        
    }

    /* eslint-disable*/
    update(){
        let dV = 0
        dV += this.oxphos * this.conf["MITO_V_PER_OXPHOS"]
        dV-=this.conf["MITO_SHRINK"]
        dV = Math.min(this.conf["MITO_GROWTH_MAX"], dV)
        if (this.oxphos < this.conf["MITOPHAGY_THRESHOLD"]) {
            dV -= this.conf["MITOPHAGY_SHRINK"]   
        }
        if (dV > 0 && this.canGrow()){
            this.V += dV
        }
        if (dV < 0 && this.canShrink()){
            this.V += dV
        }
        this.repAndTranslate()
        this.deprecateProducts()
        // importandcreate() - called by host
        
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
        for (let dna of this.DNA){
            dna.mutate(this.conf['MTDNA_MUT_LIFETIME'])
        }
    }

    fuse(partner) {
        this.products = this.products.map(function (num, idx) {
            return num + partner.products[idx];
        })
        this.DNA = [...this.DNA, ...partner.DNA]
        this.V += partner.V
        // this.find_n_replisomes()
    }

    // tryIncrement(){
    //     return (this.C.random() < (this.vol/this.sum))
    // }

    tryIncrement(ix){
        if (ix < this.conf["N_OXPHOS"] ){
            return this.C.random() < (this.vol / this.oxphos_products.reduce((t, e) => t + e) * this.conf["N_OXPHOS"] * this.conf["K_OXPHOS"] / 100)
        } else if ( ix <  this.conf["N_OXPHOS"] +this.conf["N_TRANSLATE"] ){
            return this.C.random() < (this.vol / this.translate_products.reduce((t, e) => t + e) * this.conf["N_TRANSLATE"] * this.conf["K_TRANSLATE"] / 100)
        } else {
            return this.C.random() < (this.vol / (this.replication_products.reduce((t, e) => t + e) + + (this.n_replisomes * this.conf["N_REPLICATE"])) * this.conf["N_REPLICATE"] * this.conf["K_REPLICATE"] / 100)
        }
    }

    // get sum(){
    //     return this.products.reduce((t, e) => t + e) + (this.n_replisomes * this.conf["N_REPLICATE"])
    // }

    get n_replisomes(){ 
        return this.DNA.reduce((t,e) =>  e.replicating > 0 ? t+1 : t, 0)
    }

    get unmutated(){
        return this.DNA.reduce((t,e) =>  e.sumQuality() == new DNA(this.conf, this.C).sumQuality() ? t+1 : t, 0)
    }

    importAndProduce(){
        this.shuffle(this.makebuffer)
        while ((this.makebuffer.length + this.importbuffer.length) > 0){
            if (this.C.random() < this.makebuffer.length/(this.makebuffer.length + this.importbuffer.length)){
                let p = this.makebuffer.pop()
                if (this.tryIncrement(p)){
                    this.products[p]++
                }
            } else {
                let p = this.importbuffer.pop()
                if (this.tryIncrement(p) && this.oxphos > this.conf["MITOPHAGY_THRESHOLD"]){
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
                    this.DNA.unshift(new DNA(this.conf, this.C, String(this.id) + "_" + String(++this.last_dna_id), dna)) // add to beginning so it does not evaluate again
                    i++ // array is longer at beginning
                    for (let ix = 0 ; ix < this.replication_products.length; ix++){
                        this.products[ix + this.conf["N_OXPHOS"] + this.conf["N_TRANSLATE"]] ++
                    }
                }
            } else if (this.C.random() < replicate_attempts/(replicate_attempts + translate_attempts)){
                // make replisome
                dna.replicating = this.conf["REPLICATE_TIME"] 
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
   
    get oxphos(){
        return Math.min.apply(Math, this.oxphos_products) / (this.vol / 100) / this.conf["OXPHOS_PER_100VOL"]
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

    sum_dna(){
        let sum = new Array(this.conf["N_OXPHOS"]+this.conf["N_TRANSLATE"]+this.conf["N_REPLICATE"]).fill(0)
        for (let dna of this.DNA){
            sum = sum.map(function (num, idx) {
                return num + dna.quality[idx];
            })
        }
        return sum
    }

    heteroplasmy(opt = "all"){
        // compute heteroplasmy, TODO rewrite this
        if (this.DNA.length == 0){
            return NaN
        }
        let all_proteins = new DNA(this.conf, this.C).sumQuality()
        let heteroplasmy = 0
        if (opt == "all"){
            for (let dna of this.DNA){
                heteroplasmy += (all_proteins - dna.sumQuality() )/all_proteins
            }
            heteroplasmy = 1 - (heteroplasmy/this.DNA.length)
        } else if (opt == "translatable"){
            let len = 0
            for (let dna of this.DNA){
                if (dna.replicating == 0){
                    heteroplasmy += (all_proteins - dna.sumQuality() )/all_proteins
                    len++
                }
            }
            if (len == 0){
                return NaN
            } else {
                heteroplasmy = 1 - (heteroplasmy/len)
            }
        }else if (opt == "replicating"){
            let len = 0
            for (let dna of this.DNA){
                if (dna.replicating > 0){
                    heteroplasmy += (all_proteins - dna.sumQuality() )/all_proteins
                    len++
                }
            }
            if (len == 0){
                return NaN
            } else {
                heteroplasmy = 1 - (heteroplasmy/len)
            }
        }
        return heteroplasmy
    }
}

export default Mitochondrion