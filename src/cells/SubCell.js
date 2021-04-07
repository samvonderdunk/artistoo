
import Cell from "./Cell.js" 

class SubCell extends Cell {

	constructor (conf, kind, id, mt) {
		super(conf, kind, id, mt)
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

export default SubCell