"use strict"

import SuperCell from "../SuperCell.js" 
import nDNA from "./nDNA.js"

/**
 * This encodes a Host cell in the mitochondrial model
 * It inherits from Supercell, to allow for easy handling
 * of its endosymbionts. 
 */
class HostCell extends SuperCell {

	/**
	 * -- standard CPM.Cell parameters:
     * @param {Object} conf - config of the model
     * @param {Number} kind - the CellKind of this
     * @param {Number} id - the CellId of this
     * @param {CPMEvol} C - the CPMEvol (or inherited) model where it is attached to
	 * 
	 * -- specific conf parameters necessary --
	 * @param {number} conf.INIT_HOST_V - initial target Volume at t=0
	 * 
	 * @param {number} conf.HOST_V_PER_OXPHOS - scalar value for the +∆V per total OXPHOS
	 * @param {number} conf.HOST_SHRINK - shrinkage per timestep (expects a positive value for effective shrinkage)
	 * @param {number} conf.HOST_GROWTH_MAX - maximum positive ∆V
	 * @param {number} conf.FACTOR_HOSTSHRINK_OVERFLOW - shrinkage amplification that 
	 * is transferred upon the subcells once the host can no longer safely shrink. 
	 * @param {number} conf.NDNA_MUT_LIFETIME - mutation rate per gene per MCS of the host, 
	 * this affects only nDNA, not parameters
	 * 
	 * @param {number} conf.rep - host translation per oxphos
	 * @param {number} conf.rep2 - host translation per quadratic oxphos
	 * 
	 * @param {Object} [conf.evolvables] - contains objects with keys of parameters that
	 * can evolve, needs to contain conf.evolvables.NAME.sigma - the standard deviation
	 * of the evolving step. Can contain (conf.evolvables.NAME.-) upper_bound and lower_bound
	 * which are hard limits to evolutions. Initial value of the evolvable is taken as the conf.NAME
	 * parameter
	 */
	constructor (conf, kind, id, C) {
		super(conf, kind, id, C)
		
		this.V = conf["INIT_HOST_V"]

		/**
		 * sets evolvable parameters as cell-specific, so they
		 * can accurately be adjusted later
		 */
		for (let evolvable in conf["evolvables"]){
			this[evolvable] = conf[evolvable]
		}
		
		/** initialize total oxphos */
		this.total_oxphos = 0

		/** initialize DNA */
		this.DNA = new nDNA(conf, C, String(this.id)) 
	}

	/**
	 * Call on the new cell after a division, alters both itself and the 
	 * parent to divide products and accomplish successful division.
	 * 
	 * @param {CPM.HostCell} parent - the other daughter/parent cell
	 * @param {number} partition - the fraction of the cell this daughter got:
	 * the number of pixels this cell got/total pixels both daughters
	 */
	birth(parent, partition){
		/** record lineage and handle subcells in superclasses */
		super.birth(parent, partition)

		/** divide target V and total oxphos on partition */ 
		this.V = parent.V * partition
		parent.V *= (1-partition)
		this.total_oxphos = parent.total_oxphos * partition
		parent.total_oxphos *= (1-partition)

		/** Make new DNA for daughter */
		this.DNA = new nDNA(this.conf, this.C,String(this.id), parent.DNA)
		
		/** Do mutation steps on evolvables */
		for (const evolvable in this.conf["evolvables"]){
			this[evolvable] = parent.cellParameter(evolvable)
			this[evolvable] += this.conf["evolvables"][evolvable]["sigma"] * this.rand_normal()
			if (this.conf["evolvables"][evolvable]["lower_bound"] !== undefined){
				this[evolvable] = Math.max(this[evolvable], this.conf["evolvables"][evolvable]["lower_bound"])
			}
			if (this.conf["evolvables"][evolvable]["upper_bound"] !== undefined){
				this[evolvable] = Math.min(this[evolvable], this.conf["evolvables"][evolvable]["upper_bound"])
			}
		}
	}

