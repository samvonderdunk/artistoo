
import Cell from "./Cell.js" 

class SuperCell extends Cell {

	constructor (conf, kind, id, mt) {
		super(conf, kind, id, mt)
		this.host = this.id
	}
}

export default SuperCell