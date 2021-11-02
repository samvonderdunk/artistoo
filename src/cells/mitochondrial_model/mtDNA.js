import DNA from "./DNA.js" 

/**
 * Class mtDNA overwrites initialization of DNA (inherits from DNA)
 * for mitochondrial DNA instances
 */
class mtDNA extends DNA {

	/**
     * see @constructor @Object {DNA} for other parameters
     * @param conf.MTDNA_MUT_REP mutation rate at replication - only daughter gets this
     * this overwrites DNA initialization to set OXPHOS and TRANSLATE genes to existing and good.
     */
	constructor (conf, C, idstr, parent) {
		super(conf,C, idstr, parent)
		if (parent instanceof mtDNA){
			this.mutate(this.conf["MTDNA_MUT_REP"])
		} else {
			for (let i = 0 ; i < this.quality.length; i++){
				if (i < this.conf["N_OXPHOS"]  + this.conf["N_TRANSLATE"]){
					this.quality[i] = 1
					this.exists[i] = 1
				}
			}
		}
	}

}

export default mtDNA