"use strict"

import SubCell from "../SubCell.js" 
import DNA from "./DNA.js" 
import Products from "./Products.js" 

class Mitochondrion extends SubCell {

	/* eslint-disable */ 
    constructor (conf, kind, id, C) {
        super(conf, kind, id, C)
        
        this.last_dna_id = 0
        this.DNA = []
        for (let i= 0; i<this.conf["N_INIT_DNA"];i++){
            let dna = new DNA(this.conf, this.C, String(this.id) +"_"+ String(++this.last_dna_id))
            dna.mutate(this.conf["MTDNA_MUT_INIT"])
            this.DNA.push(dna)
        }
        
        this.V = this.conf["INIT_MITO_V"]
        this.fusing = false

        this.proteinbuffer = []
        this.oxphos_q = new Array(5).fill(0)

        this.time_of_birth = this.C.time
        
        this.products = new Products(this.conf, this.C)
        this.products.init()
        this.bad_products = new Products(this.conf, this.C)
	}
	
	clear(){
        this.DNA = []
        this.products = new Products(this.conf, this.C)
        this.bad_products = new Products(this.conf, this.C)
	}

    birth(parent, partition){
        super.birth(parent)
		this.clear()
        this.divideProducts(parent.products, this.products, partition)
        this.divideProducts(parent.bad_products, this.bad_products, partition)
        
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
        this.makeAssemblies()
    }

    
    death(){
        super.death()
        if (this.fusing){
            return
        }
        let logpath = "./deaths.txt" //HARDCODED
        let objstring = JSON.stringify(this.stateDct()) + '\n'
		if( typeof window !== "undefined" && typeof window.document !== "undefined" ){
        } else {
            if (!this.fs){
                this.fs = require('fs')
            }    
            this.fs.appendFileSync(logpath, objstring)
        }
        
    }

    /* eslint-disable*/
    update(){
        this.makeAssemblies()
        let dV = 0
        dV += this.oxphos * this.cellParameter("MITO_V_PER_OXPHOS")
        dV-= this.cellParameter("MITO_SHRINK")
        dV = Math.min(this.cellParameter("MITO_GROWTH_MAX"), dV)
        if (this.oxphos < this.cellParameter("MITOPHAGY_THRESHOLD")) {
            dV -= this.cellParameter("MITOPHAGY_SHRINK")
        }
        if (this.closeToV()){
            this.V += dV
        }
        this.repAndTranslate()
        this.deprecateProducts()
        // importandcreate() - called by host
        
	}

   
    divideProducts(parent_products, child_products, partition){
        for (const [ix, product] of parent_products.arr.entries()){
            for (let i = 0; i < product; i ++){
                if (this.C.random() < partition){
                    parent_products.arr[ix]--
                    child_products.arr[ix]++
                }
            }
        }  
    }

    deprecateProducts(){
       this.products.deprecate(this.cellParameter('deprecation_rate'))
       this.bad_products.deprecate(this.cellParameter('deprecation_rate'))
       
        for (const [ix, dna] of this.DNA.entries()){
            dna.mutate(this.cellParameter('MTDNA_MUT_ROS') * this.ros)
        }
    }

    fuse(partner) {
        this.products.arr = this.sum_arr(this.products.arr, partner.products.arr)
        this.bad_products.arr = this.sum_arr(this.bad_products.arr, partner.bad_products.arr)

        this.DNA = [...this.DNA, ...partner.DNA]
        this.V += partner.V
        partner.fusing = true
    }

    tryIncrement(){
        return this.C.random() < (this.vol /  this.sum_arr(this.products.arr, this.bad_products.arr).reduce((t, e) => t + e))
    }

    /**
	 * all evolvables of Mitochondria are controlled by host
     * returns conf value if host not extant
     * TODO add all parameters at birth to mito so they stay with extant subcells after host death
	*/
	cellParameter(param){
		if ((this.C.cells[this.host] || {})[param] !== undefined){
			return this.C.cells[this.host][param] 
		}
		return this.conf[param]
	}

    get n_replisomes(){ 
        return this.DNA.reduce((t,e) =>  e.replicating > 0 ? t+1 : t, 0)
    }

    get unmutated(){
        return this.DNA.reduce((t,e) =>  e.sumQuality() == new DNA(this.conf, this.C).sumQuality() ? t+1 : t, 0)
    }

