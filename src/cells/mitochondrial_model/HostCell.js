"use strict"

import SuperCell from "../SuperCell.js" 
import nDNA from "./nDNA.js"

class HostCell extends SuperCell {

	/* eslint-disable */ 
	constructor (conf, kind, id, C) {
		super(conf, kind, id, C)
		this.V = conf["INIT_HOST_V"]
		this._fission_rate = conf["fission_rate"]
		this._fusion_rate = conf["fusion_rate"]
		this._rep = conf["REP"]
		this._rep2 = conf["REP2"]
		this.total_oxphos = 0
		this.DNA = new nDNA(conf, C) 
		this.cytosol = new Array(this.conf["N_OXPHOS"]+this.conf["N_TRANSLATE"]+this.conf["N_REPLICATE"]).fill(0)
		this.time_of_birth = this.C.time
		this.fission_events = 0
		this.fusion_events = 0
	}

	birth(parent, partition){
		super.birth(parent, partition)
		this.V = parent.V * partition
        parent.V *= (1-partition)
		this.DNA = new nDNA(this.conf, this.C, parent.DNA)
		for (const [ix, product] of parent.cytosol.entries()){
            for (let i = 0; i < product; i ++){
                if (this.C.random() < partition){
                    parent.cytosol[ix]--
                    this.cytosol[ix]++
                }
            }
		}  
		
		this._fission_rate = parent._fission_rate
		this._fusion_rate = parent._fusion_rate
		this._rep = parent._rep
		this._rep2 = parent._rep2
		if (this.C.random() < this.conf["MUT_FISFUS"]){
			this._fission_rate += this.conf["SIGMA_FIS"] * this.rand_normal()
		}
		if (this.C.random() < this.conf["MUT_FISFUS"]){
			this._fusion_rate += this.conf["SIGMA_FUS"] * this.rand_normal()
		}
		if (this.C.random() < this.conf["MUT_REP"]){
			this._rep += this.conf["SIGMA_REP"] * this.rand_normal()
		}
		if (this.C.random() < this.conf["MUT_REP2"]){
			this._rep2 += this.conf["SIGMA_REP2"] * this.rand_normal()
		}
		this.writeState("divisions.txt")
		parent.writeState("divisions.txt", {"daughter":this.stateDct(), "parent":parent.stateDct()})
	}

	update(){
		
		if (this.nSubcells === 0 ){
			// console.log(this.V, this.vol)
			if (this.canShrink()){
				this.V -= this.conf["EMPTY_HOST_SHRINK"]
			}
			return
		}
		this.total_oxphos = 0

		let cells = []
		for (let mito of this.subcells()){
			cells.push(mito) //need to link id in a structured format to pick from volcumsum
			mito.update()
			this.total_oxphos += mito.oxphos
		}
		
		
		let new_products = (this.total_oxphos*this.rep) - (this.total_oxphos*this.total_oxphos*this.rep2)
		for (let i = 0; i < new_products; i++){
			let ix = this.DNA.trues[Math.floor(this.C.random() * this.DNA.trues.length)]
			if (this.tryIncrement()){
				this.cytosol[ix]++
			}
		}
		let volcumsum = []
		let mito_vol = 0
		for (let mito of cells){
			mito_vol += mito.vol
			volcumsum.push(mito_vol)
		}
		volcumsum = volcumsum.map(function(item) {return item/ mito_vol})
		for (const [ix, product] of this.cytosol.entries()){
			for (let i = 0 ; i < product;i++){
				let which = volcumsum.findIndex(element => this.C.random()  < element )
				cells[which].importbuffer.push({"which":ix})
				this.cytosol[ix]--
			}
		}


		let dV = 0
		dV += this.total_oxphos *this.conf["HOST_V_PER_OXPHOS"]
		dV -= this.conf["HOST_SHRINK"]
		dV = Math.min(this.conf["HOST_GROWTH_MAX"], dV)
		// if (dV > 0 && this.canGrow() && mito_vol/(this.vol + mito_vol) > this.conf["PREF_FRACTION_MITO_PER_HOST"] ){
		if (dV > 0 && this.canGrow() ){
            this.V += dV
        }
        if (dV < 0 && this.canShrink()){
            this.V += dV
		}
		
		for (let mito of this.subcells()){
			mito.importAndProduce()
		}
		for (const [ix, product] of this.cytosol.entries()){
			for (let i = 0 ; i < product;i++){
				if( this.C.random() < this.conf["HOST_DEPRECATION"]){
					this.cytosol[ix]--
				}
			}
		}
	}

	canGrow(){
        return this.V-this.vol < this.conf["VOLCHANGE_THRESHOLD"]
    }
    canShrink(){
        return this.vol-this.V < this.conf["VOLCHANGE_THRESHOLD"]
    }
	
	tryIncrement(){
        // console.log(this.sum, this.vol, this.vol/this.sum)
        return (this.C.random() < (this.vol/this.sum))
	}
	
	get sum(){
		return this.cytosol.reduce((t, e) => t + e)
	}

	get total_vol(){
		let vol = this.vol
		for (let subcell of this.subcells()){
			vol += subcell.vol
		}
		return vol
	}

	//TODO: refactor all evolvables to indexable object!!
	get fission_rate(){
		return Math.max(0, this._fission_rate)
	}

	get fusion_rate(){
		return Math.max(0, this._fusion_rate)
	}

	get rep(){
		return Math.max(0, this._rep)
	}

	get rep2(){
		return Math.max(0, this._rep2)
	}

	death(){
		/* eslint-disable */
		super.death()
		for (let mito of this.subcells()){
			mito.V = -50
		}
		this.writeState("./deaths.txt", this.stateDct()) //HARDCODED
	}

	shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(this.C.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
	}
	
	// Standard Normal variate using Box-Muller transform.
	rand_normal() {
		let u = 0, v = 0;
		while(u === 0) u = this.C.random(); //Converting [0,1) to (0,1)
		while(v === 0) v = this.C.random();
		return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
	}

	stateDct() {
		let dct = {}
		dct["time"] = this.C.time
		dct["id"] = this.id
        dct["V"] = this.V
		dct["vol"] = this.vol
		dct['total_vol'] = this.total_vol
		dct["type"] = "host"
		dct["fission rate"] = this._fission_rate
		dct["fusion_rate"] = this._fusion_rate
		dct["fission events"] = this.fission_events
		dct["fusion events"] = this.fusion_events
		dct["rep"] = this._rep
		dct["rep2"] = this._rep2
		dct["time of birth"] = this.time_of_birth
		dct["n mito"] = this.nSubcells
		dct["total_oxphos"] = this.total_oxphos
		dct["cytosolsum"] = this.sum
		dct["parent"] = this.parentId
		dct["fission events"] = this.fission_events
		dct["fusion events"] = this.fusion_events
		return dct
	}

	writeState(logpath, dct){
        let objstring = JSON.stringify(dct) + '\n'
		if( typeof window !== "undefined" && typeof window.document !== "undefined" ){
        } else {
            if (!this.fs){
                this.fs = require('fs')
            }    
            this.fs.appendFileSync(logpath, objstring)
		}   
	}
}

export default HostCell