
import Cell from "./Cell.js" 

class SubCell extends Cell {

	// first host should be set during seeding!

	constructor (conf, kind, id, C) {
		super(conf, kind, id, C)
	}

	birth(parent){
		super.birth(parent) // sets ParentId
		this.host = parent.host
	}


	death(){
		this.C.cells[this.host].removeSubCell(this)
	}

	set host(newHost){
		if (this.hostId !== undefined){
			this.C.cells[this.hostId].removeSubCell(this)
		}
		this.hostId = newHost
		this.C.cells[newHost].addSubCell(this)
	}

	get host(){
		return this.hostId
	}
}

export default SubCell