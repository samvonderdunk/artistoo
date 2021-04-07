
import Cell from "./Cell.js" 

class SuperCell extends Cell {

	constructor (conf, kind, id, mt) {
		super(conf, kind, id, mt)
		this.host = this.id
		this.subcells = [] //TODO decide whether these are IDs or Cells.
	}

	birth(parent){
		super.birth(parent) // sets ParentId
		this.divideSubCells()
		for (let subcell of this.subcells){
			subcell.host = this.id
		}
	}
    
	divideSubCells(){return} // stub
}

export default SuperCell