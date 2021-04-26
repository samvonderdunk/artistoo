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
		/* eslint-disable */
		let checker = new ParameterChecker( this.conf, this.C )
		
		// console.log("HEY", this.conf)
		// checker.confCheckParameter( "LAMBDA_SUB", "KindArray", "NonNegative" )
		// console.log("HEY")
	}

	/**  Returns the Hamiltonian around a pixel i with cellid tp by checking all its
	neighbors that belong to a different cellid.
	@param {IndexCoordinate} i - coordinate of the pixel to evaluate hamiltonian at.
	@param {CellId} tp - cellid of this pixel.
	@return {number} sum over all neighbors of adhesion energies (only non-zero for 
	neighbors belonging to a different cellid).	
	@private
	 */
	H( i, tp ){
		let r = 0, tn
		/* eslint-disable */
		const N = this.C.grid.neighi( i )
		for( let j = 0 ; j < N.length ; j ++ ){
			tn = this.C.pixti( N[j] )
			if( tn != tp ){ 
				if (tn == 0 || tp == 0 || this.cellParameter("host", tn) != this.cellParameter("host", tp)){
					r += this.conf["J_EXT"][this.C.cellKind(tn)][this.C.cellKind(tp)]
				} else {
					// r -= this.conf["J"][this.C.cellKind(tn)][this.C.cellKind(tp)]
					r += this.conf["J_INT"][this.C.cellKind(tn)-1][this.C.cellKind(tp)-1]
				}
			}
		}
		return r
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
		return this.H( tgt_i, src_type ) - this.H( src_i, tgt_type )
	}
}

export default SubCellConstraint
