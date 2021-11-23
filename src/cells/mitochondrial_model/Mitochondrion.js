"use strict"

import SubCell from "../SubCell.js" 
import mtDNA from "./mtDNA.js" 
import Products from "./Products.js" 

/**
 * Simulates mitochondria in combination with HostCell
 * This inherits from SubCell, which handles which host it
 * belongs to (note: setting the first host during seeding is still required)
 */
class Mitochondrion extends SubCell {

	/**
     * Constructor for Mitochondrion
     * -- standard CPM.Cell parameters:
     * @param {Object} conf - config of the model
     * @param {Number} kind - the CellKind of this
     * @param {Number} id - the CellId of this
     * @param {CPMEvol} C - the CPMEvol (or inherited) model where it is attached to
     * 
     * - specific conf parameters necessary --
     * - initialization -
     * @param {Number} conf.N_INIT_DNA - initial number of mtDNA copies
     * @param {Number} conf.INIT_MITO_V - initial target Volume at t=0
     * - growth -
     * @param {Number} conf.MITO_V_PER_OXPHOS - scalar value for amount of ∆V the mitochondrion gets per oxphos
     * @param {Number} conf.MITO_SHRINK - shrinkage in ∆V (expects positive value)
     * @param {Number} conf.MITO_GROWTH_MAX - max amount of ∆V per timestep
     * - mitophagy -
     * @param {Number} conf.MITOPHAGY_THRESHOLD - amount of oxphos under which conf.MITOPHAGY_SHRINK will be applied
     * @param {Number} conf.MITOPHAGY_SHRINK - shrinkage that is only applied with oxphos < conf.MITOPHAGY_THRESHOLD
     * - proteolysis -
     * @param {Number} conf.deprecation_rate - rate at which proteins are proteolysed/removed from the Mitochondrion (/MCS/gene product)
     * - mutation -
     * @param {Number} conf.MTDNA_MUT_INIT - initial mtDNA mutation /gene at t=0 
     * @param {Number} conf.MTDNA_MUT_REP - mtDNA mutation /gene/replication event, only new daughter is affected
     * @param {Number} conf.MTDNA_MUT_ROS - mtDNA mutation rate /gene/ROS 
     * -
     * @param {Number} conf.REPLICATE_TIME - the number of timesteps an mtDNA replication event takes.
     * 
     * Any parameters can also be controlled by the HostCell through 'evolvables' - but this still requires an 
     * initial value to be present in the conf object
     */
	constructor (conf, kind, id, C) {
		super(conf, kind, id, C)
        
		/** initialize DNA + mutate this initial pool */
		/** tracks how many new dna's have come from this mitochondrion (does not track well with fusion)
         * is meant to at least allow fully unique DNA id's
         * @type {Number} */
		this.last_dna_id = 0

		/** All mtDNA copies
         * @type {Array} containing @type {DNA} Objects
        */
		this.DNA = []
		for (let i= 0; i<this.conf["N_INIT_DNA"];i++){
			let dna = new mtDNA(this.conf, this.C, String(this.id) +"_"+ String(++this.last_dna_id))
			dna.mutate(this.conf["MTDNA_MUT_INIT"])
			this.DNA.push(dna) // new js object arrays need to be filled one-by-one to not add the same object multiple times
		}
        
		/** Target volume @type {Number}*/
		this.V = this.conf["INIT_MITO_V"]

		/** boolean to set whether this mitochondrion is currently fusing
         * this is used to not record fusion events as death events (as a mitochondrial id does disappear)
         * @type {boolean}
         */
		this.fusing = false

		/**
         * buffer for all imported and produced proteins per timestep
         * This is to ensure import and production have a similar priority for the carrying capacity
         * @type {Array}
         */
		this.proteinbuffer = []
		/** to get oxphos average readouts, record last 5 MCS oxphos in this @type {Array} */
		this.oxphos_q = new Array(5).fill(0)

		/** save time of birth @type {Number} */
		this.time_of_birth = this.C.time
        
		/**
         * Holder for all gene products from nonmutated genes 
         * @type {Products} - a wrapper for an array of integers
         */
		this.products = new Products(this.conf, this.C)
		/** set initial numbers at start of run 
         *  NOTE: this is called in  construction - so needs to be removed for any other birth event
         */
		this.products.init()
		/**
         * Holder for all gene products from mutated genes 
         * @type {Products}- a wrapper for an array of integers
         */
		this.bad_products = new Products(this.conf, this.C)
	}
	
