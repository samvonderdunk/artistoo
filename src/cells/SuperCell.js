
import Cell from "./Cell.js" 
import PixelsByCell from "../stats/PixelsByCell.js"

class SuperCell extends Cell {

	constructor (conf, kind, id, C) {
		super(conf, kind, id, C)
		this.host = this.id
		this.subcells = []
	}

	addSubCell(cell){
		if (!this.subcells.includes(cell)){
			this.subcells.push(cell)
		} else {
			throw("Tried to add subcell when already in subcells", this, cell)
		}
	}

	removeSubCell(cell){
		let ix =  this.subcells.indexOf(cell)
		if (ix !==-1){
			this.subcells.splice(ix, 1)
		}
	}


	computeHostCentroid(pixels){
		// copied Torus corrected centroid, but now you can hand all pixels of host+subcells
		let halfsize = new Array( this.C.ndim).fill(0)
		for( let i = 0 ; i < this.C.ndim ; i ++ ){
			halfsize[i] = this.C.extents[i]/2
		}
		let cvec = new Array(this.C.ndim).fill(0)
		for( let dim = 0 ; dim <this.C.ndim ; dim ++ ){
			let mi = 0.
			const hsi = halfsize[dim], si = this.C.extents[dim]
			for( let j = 0 ; j < pixels.length ; j ++ ){
				let dx = pixels[j][dim] - mi
				if( this.C.grid.torus[dim] && j > 0 ){
					if( dx > hsi ){
						dx -= si
					} else if( dx < -hsi ){
						dx += si
					}
				}
				mi += dx/(j+1)
			}
			if( mi < 0 ){
				mi += si
			} else if( mi > si ){
				mi -= si
			}
			cvec[dim] = mi
		}
		return cvec
	}

	/* eslint-disable */
	divideHostCell( ){
		let C = this.C
		if( C.ndim != 2 ){
			throw("The divideCell method is only implemented for 2D lattices yet!")
		}
		let pix = C.getStat( PixelsByCell )
		let ids = [this.id], cp = pix[this.id]
		for (let subcell of this.subcells){
			if (!this.C.cells.hasOwnProperty(subcell.id)){
				continue
				// sometimes deathlistening registers later and removeFromHost is not fully called before , it seems.
			}
			ids = [...ids, subcell.id]
			cp = [...cp, ...pix[subcell.id]]
		}
		let com = this.computeHostCentroid(cp)
		let bxx = 0, bxy = 0, byy=0, cx, cy, x2, y2, side, T, D, x0, y0, x1, y1, L2

		// Loop over the pixels belonging to this cell
		let si = this.C.extents, pixdist = {}, c = new Array(2)
		for (let id of ids){
			pixdist[id] = {}
			for( let j = 0 ; j < pix[id].length ; j ++ ){
				for ( let dim = 0 ; dim < 2 ; dim ++ ){
					c[dim] = pix[id][j][dim] - com[dim]
					if( C.conf.torus[dim] && j > 0 ){
						// If distance is greater than half the grid size, correct the
						// coordinate.
						if( c[dim] > si[dim]/2 ){
							c[dim] -= si[dim]
						} else if( c[dim] < -si[dim]/2 ){
							c[dim] += si[dim]
						}
					}
				}
				pixdist[id][j] = [...c]
				bxx += c[0]*c[0]
				bxy += c[0]*c[1]
				byy += c[1]*c[1]
			}
		}
		

		// This code computes a "dividing line", which is perpendicular to the longest
		// axis of the cell.
		if( bxy == 0 ){
			x0 = 0
			y0 = 0
			x1 = 1
			y1 = 0
		} else {
			T = bxx + byy
			D = bxx*byy - bxy*bxy
			//L1 = T/2 + Math.sqrt(T*T/4 - D)
			L2 = T/2 - Math.sqrt(T*T/4 - D)
			x0 = 0
			y0 = 0
			x1 = L2 - byy
			y1 = bxy
		}
		let newhost =  C.makeNewCellID( C.cellKind( this.id ) )
		for (let j = 0; j < pix[this.id].length; j++){
			if( x1*pixdist[this.id][j][1]-pixdist[this.id][j][0]*y1 > 0 ){
				C.setpix( pix[this.id][j], newhost) 
			}
		}
		C.birth(newhost, this.id)
		
		for (let id of ids){
			if (id === this.id ){
				continue
			}
			let newpix = []
			for (let j = 0; j < pix[id].length; j++){
				if( x1*pixdist[id][j][1]-pixdist[id][j][0]*y1 > 0 ){
					newpix = [...newpix, pix[id][j]]
				}
			}
			if (newpix.length == pix[id].length){
				C.cells[id].host = newhost
			} else if (newpix.length > 0){
				let nid = C.makeNewCellID( C.cellKind( id ) )
				for (let pix of newpix){
					C.setpix(pix, nid)
				}
				C.birth(nid, id, newpix.length/pix[id].length)
				C.cells[nid].host = newhost
			}
		}
		
		C.stat_values = {} // remove cached stats or this will crash!!!
		return newhost
	}

}

export default SuperCell