import SubCell from "../SubCell.js" 
import DNA from "./DNA.js" 

class Mitochondrion extends SubCell {

	/* eslint-disable */ 
    constructor (conf, kind, id, mt) {
		super(conf, kind, id, mt)
        
		this.DNA = new Array(this.conf["N_INIT_DNA"]).fill(new DNA(this.conf, this.mt));
        this.oxphos_products = new Array(this.conf["N_OXPHOS"]).fill(80);
        this.translate_products = new Array(this.conf["N_TRANSLATE"]).fill(5);
        this.replication_products = new Array(this.conf["N_REPLICATE"]).fill(5);
       
        this.oxphos = this.conf["INIT_OXPHOS"]
        this.V = this.conf["INIT_OXPHOS"]
	}
	
	clear(){
		this.DNA = []
        this.oxphos_products = new Array(this.conf["N_OXPHOS"]).fill(0)
        this.translate_products = new Array(this.conf["N_TRANSLATE"]).fill(0)
        this.replication_products = new Array(this.conf["N_REPLICATE"]).fill(0)
	}

    birth(parent, partition = 0.5){
		this.clear()
		this.divideProducts(parent.oxphos_products, this.oxphos_products, partition)
        this.divideProducts(parent.translate_products, this.translate_products, partition)
        this.divideProducts(parent.replication_products, this.replication_products, partition)
	   
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
    
    shuffleArray(unshuffled) {
        let shuffled = unshuffled // not always necessary - could be done in place - this is to maybe use it later for any arrays that need to retain structure
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(this.mt.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled
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
}

export default Mitochondrion