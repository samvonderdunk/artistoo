
import Cell from "./Cell.js" 

class SuperCell extends Cell {

	constructor (conf, kind, id, C) {
		super(conf, kind, id, C)
		this.host = this.id
		this.subcells = []
	}

	death(){
		/* eslint-disable */
		if (this.subcells.length > 0){
			console.log("Supercell: ". this.id, " died with extant subcells:", this.subcells)
		}
	}

	addSubCell(cell){
		if (!this.subcells.includes(cell)){
			this.subcells.push(cell)
		} else {
			throw("Tried to add subcell when already in subcells", this, cell)
		}
	}

	removeSubCell(cell){
		let ix =  this.subcells.indexOf(cell)
		if (ix !==-1){
			this.subcells.splice(ix, 1)
		}
	}
}

export default SuperCell