	/**
	 * Update post-MCS - essentially main loop of model 
	 * Does not interact with the grid.
	 * Calls update on all mitochondria.
	 */
	update(){
		this.total_oxphos = 0
		let cells = [], volcumsum = []
		let mito_vol = 0

		/** Update all mitochondria, records total oxphos and does preparotory work for weighted draw */
		for (let mito of this.subcells()){
			cells.push(mito) //need to link id in a structured format to pick from volcumsum
			mito_vol += mito.vol
			volcumsum.push(mito_vol)
			mito.update()
			this.total_oxphos += mito.oxphos
		}
		this.total_vol = this.vol + mito_vol

		/** Makes new replication products, and distributes based on volume-weighted draw */
		let new_products = (this.total_oxphos*this.cellParameter("rep")) - (this.total_oxphos*this.total_oxphos*this.cellParameter("rep2"))
		volcumsum = volcumsum.map(function(item) {return item/ mito_vol}) // is an array form 0 - 1 with mito.vol/total_mito_vol 
		for (let i = 0; i < new_products; i++){
			// pick random existing DNA index
			let ix = this.DNA.trues[Math.floor(this.C.random() * this.DNA.trues.length)]
			// pick weighted random mitochondrion 
			let which = volcumsum.findIndex(element => this.C.random()  < element )
			// add protein to proteinbuffer of mitochondrion
			cells[which].proteinbuffer.push({"which":ix, "good" : this.DNA.quality[ix]})
		}

		/** Calculates and adds ∆V, if it can no longer shrink, distributes shrinkage among subcells */
		let dV = 0
		dV += this.total_oxphos *this.cellParameter("HOST_V_PER_OXPHOS")
		dV -= this.cellParameter("HOST_SHRINK")
		dV = Math.min(this.cellParameter("HOST_GROWTH_MAX"), dV)
		if (this.closeToV() ){
			this.V += dV
		} else if (dV < 0){
			for (let mito of this.subcells()){
				mito.V += (mito.vol/mito_vol) * dV *this.conf["FACTOR_HOSTSHRINK_OVERFLOW"]
			}
		}

		/** calls mitochondria to update protein pool */
		for (let mito of this.subcells()){
			mito.importAndProduce()
		}

		/** do lifetime mutation nDNA */
		this.DNA.mutate(this.cellParameter("NDNA_MUT_LIFETIME"))
	}

	/** death listener - calls write to file in deaths.txt */
	death(){
		super.death()
		for (let mito of this.subcells()){
			this.write("debug.log", {"message": "Host died with extant subcells, please mind the balance in your model", "cell" : this.stateDct()})
			mito.V = -50 // if this is necessary coul
		}
		this.write("./deaths.txt", this.stateDct()) 
	}
	
	/** Get standard Normal variate from univariate using Box-Muller transform.
	 *  Code edited from https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve
	 */ 
	rand_normal() {
		let u = 0, v = 0
		while(u === 0) u = this.C.random() //Converting [0,1) to (0,1)
		while(v === 0) v = this.C.random()
		return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v )
	}

	/** Returns a state object, with getter calls and model-wide things
	 * Is easier to edit and reuse than a modifier for this.()
	 * but takes more space you do need to remmember to edit this when
	 * adding new followables
	 * 
	 * @returns dct - an object containing detailed state of this cell
	 */
	stateDct() {
		let dct = {}
		dct["time"] = this.C.time
		dct["id"] = this.id
		dct["V"] = this.V
		dct["vol"] = this.vol
		dct["parent"] = this.parentId
		dct["time of birth"] = this.time_of_birth
		dct["good"] = this.dna_good
		dct["bads"] = this.DNA.bads
		dct["dna"] = this.DNA.quality
		dct["type"] = "host"
		dct["n mito"] = this.nSubcells
		dct["total_oxphos"] = this.total_oxphos
		dct["total_vol"] = this.total_vol
		dct["fission events"] = this.fission_events
		dct["fusion events"] = this.fusion_events
		dct["evolvables"] = {}
		for (const evolvable in this.conf.evolvables){
			dct["evolvables"][evolvable] = this[evolvable]
		}
		return dct
	}

	/** dumb check for whether the host dna is mutated
	 * Could probably be communicated more elegantly as it is now newly initializes a
	 * nDNA and sums all genes of both, but this seems very robust.
	 */
	get dna_good(){
		return this.DNA.sumQuality() == new nDNA(this.conf, this.C).sumQuality()
	}

	/**
	 * Writer for host cell - could maybe be moved to CPM.Cell?
	 * takes anobject and appends it to an output file as JSON dictionary/object 
	 * @param {String} logpath - output path
	 * @param {Object} dct - output object
	 */
	write(logpath, dct){
		let objstring = JSON.stringify(dct) + "\n"
		if(!( typeof window !== "undefined" && typeof window.document !== "undefined" )){
			if (!this.fs){
				this.fs = require("fs")
			}    
			this.fs.appendFileSync(logpath, objstring)
		}   
	}
}

export default HostCell