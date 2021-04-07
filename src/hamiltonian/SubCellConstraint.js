import SoftConstraint from "./SoftConstraint.js"
import ParameterChecker from "./ParameterChecker.js"

/** 
	
	 * @example
	 
	*/
class SubCellConstraint extends SoftConstraint {

	
	/** The constructor of the SubCellConstraint requires a conf object with parameters.
	@param {object} conf - parameter object for this constraint
    @param {PerKindNonNegative} conf.LAMBDA_SUB - strength of the constraint per cellkind.
    @param {Cells} conf.CELLS - strength of the constraint per cellkind.
	*/
	constructor(conf){
		super(conf)
	}
	
	/** This method checks that all required parameters are present in the object supplied to
	the constructor, and that they are of the right format. It throws an error when this
	is not the case.*/
	confChecker(){
		let checker = new ParameterChecker( this.conf, this.C )
		/* eslint-disable */
		console.log("HEY", this.conf)
		checker.confCheckParameter( "LAMBDA_SUB", "KindArray", "NonNegative" )
		console.log("HEY")
	}
	
	/** Method to compute the Hamiltonian for this constraint. 
	 @param {IndexCoordinate} src_i - coordinate of the source pixel that tries to copy.
	 @param {IndexCoordinate} tgt_i - coordinate of the target pixel the source is trying
	 to copy into.
	 @param {CellId} src_type - cellid of the source pixel.
	 @param {CellId} tgt_type - cellid of the target pixel. This argument is not actually
	 used but is given for consistency with other soft constraints; the CPM always calls
	 this method with four arguments.
	 @return {number} the change in Hamiltonian for this copy attempt and this constraint.*/ 
	/* eslint-disable no-unused-vars*/
	deltaH( src_i, tgt_i, src_type, tgt_type ){
		let l = this.getParam("LAMBDA_SUB", src_type)
		if( !l || src_type == 0 || tgt_type == 0){
			return 0
		}
		if (this.getParam("host", src_type) != this.getParam("host", tgt_type)){
			return l
		} else {
			return 0
		}
	}
}

export default SubCellConstraint
