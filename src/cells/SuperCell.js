
import Cell from "./Cell.js" 

class SuperCell extends Cell {

	constructor (conf, kind, id, mt, parent) {
		super(conf, kind, id, mt, parent)
	}

	birth(parent){
		super.birth(parent) // sets ParentId
		// this.V  = parent.V
		// this.divideProducts(parent) 
	}

	// setXY(X, Y){
	// 	this.X = Math.max(0, X)
	// 	this.Y = Math.max(0, Y)
	// }

	
}

export default SuperCell