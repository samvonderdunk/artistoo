
import Cell from "./Cell.js" 

class SuperCell extends Cell {

	constructor (conf, kind, id, C) {
		super(conf, kind, id, C)
		this.host = this.id
	}
}

export default SuperCell