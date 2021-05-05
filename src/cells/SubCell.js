
import Cell from "./Cell.js" 

class SubCell extends Cell {

	// first host should be set during seeding!

	constructor (conf, kind, id, C) {
		super(conf, kind, id, C)
		this.host = -1
	}

	birth(parent){
		super.birth(parent) // sets ParentId
		this.host = parent.host
	}
}

export default SubCell