	/**
     * Clear this cell from any initialization 
     * TODO: make it so init() is called on initialization, and this is default, seems less likely to cause problems
     * esp. because hosting is already a seeding-specific action
     */
	clear(){
		this.DNA = []
		this.products = new Products(this.conf, this.C)
		this.bad_products = new Products(this.conf, this.C)
	}

	/**
     * Birth call on new mitochondrion, handles stochastic division of products and 
     * mtDNA copies. 
     * @param {Mitochondrion} parent - the other daughter of division (not newly created)
     * @param {Number} partition - the fraction of the pixels this daughter received
     */
	birth(parent, partition){
		/** handle superclass things */
		super.birth(parent)
		/** clear unnecessary initialization */
		this.clear()

		/** stochastically divide products between daughters with rate partition */
		this.divideProducts(parent.products, this.products, partition)
		this.divideProducts(parent.bad_products, this.bad_products, partition)
        
		/** stochastically divide mtDNA copies between daughters with rate partition */
		let new_parent = []
		for (let dna of parent.DNA){
			if (this.C.random() < partition){
				this.DNA.push(dna)
			} else {
				new_parent.push(dna)
			}
		}
		parent.DNA = new_parent

		/** alter target volume */
		this.V = parent.V * partition
		parent.V *= (1-partition)
		//unused assemblies that cause less visualization errors:
		this.makeAssemblies()
	}

	/**
     * death listener for Mitochondrion -also catches fusion events
     * Writes state to file deaths.txt if actually death event
     */
	death(){
		super.death()
		if (this.fusing){
			return
		}

		this.write("./deaths.txt", this.stateDct())
	}

	/**
     * update loop of Mitochondrion
     * should be called by host for orderly working
     */
	update(){
		/** sets this timesteps oxphos, translate and replicate capability
         * which are drawn from the gene products pool
        */
		this.makeAssemblies()

		/**
         * do ∆V 
         */
		let dV = 0
		dV += this.oxphos * this.cellParameter("MITO_V_PER_OXPHOS")
		dV-= this.cellParameter("MITO_SHRINK")
		dV = Math.min(this.cellParameter("MITO_GROWTH_MAX"), dV)
		// optional mitophagy thresholding
		if (this.oxphos < this.cellParameter("MITOPHAGY_THRESHOLD")) {
			dV -= this.cellParameter("MITOPHAGY_SHRINK")
		}
		if (this.closeToV()){
			this.V += dV
		}

		/** replicate mtdna and translate mtdna into proteinbuffer */
		this.repAndTranslate()

		/** do proteolysis */
		this.deprecateProducts()

		/** add newly produced products only once all import also has been created */
		// importandcreate() - called by host, as this controls import!
		// these lines are only here to show program flow
	}

	/**
     * Divide products array stochastically based on the partition
     * of the two vesicles. 
     * @param {Products} parent_products - original Mitochondrion's products
     * @param {Products} child_products - new Mitochondrion's products
     * @param {Number} partition - new Mitochondrion's fraction of pixels after division (used as rate)
     */
	divideProducts(parent_products, child_products, partition){
		// loops over each object and adds it to new daughter with rate partition
		for (const [ix, product] of parent_products.arr.entries()){
			for (let i = 0; i < product; i ++){
				if (this.C.random() < partition){
					parent_products.arr[ix]--
					child_products.arr[ix]++
				}
			}
		}  
	}

	/**
     * Remove products with rate 'deprecation rate' 
     * Mutate DNA with ROS
     */
	deprecateProducts(){
		this.products.deprecate(this.cellParameter("deprecation_rate"))
		this.bad_products.deprecate(this.cellParameter("deprecation_rate"))
        
		for (let dna of this.DNA.values()){
			dna.mutate(this.cellParameter("MTDNA_MUT_ROS") * this.ros)
		}
	}

	/**
     * Do all internal processes of fusing:
     * combine Products 
     * combine target volume
     * combine mtDNA
     * @param {Mitochondrion} partner 
     */
	fuse(partner) {
		this.products.arr = this.sum_arr(this.products.arr, partner.products.arr)
		this.bad_products.arr = this.sum_arr(this.bad_products.arr, partner.bad_products.arr)

		this.DNA = [...this.DNA, ...partner.DNA]
		this.V += partner.V
		partner.fusing = true // partner will be deleted - but does not die - this flags this process
	}

