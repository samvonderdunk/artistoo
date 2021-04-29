import SubCell from "../SubCell.js" 
import DNA from "./DNA.js" 

class Mitochondrion extends SubCell {

	/* eslint-disable */ 
    constructor (conf, kind, id, mt) {
		super(conf, kind, id, mt)
        
		this.DNA = new Array(this.conf["N_INIT_DNA"]).fill(new DNA(this.conf, this.mt));
        // this.oxphos_products = new Array(this.conf["N_OXPHOS"]).fill(80);
        // this.translate_products = new Array(this.conf["N_TRANSLATE"]).fill(5);
        // this.replication_products = new Array(this.conf["N_REPLICATE"]).fill(5);
        // this.products = 
       
        this.oxphos = this.conf["INIT_OXPHOS"]
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
		this.clear()
		this.divideProducts(parent.products, this.products, partition)
        // this.divideProducts(parent.translate_products, this.translate_products, partition)
        // this.divideProducts(parent.replication_products, this.replication_products, partition)
	   
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
    }

    replicateDNA(dna){
        this.DNA.push(new DNA(this.conf, this.mt, dna))
    }

    setProducts(oxphos_products, translate_products, replication_products){
        this.oxphos_products = oxphos_products
        this.translate_products = translate_products
        this.replication_products = replication_products
    }

    fuse(partner) {

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

}

export default Mitochondrion