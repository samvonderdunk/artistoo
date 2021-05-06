"use strict"

import SuperCell from "../SuperCell.js" 
import nDNA from "./nDNA.js"

class HostCell extends SuperCell {

	/* eslint-disable */ 
	constructor (conf, kind, id, C) {
		super(conf, kind, id, C)
		this.selfishness = 0.5
		this.V = conf["INIT_HOST_V"]
		this.total_oxphos = 0
		this.DNA = new nDNA(conf, C)
	}

	birth(parent){
		super.birth(parent)
		// this.mutate_selfishness(parent)
		this.V = parent.V/2
		parent.V /= 2
		this.DNA = new nDNA(this.conf, this.C, parent.DNA)
	}

	mutate_selfishness(parent){
		this.selfishness = parent.selfishness + (this.C.random() - 0.5)*0.1*2
		this.selfishness = Math.min(1, this.selfishness)
		this.selfishness = Math.max(0, this.selfishness)
	}

	update(){
		this.total_oxphos = 0
		let volcumsum = [0]

		for (let mito of this.subcells){
			volcumsum.push(this.C.getVolume(mito.id) + volcumsum.slice(-1))
			mito.update(this.C.getVolume(mito.id))
			//this.total_oxphos += Math.max(mito.oxphos, C.getVolume(mito.id))
			this.total_oxphos += mito.oxphos
		}
		volcumsum = volcumsum.map(function(item) {return item/ volcumsum.slice(-1)})

		let trues = this.DNA.trues
		for (let i = 0; i < this.total_oxphos*(1-this.selfishness); i++){
			let ix = trues[Math.floor(this.C.random() * trues.length)]
			let ran = this.C.random() 
			let mito = volcumsum.findIndex(element => ran < element )
			if (this.subcells[mito-1].tryIncrement()){
				this.subcells[mito-1].products[ix]++ //volcumsum counts from 1 as the 
			}
		}
		
		// console.log("replicationss took ", performance.now() - prevtime)
		// prevtime = performance.now()
		let dV = 0
		if (this.V - this.C.getVolume(this.id) < 10){
			dV += this.total_oxphos *  this.selfishness *this.conf["HOST_V_PER_OXPHOS"]
		} if (this.subcells.length === 0){
			dV -= this.conf["EMPTY_HOST_SHRINK"]
		}
		dV -= this.conf["HOST_SHRINK"]
		dV = Math.min(this.conf["HOST_GROWTH_MAX"], dV)
		this.V += dV
		// console.log("update me took ", performance.now() - prevtime)
		// prevtime = performance.now()
		// this.V = Math.max(0, this.V)
	}

}

export default HostCell