	/**
     * Checks against carrying capacity (defined by volume) whether the current product can be added
     * @returns {Boolean} - whether the addition is successful
     */
	tryIncrement(){
		return this.C.random() < (this.vol /  this.sum_arr(this.products.arr, this.bad_products.arr).reduce((t, e) => t + e))
	}

	/**
     * Reimplements CPM.Cell implementation to ask Host cell
	 * all evolvables of Mitochondria are controlled by host
     * returns conf value if host not extant
     * TODO add all parameters at birth to mito so they stay with extant subcells after host death
	*/
	cellParameter(param){
		if (this.C.cells[this.host] !== undefined){
			return this.C.cells[this.host].cellParameter(param)
		}
		return this.conf[param]
	}

	/** gets number of replicating DNA copies
     */
	get n_replisomes(){ 
		return this.DNA.reduce((t,e) =>  e.replicating > 0 ? t+1 : t, 0)
	}

	/** gets number of unmutated DNA copies */
	get unmutated(){
		return this.DNA.reduce((t,e) =>  e.sumQuality() == new mtDNA(this.conf, this.C).sumQuality() ? t+1 : t, 0)
	}

	/**
     * Imports and Produces gene products from proteinbuffer in random order
     * Checks against carrying capacity.
     * 
     * Shuffles and then just works throught the proteinbuffer based on @function tryIncrement()
     * Rejected proteins are removed from the model
     */
	importAndProduce(){
		this.shuffle(this.proteinbuffer)
		while (this.proteinbuffer.length > 0){
			let p = this.proteinbuffer.pop()
			if (this.tryIncrement(p.which)){
				if (p.good){
					this.products.arr[p.which]++
				} else {
					this.bad_products.arr[p.which]++
				}
			} 
		}
	}

	/**
     * Replicate and translate mtDNA  
     * based on attempts gathered from @function makeAssemblies()
     */
	repAndTranslate() {
		if (this.DNA.length == 0 ){ return }
		let replicate_attempts = this.replicate, translate_attempts = this.translate // shallow copies
		// replication and translation machinery try to find DNA to execute on
		/** shuffle DNA in place to make sure that ordering does not affect translation */
		this.shuffle(this.DNA) 

		/** new dna is initizalized and not yet translatable @type {[DNA]} */
		let new_dna = []
		/** Finish up all replicating mtDNA before starting a new one */
		for (let dna of this.DNA){
			if (replicate_attempts <= 0){
				break
			}
			if (dna.replicating > 0){
				replicate_attempts--
				dna.replicating--
				if (dna.replicating == 0){
					new_dna.push(new mtDNA(this.conf, this.C, String(this.id) + "_" + String(++this.last_dna_id), dna)) 
				}
			}
		}
        
		/** Start new replication attempts and do translation events
         * NOTE: replication only blocks translation on the first step, which is 
		 * weird! 
         * 
         * NOTE2: it might be good to go back to mutex replication/translation 
         * anyway as this is more like the biological system (although it is
         * harder with the proteolysis and division of replisome machinery)
         */
		for (let dna of this.DNA){
			if (replicate_attempts + translate_attempts <= 0){
				break
			}
			/** draw from chance whether you do replication or translation */
			if (this.C.random() < replicate_attempts/(replicate_attempts + translate_attempts)){
				// start new replication event
				dna.replicating = this.cellParameter("REPLICATE_TIME")
				replicate_attempts--
			} else {
				// translate all proteins on this piece of DNA
				for (let ix = 0 ; ix < dna.quality.length; ix++){
					if (dna.exists[ix] !== 0){
						this.proteinbuffer.push({"which":ix,"good":dna.quality[ix]})
					}
				}
				translate_attempts-- 
			}
		}
		// Newly made DNA does not participate in replication/translation in t=birthtime
		this.DNA = [...this.DNA, ...new_dna]
	}

    
	/**
     * Draws from two arrays of protein numbers the number of productive assemblies
     * This takes a protein from every index - if all are good, the assembly is productive
     * NOTE: do not hand the actual Products.arr, but only shallow copies, as this does alter the values in place 
     * 
     * @param {[Integer]} arr - shallow copy of good products of single use type
     * @param {[Integer]} bad_arr - shallow copy of bad products of single use type
     * @returns the number of productive assemblies made in this timestep
     */
	assemble(arr, bad_arr){
		let assemblies = 0
		/* eslint-disable no-constant-condition */
		while (true) { 
			// equates to while (Math.min(sum_arr(arr, bad_arr)) > 1 ), which can be precomputed; i just think this is prettier
			let complete = 1
			for (let  j= 0; j<arr.length; j++){
				let all_j = arr[j] + bad_arr[j] 
				if (all_j == 0){
					return assemblies
				}
				if(this.C.random() < bad_arr[j]/all_j){
					bad_arr[j]--
					complete = 0
				} else {
					arr[j]--
				}
			}
			assemblies += complete
		}
	}
    
