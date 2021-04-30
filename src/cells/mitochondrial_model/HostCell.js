import SuperCell from "../SuperCell.js" 
import nDNA from "./nDNA.js"

class HostCell extends SuperCell {

	/* eslint-disable */ 
	constructor (conf, kind, id, mt) {
		super(conf, kind, id, mt)
		this.selfishness = 0.5
		this.V = conf["INIT_HOST_V"]
		this.total_oxphos = 0
		this.DNA = new nDNA(conf, mt)
	}

	birth(parent){
		super.birth(parent)
		this.mutate_selfishness(parent)
		this.V = parent.V/2
		parent.V /= 2
		this.DNA = new nDNA(this.conf, this.mt, parent.DNA)
	}

	mutate_selfishness(parent){
		this.selfishness = parent.selfishness + (this.mt.random() - 0.5)*0.1*2
		this.selfishness = Math.min(1, this.selfishness)
		this.selfishness = Math.max(0, this.selfishness)
	}

	update(C, mitochondria = []){
		// update mitochondria
		this.total_oxphos = 0
		let volcumsum = [0]
		for (let mito of mitochondria){
			volcumsum.push(C.getVolume(mito.id) + volcumsum.slice(-1))
			mito.update(C.getVolume(mito.id))
			this.total_oxphos += mito.oxphos
		}
		volcumsum = volcumsum.map(function(item) {return item/ volcumsum.slice(-1)})


		let trues = this.DNA.trues
		for (let i = 0; i < this.total_oxphos*(1-this.selfishness); i++){
			let ix = trues[Math.floor(this.mt.random() * trues.length)]
			let ran = this.mt.random() 
			let mito = volcumsum.findIndex(element => ran < element )
			mitochondria[mito-1].products[ix]++ //volcumsum counts from 1 as the 
		}
		if (this.V - C.getVolume(this.id) < 30){
			this.V += this.total_oxphos *  this.selfishness 
		}
		this.V -= this.conf["HOST_SHRINK"]
		
		
	}

}

export default HostCell