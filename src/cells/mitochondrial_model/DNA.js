/**
 * Class DNA codes for mainly for all the DNA in the model,
 * the DNA contains two main arrays: binary data confirming existence of this index on this dna
 * and binary information on the quality of this index on this dna.
 * Arrays are ordered in OXPHOS-TRANSLATE-REPLICATE and indexed to access
 * 
 * The DNA class initializes mtDNA, initialization of nDNA is overwritten in separate class
 * TODO: move mtDNA init to separate class as well, to make this more logical
 */
class DNA {

	/**
     * Constructor for DNA class - initialization needs to be overwritten in subclasses. 
     * @param {Object} conf - config object of simulation
     * @param {CPMEvol} C - the model (may be able to use with CPM or other subclasses, but explicitly written for CPMEvol)
     * @param {String} idstr - unique identifier string (for postprocessing)
     * @param {DNA} parent - parent DNA copy
     * 
     * @param {Number} conf.N_OXPHOS - number of oxphos genes
     * @param {Number} conf.N_TRANSLATE - number of translate genes
     * @param {Number} conf.N_REPLICATE - number of replicate genes
     */
	constructor (conf, C , idstr, parent) {
		this.C = C
		this.conf = conf
		this.id = idstr //unique string
		this.replicating = 0

		if (parent instanceof DNA){
			this.quality = [...parent.quality]
			this.exists = [...parent.exists]
		} else {
			this.quality = new Array(this.conf["N_OXPHOS"]+this.conf["N_TRANSLATE"]+this.conf["N_REPLICATE"]).fill(0)
			this.exists = new Array(this.conf["N_OXPHOS"]+this.conf["N_TRANSLATE"]+this.conf["N_REPLICATE"]).fill(0)
		}
	}

	/**
     * Stochastically sets genes to bad quality with given rate
     * @param {Number} rate - rate of mutation per gene 
     */
	mutate(rate){ 
		for (let ix of this.trues){
			if (this.C.random() < rate){
				this.quality[ix] = 0
			}
		}
	}
    
	/**
     * Get the number of 'good' genes
     * @returns sum of quality array
     */
	sumQuality(){
		return  this.quality.reduce((t, e) => t + e)
	}

	/**
     * get indices of all existing genes on this DNA
     * This assumes that this does not change during run
     * @returns {[Number]} - list of index numbers of true value in this.exists
     */
	get trues(){
		if (this.fixedtrues === undefined){
			this.fixedtrues = this.exists.reduce(
				(out, bool, index) => bool ? out.concat(index) : out, 
				[]
			)
		}
		return this.fixedtrues
	}

	/**
     * Give indices of all mutated genes
     * @returns {[Number]} - the indices of all false values in this.quality
     */
	get bads(){
		return this.quality.reduce(
			(out, bool, index) => bool ? out : out.concat(index), 
			[]
		)
	}

	/**
     * get shallow copy of only oxphos genes
     */
	get oxphos_quality() {
		return this.quality.slice(0, this.conf["N_OXPHOS"])
	}
	/**
     * Get shallow copy of only translate genes
     */
	get translate_quality() {
		return this.quality.slice(this.conf["N_OXPHOS"], this.conf["N_OXPHOS"] + this.conf["N_TRANSLATE"])
	}
	/**
     * Get shallow copy of only replicate genes
     */
	get replicate_quality() {
		return this.quality.slice(this.conf["N_OXPHOS"] + this.conf["N_TRANSLATE"] )
	}
}

export default DNA