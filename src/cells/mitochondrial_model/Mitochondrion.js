import SubCell from "../SubCell.js" 
import DNA from "./DNA.js" 

class Mitochondrion extends SubCell {

	/* eslint-disable */ 
    constructor (conf, kind, id, mt) {
		super(conf, kind, id, mt)
        
		this.DNA = new Array(this.conf["N_INIT_DNA"]).fill(new DNA(this.conf, this.mt));

        // this.oxphos = this.conf["INIT_OXPHOS"]
        this.V = this.conf["INIT_OXPHOS"]

        this.products = new Array(this.conf["N_OXPHOS"]+this.conf["N_TRANSLATE"]+this.conf["N_REPLICATE"]).fill(0)
        for (let i = 0 ; i < this.products.length; i++){
            if (i < this.conf["N_OXPHOS"] ){
                this.products[i] = 80
            } else if (i < this.conf["N_TRANSLATE"]){
                this.products[i] = 5
            } else {
                this.products[i] = 5
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
            if (this.mt.random() < partition){
				this.DNA.push(dna)
            } else {
                new_parent.push(dna)
            }   
		}
		parent.DNA = new_parent
		
		this.V = parent.V * partition
        parent.V *= 1-partition
    }

    /* eslint-disable*/
    update(current_volume){
        // console.log(this.oxphos, this.oxphos_products, current_volume) 
        let dV = 0
        if (this.V - current_volume < 10){
            dV += this.oxphos * this.conf["MITO_V_PER_OXPHOS"]
        }
        if (this.oxphos < 20) {
            dV -= this.conf["MITOPHAGY_SHRINK"]
            // console.log("IN MITOPHAGY",this.conf["MITOPHAGY_SHRINK"] , this.V)
        }
        dV-=this.conf["MITO_SHRINK"]
        dV = Math.min(this.conf["MITO_GROWTH_MAX"], dV)
        this.V += dV
        // this.V = Math.max(0, this.V)
        // console.log(this.products)
        this.repAndTranslate()
        this.deprecateProducts()
	}

   
    divideProducts(parent_arr, child_arr, partition){
        for (const [ix, product] of parent_arr.entries()){
            for (let i = 0; i < product; i ++){
                if (this.mt.random() < partition){
                    parent_arr[ix]--
                    child_arr[ix]++
                }
            }
        }  
    }

    deprecateProducts(){
        for (const [ix, product] of this.products.entries()){
            for (let i = 0; i < product; i ++){
                if (this.mt.random() < this.conf['deprecation_rate']){
                    this.products[ix]--
                }
            }
        }
        for (let i = 0; i < this.DNA.length; i++){
            if (this.mt.random() < this.conf["dna_deprecation_rate"]){
                this.DNA.splice(i, 1)
            }
        }
    }

    fuse(partner) {
        this.products = this.products.map(function (num, idx) {
            return num + partner.products[idx];
        })
        this.DNA = [...this.DNA, ...partner.DNA]
    }

    heteroplasmy(){
        // compute heteroplasmy
        if (this.DNA.length == 0){
            return 0
        }
        let all_proteins = new DNA(this.conf, this.mt).sumQuality()
        let heteroplasmy = 0
        for (let dna of this.DNA){
            heteroplasmy += (dna.sumQuality() < all_proteins)
        }
        return heteroplasmy/this.DNA.length
    }


    repAndTranslate() {
        if (this.DNA.length == 0 ){ return }
       
        // takes bottleneck as rate
        let replicate_attempts = Math.min.apply(Math, this.replication_products), translate_attempts = Math.min.apply(Math, this.translate_products)
        // replication and translation machinery try to find DNA to execute on

        while ((replicate_attempts + translate_attempts) > 0){
            let ix = Math.floor(this.mt.random() * this.DNA.length)
            if (this.mt.random() < replicate_attempts/(replicate_attempts + translate_attempts)){
                if (this.DNA[ix].notBusy()){ this.DNA[ix].replicateFlag = true}
                replicate_attempts--
            } else {
                if (this.DNA[ix].notBusy()){this.DNA[ix].translateFlag = true}
                translate_attempts-- 
            }
        }

        for (let dna of this.DNA){
            if (dna.translateFlag){
                if (this.mt.random() < this.conf['translation_rate']){
                    this.products = this.products.map(function (num, idx) {
                        return num + dna.quality[idx];
                    })
                }
                dna.translateFlag = false
            } else if (dna.replicateFlag) { 
                if (this.mt.random() < this.conf['replication_rate']){
                    this.DNA.push(new DNA(this.conf, this.mt, dna))
                }
                dna.replicateFlag = false
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
}

export default Mitochondrion