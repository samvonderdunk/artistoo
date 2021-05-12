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
		this.cytosol = new Array(this.conf["N_OXPHOS"]+this.conf["N_TRANSLATE"]+this.conf["N_REPLICATE"]).fill(0)
		// make volume dependent cytosol carrying capcaity
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
		if (this.subcells.length === 0 ){
			// console.log(this.V, this.vol)
			if (this.closeToV()){
				
				this.V -= this.conf["EMPTY_HOST_SHRINK"]
			}
			return
		}
		this.total_oxphos = 0
		let volcumsum = [0]
		// let print = this.C.random() <0.001
		for (let mito of this.subcells){
			volcumsum.push(this.C.getVolume(mito.id) + volcumsum[volcumsum.length-1])
			mito.update()
			//this.total_oxphos += Math.max(mito.oxphos, C.getVolume(mito.id))
			this.total_oxphos += mito.oxphos
		}
		volcumsum = volcumsum.map(function(item) {return item/ volcumsum.slice(-1)})
		let trues = this.DNA.trues
		for (let i = 0; i < this.total_oxphos*(1-this.selfishness); i++){
			let ix = trues[Math.floor(this.C.random() * trues.length)]
			if (this.tryIncrement()){
				this.cytosol[ix]++
			}
		}
		for (const [ix, product] of this.cytosol.entries()){
			for (let i = 0 ; i < product;i++){
				let ran = this.C.random() 
				let mito = volcumsum.findIndex(element => ran < element )
				if (this.subcells[mito-1].tryIncrement() && this.V - this.vol < 10){
					this.subcells[mito-1].products[ix]++ //volcumsum counts from 1 as the 
					this.cytosol[ix]--
				} 
			}
		}


		let dV = 0

		dV += this.total_oxphos *  this.selfishness *this.conf["HOST_V_PER_OXPHOS"]
		dV -= this.conf["HOST_SHRINK"]
		dV = Math.min(this.conf["HOST_GROWTH_MAX"], dV)
		if (this.closeToV()){
			this.V += dV
			// for (let mito of this.subcells){
			// 	if (mito.closeToV())
			// 		if (dV > 0){
			// 			mito.V += dV * this.conf["MITO_V_PER_OXPHOS"]
			// 		} else {
			// 			mito.V += dV
			// 		}
			// }
        }
	}

	closeToV(){
		return Math.abs(this.V-this.vol) < this.conf["VOLCHANGE_THRESHOLD"]
	}

	
	tryIncrement(){
        // console.log(this.sum, this.vol, this.vol/this.sum)
        return (this.C.random() < (this.C.getVolume(this.id)/this.sum))
	}
	
	// should be refactored away
	get sum(){
		return this.cytosol.reduce((t, e) => t + e)
	}

    /**
     * @return {Number}
     */
    get vol(){
        return this.C.getVolume(this.id)
    }


	death(){
		/* eslint-disable */
		super.death()
		for (let mito of this.subcells){
			mito.V = -5000
		}
	}
}

export default HostCell