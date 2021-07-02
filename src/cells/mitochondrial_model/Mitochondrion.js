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

        this.makebuffer = [], this.importbuffer = []
        
        this.products = new Products(this.conf, this.C)
        this.products.init()
        this.bad_products = new Products(this.conf, this.C)
        // this.time = -1
        this.makeAssemblies()
	}
	
	clear(){
        this.DNA = []
        this.products = new Products(this.conf, this.C)
        this.bad_products = new Products(this.conf, this.C)
	}

    birth(parent, partition = 0.5){
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
        // mito["heteroplasmy"] = this.heteroplasmy()
        // mito["translatable heteroplasmy"] = this.heteroplasmy("translatable")
        // mito["replicating heteroplasmy"] = this.heteroplasmy("replicating")
        mito["products"] = this.products.arr
        mito["bad products"] = this.bad_products.arr
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
        this.makeAssemblies()
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
       this.products.deprecate(this.conf['deprecation_rate'])
       this.bad_products.deprecate(this.conf['deprecation_rate'])
       
        for (const [ix, dna] of this.DNA.entries()){
            dna.mutate(this.conf['MTDNA_MUT_LIFETIME'] * this.oxphos)
            if (this.C.random() < this.conf["dna_deprecation_rate"]){
                this.DNA.splice(ix, 1)
            }
        }
    }

    fuse(partner) {
        this.products.arr = this.sum_arr(this.products.arr, partner.products.arr)
        this.bad_products.arr = this.sum_arr(this.bad_products.arr, partner.bad_products.arr)

        this.DNA = [...this.DNA, ...partner.DNA]
        this.V += partner.V
    }

    /* eslint-ignore */
    tryIncrement(ix){
        return this.C.random() < (this.vol /  this.sum_products().reduce((t, e) => t + e))
        // if (ix < this.conf["N_OXPHOS"] ){
        //     return this.C.random() < (this.vol / (this.products.oxphos_sum +this.bad_products.oxphos_sum) * this.conf["N_OXPHOS"] * this.conf["K_OXPHOS"] / 100)
        // } else if ( ix <  this.conf["N_OXPHOS"] +this.conf["N_TRANSLATE"] ){
        //     return this.C.random() < (this.vol /( this.products.translate_sum+ this.bad_products.replicate_sum )* this.conf["N_TRANSLATE"] * this.conf["K_TRANSLATE"] / 100)
        // } else {
        //     return this.C.random() < (this.vol / (this.products.replicate_sum + this.bad_products.replicate_sum ) * this.conf["N_REPLICATE"] * this.conf["K_REPLICATE"] / 100)
        // }
    }


    get n_replisomes(){ 
        return this.DNA.reduce((t,e) =>  e.replicating > 0 ? t+1 : t, 0)
    }

    get unmutated(){
        return this.DNA.reduce((t,e) =>  e.sumQuality() == new DNA(this.conf, this.C).sumQuality() ? t+1 : t, 0)
    }

    importAndProduce(){
        this.shuffle(this.makebuffer)
        // console.log(this.makebuffer)
        while ((this.makebuffer.length + this.importbuffer.length) > 0){
            if (this.C.random() < this.makebuffer.length/(this.makebuffer.length + this.importbuffer.length)){
                let p = this.makebuffer.pop()
                if (this.tryIncrement(p.which)){
                    if (p.good){
                        this.products.arr[p.which]++
                    } else {
                        this.bad_products.arr[p.which]++
                    }
                }
            } else {
                let p = this.importbuffer.pop()
                if (this.tryIncrement(p.which) && this.oxphos > this.conf["MITOPHAGY_THRESHOLD"]){
                    // currently no bad nuclear products.
                    this.products.arr[p.which]++
                } else {
                    this.C.getCell(this.host).cytosol[p.which]++
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
                dna.replicating = this.conf["REPLICATE_TIME"] 
                replicate_attempts--
            } else {
                // translate
                for (let ix = 0 ; ix < dna.quality.length; ix++){
                    if (dna.exists[ix] !== 0){
                        this.makebuffer.push({"which":ix,"good":dna.quality[ix]})
                    }
                }
                translate_attempts-- 
            }
        }
        this.DNA = [...this.DNA, ...new_dna]
    }

    // expects shallow copies!!!
    assemble(arr, bad_arr){
        // console.log("-------")
        let assemblies = 0, attempts = Math.min.apply(Math, this.sum_arr(arr,bad_arr)) 
        for (let i = 0; i < attempts ; i ++){
            // console.log(arr, bad_arr, assemblies)
            let complete = 1
            for (let  j= 0; j<arr.length; j++){
                if(this.C.random() < bad_arr[j]/(arr[j]+bad_arr[j])){
                    bad_arr[j]--
                    complete = 0
                } else {
                    arr[j]--
                }
            }
            assemblies += complete
        }
        return assemblies
    }
   
    makeAssemblies(){
        this.oxphos = this.assemble(this.products.oxphos, this.bad_products.oxphos)/ (this.vol / 100) * this.conf["OXPHOS_PER_100VOL"]
        this.translate = this.assemble(this.products.translate, this.bad_products.translate)
        this.replicate = this.assemble(this.products.replicate, this.bad_products.replicate)
        // this.time = this.C.time
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


    sum_dna(){
        let sum = new Array(this.conf["N_OXPHOS"]+this.conf["N_TRANSLATE"]+this.conf["N_REPLICATE"]).fill(0)
        for (let dna of this.DNA){
            sum = this.sum_arr(sum, dna.quality)
        }
        return sum
    }

    sum_products(){
        let bad_arr = this.bad_products.arr
        return this.products.arr.map(function (num, idx) {
            return num - bad_arr[idx];
        })
    }

    sum_arr(arr1, arr2){
        // console.log(arr1)
        return arr1.map(function (num, idx) {
            return num + arr2[idx];
        })
    }

    
}

export default Mitochondrion