	/**
     * Makes assemblies with @function assemble for oxphos, translate and replicate, 
     * lso calculates ROS and logs oxphos for averaging
     * should only be called once per timestep, as this is not deterministic
     */
	makeAssemblies(){
		this.oxphos = this.assemble(this.products.oxphos, this.bad_products.oxphos)/ (this.vol / 100) * this.conf["OXPHOS_PER_100VOL"]
		this.translate = this.assemble(this.products.translate, this.bad_products.translate)
		this.replicate = this.assemble(this.products.replicate, this.bad_products.replicate)
		// Both good and bad assemblies make ros, so the total number of assemblies (minimum of summed arrays) is total ros
		this.ros = Math.min.apply(Math, this.sum_arr(this.products.oxphos,this.bad_products.oxphos)) / (this.vol / 100) * this.conf["OXPHOS_PER_100VOL"]
		// this is queues over 5 timesteps for the oxphos_avg visualization
		this.oxphos_q.push(this.oxphos)
		this.oxphos_q = this.oxphos_q.slice(-5)
	}

	/** take average of last 5 oxphos calculations */ 
	get oxphos_avg() {
		return this.oxphos_q.reduce((t, e) => t + e) / 5
	}

	/** shuffle array in place */
	shuffle(array) {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(this.C.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]]
		}
	}

	/** return the sum of two arrays at every index
     * rewritten to function because i don't like the js notation ;)
     */
	sum_arr(arr1, arr2){
		return arr1.map(function (num, idx) {
			return num + arr2[idx]
		})
	}

	/**
     * Output state of this object
     * @returns {Object} containing the state of this object at this moment for writing to file
     */
	stateDct(){
		let mito = {}
		mito["time"] = this.C.time
		mito["V"] = this.V
		mito["id"] = this.id
		mito["host"] = this.host
		mito["vol"] = this.vol
		mito["n DNA"] = this.DNA.length
		mito["oxphos"] = this.oxphos
		mito["ros"] = this.ros
		mito["oxphos_avg"] = this.oxphos_avg
		mito["translate"] = this.translate
		mito["replicate"] = this.replicate
		mito["replisomes"] = this.n_replisomes
		mito["type"] = "mito"
		mito["time of birth"] = this.C.time_of_birth
		mito["products"] = this.products.arr
		mito["bad products"] = this.bad_products.arr
		// mito['products at bad host DNA'] = this.debug_hostbad_printer()
		let sumdna = new Array(this.conf["N_OXPHOS"]+this.conf["N_TRANSLATE"]+this.conf["N_REPLICATE"]).fill(0)
		for (let dna of this.DNA){
			sumdna = this.sum_arr(sumdna, dna.quality)
		}
		mito["sum dna"] = sumdna.slice(0,10)
		mito["unmut"] = this.unmutated/this.DNA.length
		return mito
	}
    
	/**
	 * Writer for mitochondrion- could maybe be moved to CPM.Cell?
	 * takes anobject and appends it to an output file as JSON dictionary/object 
	 * @param {String} logpath - output path
	 * @param {Object} dct - output object
	 */
	write(logpath, dct){
		let objstring = JSON.stringify(dct) + "\n"
		if( !(typeof window !== "undefined" && typeof window.document !== "undefined") ){
			if (!this.fs){
				this.fs = require("fs")
			}    
			this.fs.appendFileSync(logpath, objstring)
		}   
	}
}

export default Mitochondrion