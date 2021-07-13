"use strict"

import SuperCell from "../SuperCell.js" 
import nDNA from "./nDNA.js"

class HostCell extends SuperCell {

	/* eslint-disable */ 
	constructor (conf, kind, id, C) {
		super(conf, kind, id, C)
		this.V = conf["INIT_HOST_V"]
		this.fission_rate = conf["fission_rate"]
		this.fusion_rate = conf["fusion_rate"]
		this.rep = conf["REP_MACHINE_PER_OXPHOS"]
		this.total_oxphos = 0
		this.DNA = new nDNA(conf, C) 
		this.cytosol = new Array(this.conf["N_OXPHOS"]+this.conf["N_TRANSLATE"]+this.conf["N_REPLICATE"]).fill(0)
	}

	birth(parent){
		super.birth(parent)
		this.V = parent.V/2
		parent.V /= 2
		this.DNA = new nDNA(this.conf, this.C, parent.DNA)
		this.fission_rate = parent.fission_rate
		this.fusion_rate = parent.fusion_rate
		this.rep = parent.rep
		if (this.C.random() < this.conf["MUT_FISFUS"]){
			this.fission_rate *= 1 + this.conf["MUT_SIGMA"] * this.rand_normal()
		}
		if (this.C.random() < this.conf["MUT_FISFUS"]){
			this.fusion_rate *= 1 + this.conf["MUT_SIGMA"] * this.rand_normal()
		}
		if (this.C.random() < this.conf["MUT_REP_PRESSURE"]){
			this.rep *= 1 + this.conf["MUT_SIGMA"] * this.rand_normal()
		}
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

		// let total_mito_vol = 0
		let cells = []
		// console.log(this.subcellsObj)
		for (let mito of this.subcells()){
			cells.push(mito) // subcells may need to be an array again
			// volcumsum.push(mito.vol + volcumsum[volcumsum.length-1])
			mito.update()
			//this.total_oxphos += Math.max(mito.oxphos, C.getVolume(mito.id))
			this.total_oxphos += mito.oxphos
		}
		
		// let trues = 
		for (let i = 0; i < this.total_oxphos*this.rep; i++){
			let ix = this.DNA.trues[Math.floor(this.C.random() * this.DNA.trues.length)]
			if (this.tryIncrement() && this.total_oxphos < this.conf["THRESHOLD_REPLICATION_STOP"]){
				// optional make this canGrow dependent
				this.cytosol[ix]++
			}
		}
		let volcumsum = []
		let mito_vol = 0
		this.shuffle(cells) // need te erase all structure: should maybe refactor subcells back to array?
		for (let mito of cells){
			mito_vol += mito.vol
			volcumsum.push(mito_vol)
		}
		volcumsum = volcumsum.map(function(item) {return item/ mito_vol})
		for (const [ix, product] of this.cytosol.entries()){
			for (let i = 0 ; i < product;i++){
				let ran = this.C.random() 
				let which = volcumsum.findIndex(element => ran < element )
				cells[which].importbuffer.push({"which":ix})
				this.cytosol[ix]--
			}
		}


		let dV = 0

		dV += this.total_oxphos *this.conf["HOST_V_PER_OXPHOS"]
		dV -= this.conf["HOST_SHRINK"]
		dV = Math.min(this.conf["HOST_GROWTH_MAX"], dV)
		if (dV > 0 && this.canGrow() && mito_vol/(this.vol + mito_vol) > this.conf["PREF_FRACTION_MITO_PER_HOST"] ){
            this.V += dV
        }
        if (dV < 0 && this.canShrink() && mito_vol/(this.vol + mito_vol) < this.conf["PREF_FRACTION_MITO_PER_HOST"] ){
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
	
	// should be refactored away
	get sum(){
		return this.cytosol.reduce((t, e) => t + e)
	}

	death(){
		/* eslint-disable */
		super.death()
		for (let mito of this.subcells()){
			mito.V = -50
		}
		let logpath = "./celldeaths.txt" //HARDCODED
        let cell = {}
        cell["time"] = this.C.time
        cell["V"] = this.V
        cell["vol"] = this.vol
        
        let objstring = JSON.stringify(cell) + '\n'
		if( typeof window !== "undefined" && typeof window.document !== "undefined" ){
            // console.log("detected browser")
            // this.fs.appendFileSync(logpath, objstring)
        } else {
            // console.log("logged to  " + logpath + "\n\n" + objstring)
            if (!this.fs){
                this.fs = require('fs')
            }    
            this.fs.appendFileSync(logpath, objstring)
        }
        
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
		while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
		while(v === 0) v = Math.random();
		return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
	}
}

export default HostCell