
class Cell {
	
	/** The constructor of class Cell.
	 * @param {object} conf - configuration settings of the simulation, containing the
	 * relevant parameters. Note: this should include all constraint parameters.
	 * @param {CellKind} kind - the cellkind of this cell, the parameters of kind are used 
	 * when parameters are not explicitly overwritten
	 * @param {CPMEvol} C - the CPM - used among others to draw random numbers
	 * @param {CellId} id - the CellId of this cell (its key in the CPM.cells), unique identifier
	 * */
	constructor (conf, kind, id, C){
		this.conf = conf
		this.kind = kind
		this.C = C
		this.id = id
		

		/** The id of the parent cell, all seeded cells have parent -1, to overwrite this
		 * this.birth(parent) needs to be called 
		@type{number}*/
		this.parentId = -1
	}

	/** Adds parentId number, and can be overwritten to execute functionality on 
	 * birth events. 
	 @param {Cell} parent - the parent Cell object
	 */
	birth (parent){
		this.parentId = parent.id 
		this.time_of_birth = this.C.time
	}

	/**
	 * redefine this in subclasses. This is called upon death events. 
	 */
	death () {
	}

	get vol(){
		return this.C.getVolume(this.id)
	}

	/**
	 * variable setting for evolvable parameters within cell class 
	 * Note that this is the same implementation as done in Constraint;
	 * because of data sharing within these two places it is reimplemented
	 *
	 * @param {String} param - the name of the parameter to search 
	 * @returns {Any} - the requested parameter, from this object if evolvable, from conf if not 
	 */
	cellParameter(param){
		if (this[param] !== undefined){
			return this[param]
		}
		return this.conf[param]
	}

	closeToV(){
		return Math.abs(this.V-this.vol) < this.conf["VOLCHANGE_THRESHOLD"]
	}

}

export default Cell







