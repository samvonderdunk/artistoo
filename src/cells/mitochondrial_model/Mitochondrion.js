import SubCell from "../SubCell.js" 
import DNA from "./DNA.js" 

class Mitochondrion extends SubCell {

	/* eslint-disable */ 
	constructor (conf, kind, id, C, parent) {
        super(conf, kind, id, C, parent)
        
        this.DNA = []
        this.oxphos_products = new Array(this.conf["N_OXPHOS"]).fill(this.conf["INIT_OXPHOS"]);
        this.translate_products = new Array(this.conf["N_TRANSLATE"]).fill(5);
        this.replication_products = new Array(this.conf["N_REPLICATE"]).fill(5);
       
        this.oxphos = this.conf["INIT_OXPHOS"]
        this.V = this.conf["INIT_OXPHOS"]

        this.individualParams = ["V", "P"]

		// this.X = conf["INIT_X"][kind]
		// this.Y = conf["INIT_Y"][kind]
		// this.V = conf["INIT_V"][kind]

		if (parent instanceof Cell){ // copy on birth
            this.divideProducts(parent)
		} else {
            for (let i = 0 ; i < this.conf["N_INIT_DNA"]; i++){
                this.DNA[i] = new DNA(this.conf, this.mt)
            }
        }
    }

    // update(){
    //     this.oxphos += Math.min(this.oxphos_products) - this.conf["MITO_SHRINK"]

    //     if (this.DNA.length == 0 ){ return }
    //     // takes bottleneck as rate
    //     var rep_attempts = Math.min(this.replication_products) 
    //     var translate_attempts = Math.min(this.translate_products)
    //     var attempts = rep_attempts + translate_attempts

    //     // replication and translation machinery try to find DNA to execute on
    //     while (attempts > 0){
    //         if (this.mt.random() < rep_attempts/attempts){
    //             // attempt to find a DNA to replicate
    //             let ix = Math.floor(mt.random() * this.DNA.length)
    //             if (this.DNA[ix].notBusy()){ 
    //                 this.DNA[ix].setReplicateFlag(true)
    //             }
    //             replicate_attempts--
    //             attempts--
    //         } else {
    //             // attempt to translate
    //             let ix = Math.floor(mt.random() * this.DNA.length)
    //             if (this.DNA[ix].notBusy()){
    //                 this.DNA[jx].setTranslateFlag(true)
    //             }
    //             translate_attempts-- //technically redundant
    //             attempts--
    //         }
    //     }
    //     for (var dna of this.DNA){
    //         if (dna.translateFlag){
    //             console.log(dna.oxphos_quality, this.oxphos_products)
    //             this.oxphos_products += dna.oxphos_quality
    //             this.translate_products += dna.translate_quality
    //             this.replication_products += dna.replication_quality
    //             dna.setTranslateFlag(false)
    //         } else if (dna.replicateFlag) { 
    //             this.DNA.push(new DNA(conf, mt, dna))
    //             dna.setReplicateFlag(false)
    //         }
    //     }

    // }

    divideProducts(parent){
        let new_arr_1 = [[], [], []]
        let new_arr_2 = [[], [], []]
        for (const [which, arr] of [parent.oxphos_products, parent.translate_products, parent.replication_products].entries()){
            // console.log(arr, typeof arr)
            for (const [ix, product] of arr.entries()){
                new_arr_1[which].push(0)
                new_arr_2[which].push(0)
                for (let i = 0; i < product; i ++){
                    if (this.mt.random() > 0.5){
                        new_arr_1[which][ix]++
                    } else {
                        new_arr_2[which][ix]++
                    }   
                
                // let fluct = Math.floor(this.conf["NOISE"]* (2  *this.mt.random() - 1))
                // if ((product/2 - Math.abs(fluct)) < 0){ 
                //     fluct = Math.floor(product/2) * Math.sign(fluct)
                // }
                // // console.log(fluct)
                // new_arr_1[which].push(Math.floor(product/2) + fluct)
                // new_arr_2[which].push(Math.floor(product/2) - fluct)
                // if (product % 2 !== 0){
                    
                }  
            }
        }
        // console.log("products:", [parent.oxphos_products, parent.translate_products, parent.replication_products],new_arr_1,new_arr_2)
        this.setProducts(new_arr_1[0], new_arr_1[1], new_arr_1[2])
        parent.setProducts(new_arr_2[0], new_arr_2[1], new_arr_2[2])
        

        // let fluct = this.conf["NOISE"]* (2  *this.mt.random() - 1)
        // if ((parent.DNA.length/2 - Math.abs(fluct)) < 0){
        //     fluct = parent.DNA.length/2  * Math.sign(fluct)
        // }
        // console.log('orig dna length', parent.DNA.length)
        let all_dna = this.shuffleArray(parent.DNA)
        parent.DNA = []
        this.DNA = [] //redundant for birth call - but to be sure in later implementation
        for (let dna of all_dna){
            if (this.mt.random() > 0.5){
                this.DNA.push(dna)
            } else {
                parent.DNA.push(dna)
            }   
        }
        // for (const [ix, dna] of all_dna.entries()){
        //     if (ix < (Math.floor(parent.DNA.length/2) - Math.floor(fluct))){
        //         parent.DNA.push(dna)
        //     } else {
        //         this.DNA.push(dna)
        //     }
        // }
        // console.log('child 1 ', parent.DNA, "child 2", this.DNA)

		this.V = parent.V/2
        parent.V /= 2
        // throw("HEY")
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

	/* eslint-disable */ 
	getIndividualParam(param){
		if (param == "V"){
			// console.log(this.V)
			return this.V
		} 
		throw("Implement changed way to get" + param + " constraint parameter per individual, or remove this from " + typeof this + " Cell class's indivualParams." )
	}

    heteroplasmy(){
        // compute heteroplasmy
        if (this.DNA.length == 0){
            return 0
        }
        let all_proteins = new DNA(this.conf, this.mt).sumQuality()
        let heteroplasmy = 0
        for (let dna of this.DNA){
            if (dna.sumQuality() < all_proteins){
                heteroplasmy++
            }
        }
        return heteroplasmy/this.DNA.length
    }
	// getColor(){
	// 	return 100/this.Y
	// }
	
}

export default Mitochondrion