    importAndProduce(){
        this.shuffle(this.proteinbuffer)
        while (this.proteinbuffer.length > 0){
            let p = this.proteinbuffer.pop()
            if (this.tryIncrement(p.which)){
                if (p.good){
                    this.products.arr[p.which]++
                } else {
                    this.bad_products.arr[p.which]++
                }
            } 
        }
    }

    repAndTranslate() {
        if (this.DNA.length == 0 ){ return }
        let replicate_attempts = this.replicate, translate_attempts = this.translate
        // replication and translation machinery try to find DNA to execute on
        this.shuffle(this.DNA)
        let new_dna = []
        for (let dna of this.DNA){
            if (replicate_attempts <= 0){
                break
            }
            if (dna.replicating > 0){
                replicate_attempts--
                dna.replicating--
                if (dna.replicating == 0){
                    new_dna.push(new DNA(this.conf, this.C, String(this.id) + "_" + String(++this.last_dna_id), dna)) 
                }
            }
        }
        
        
        for (let dna of this.DNA){
            if (replicate_attempts + translate_attempts <= 0){
                break
            }
            if (this.C.random() < replicate_attempts/(replicate_attempts + translate_attempts)){
                dna.replicating = this.cellParameter("REPLICATE_TIME")
                replicate_attempts--
            } else {
                // translate
                for (let ix = 0 ; ix < dna.quality.length; ix++){
                    if (dna.exists[ix] !== 0){
                        this.proteinbuffer.push({"which":ix,"good":dna.quality[ix]})
                    }
                }
                translate_attempts-- 
            }
        }
        this.DNA = [...this.DNA, ...new_dna]
    }

    
    // Note: expects shallow copies of arrays.
    assemble(arr, bad_arr){
        let assemblies = 0
        while (true) {
            let complete = 1
            for (let  j= 0; j<arr.length; j++){
                let all_j = arr[j] + bad_arr[j] 
                if (all_j == 0){
                    return assemblies
                }
                if(this.C.random() < bad_arr[j]/all_j){
                    bad_arr[j]--
                    complete = 0
                } else {
                    arr[j]--
                }
            }
            assemblies += complete
        }
    }
   
    makeAssemblies(){
        this.oxphos = this.assemble(this.products.oxphos, this.bad_products.oxphos)/ (this.vol / 100) * this.conf["OXPHOS_PER_100VOL"]
        this.translate = this.assemble(this.products.translate, this.bad_products.translate)
        this.replicate = this.assemble(this.products.replicate, this.bad_products.replicate)
        this.ros = Math.min.apply(Math, this.sum_arr(this.products.oxphos,this.bad_products.oxphos)) / (this.vol / 100) * this.conf["OXPHOS_PER_100VOL"]
        this.oxphos_q.push(this.oxphos)
        this.oxphos_q = this.oxphos_q.slice(-5)
    }

    get oxphos_avg() {
        return this.oxphos_q.reduce((t, e) => t + e) / 5
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(this.C.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    sum_arr(arr1, arr2){
        // console.log(arr1)
        return arr1.map(function (num, idx) {
            return num + arr2[idx];
        })
    }

    stateDct(){
        let mito = {}
        mito["time"] = this.C.time
        mito["V"] = this.V
        mito["id"] = this.id
        mito["host"] = this.host
        mito["vol"] = this.vol
        mito["n DNA"] = this.DNA.length
        mito["oxphos"] = this.oxphos
        mito["oxphos_avg"] = this.oxphos_avg
        mito["translate"] = this.translate
        mito["replicate"] = this.replicate
        mito["replisomes"] = this.n_replisomes
        mito["type"] = "mito"
        mito["time of birth"] = this.C.time_of_birth
        mito["products"] = this.products.arr
        mito["bad products"] = this.bad_products.arr.slice(0,10)
        let sumdna = new Array(this.conf["N_OXPHOS"]+this.conf["N_TRANSLATE"]+this.conf["N_REPLICATE"]).fill(0)
        for (let dna of this.DNA){
            sumdna = this.sum_arr(sumdna, dna.quality)
        }
        mito['sum dna'] = sumdna.slice(0,10)
        mito["unmut"] = this.unmutated/this.DNA.length
        return mito
    }
    
}

export default Mitochondrion