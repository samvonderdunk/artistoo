import Cell from "../Cell.js" 
import DNA from "../DNA.js" 

class Mitochondrion extends Cell {

		/* eslint-disable */ 
	constructor (conf, kind, id, C, parent) {
        super(conf, kind, id, C, parent)
        
        this.DNA = []
        this.oxphos_products = new Array(this.conf["N_OXPHOS"]).fill(0);
        this.translate_products = new Array(this.conf["N_TRANSLATE"]).fill(0);
        this.replication_products = new Array(this.conf["N_REPLICATE"]).fill(0);
       
        this.potential = 0

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

    update(){
        if (this.DNA.length == 0 ){ return }

        // takes bottleneck as rate
        var rep_attempts = Math.min(this.replication_products) 
        var translate_attempts = Math.min(this.oxpproducts)
        var attempts = rep_attempts + translate_attempts

        // replication and translation machinery try to find DNA to execute on
        while (attempts > 0){
            if (this.mt.random() < rep_attempts/attempts){
                // attempt to find a DNA to replicate
                let ix = Math.floor(mt.random() * this.DNA.length)
                if (this.DNA[ix].notBusy()){ 
                    this.DNA[ix].setReplicateFlag(true)
                }
                replicate_attempts--
                attempts--
            } else {
                // attempt to translate
                let ix = Math.floor(mt.random() * this.DNA.length)
                if (this.DNA[ix].notBusy()){
                    this.DNA[jx].setTranslateFlag(true)
                }
                translate_attempts-- //technically redundant
                attempts--
            }
        }
        for (var dna of this.DNA){
            if (dna.translateFlag){

            }
        }

    }

    divideProducts(parent){
        //do upon division
    }

    addProducts(products){
        //upon fusion, host production
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

	// getColor(){
	// 	return 100/this.Y
	// }
	
}

export default Mitochondrion