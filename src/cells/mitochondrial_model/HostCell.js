import Cell from "../Cell.js" 

class HostCell extends Cell {

		/* eslint-disable */ 
	constructor (conf, kind, id, C, parent) {
        super(conf, kind, id, C, parent)
        
        this.mitochondria = []
        this.selfishness = 0.5
        this.cell_products = 0

        this.individualParams = ["V"]

		// this.X = conf["INIT_X"][kind]
		// this.Y = conf["INIT_Y"][kind]
		// this.V = conf["INIT_V"][kind]

		if (parent instanceof Cell){ // copy on birth
            this.selfishness = parent.selfishness
            this.divideProducts(parent)
		} 
	}

    divideProducts(parent){
        //do upon division
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

export default HostCell