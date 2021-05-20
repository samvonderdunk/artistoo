let CPM = require("../../build/artistoo-cjs.js")
let ColorMap = require("./colormap-cjs.js")

"use strict"

let config = {

	// Grid settings
	ndim : 2,
	field_size : [150,150],
	
	// CPM parameters and configuration
	conf : {
		// Basic CPM parameters
		torus : [true,true],				// Should the grid have linked borders?
		seed : 3,							// Seed for random number generation.
		T : 2,								// CPM temperature
        
    
		CELLS : ["empty", CPM.HostCell, CPM.Mitochondrion], 
		
		        
        J_INT:  [ [15,15], 
            			[15,30] ],

        J_EXT:  [ [15,50,1500], 
						[50,750,1500], 
           				[1500, 1500,15000] ],

			    
        N_OXPHOS : 5, 
        N_TRANSLATE : 10,
        N_REPLICATE : 50,
        INIT_MITO_V : 300,
        N_INIT_DNA : 4,
        MTDNA_MUT_REP :0.0001,
        MTDNA_MUT_LIFETIME : 0.00001,
		INIT_HOST_V : 500,
		INIT_OXPHOS : 10,
		INIT_TRANSLATE : 10,
		INIT_REPLICATE : 1,
		HOST_DEPRECATION: 0.005,


	
		REPLICATE_TIME: 50,
		fission_rate : 0.00005,
		fusion_rate : 0.0008,
		deprecation_rate : 0.08,
		// dna_deprecation_rate :0.001,
		// replication_rate : 1,
		// translation_rate: 1, 
		host_selfishness : 0.1, 
		mut_selfishness: 0.0,
		MITO_SHRINK : 0,
		MITOPHAGY_THRESHOLD: 1,
		MITOPHAGY_SHRINK : 6,
		HOST_SHRINK : 3,
		EMPTY_HOST_SHRINK: 10,
		MITO_GROWTH_MAX : 5,
		HOST_GROWTH_MAX : 5,
		MITO_V_PER_OXPHOS : 1,
		HOST_V_PER_OXPHOS : 4,
	
		VOLCHANGE_THRESHOLD : 10,

		// BORDER_SHRINK: 0.0,

		MITO_PARTITION : 0.5,


		// VolumeConstraint parameters
		LAMBDA_V : [0, 1, 1],				// VolumeConstraint importance per cellkind
		V : [0,502, 200],					
		division_volume: [100, 800, 100]
	},
	
	// Simulation setup and configuration: this controls stuff like grid initialization,
	// runtime, and what the output should look like.
	simsettings : { 
	
		// Cells on the grid
		NRCELLS : [5, 5],						// Number of cells to seed for all
		// non-background cellkinds. 
		// Runtime etc
		BURNIN : 0,
		RUNTIME : 100000,
		RUNTIME_BROWSER : "Inf",
		
		// Visualization
		CANVASCOLOR : "EEEEEE",
		CELLCOLOR : ["9E60BE", "FFAAEA"],
		SHOWBORDERS : [true, true],				// Should cellborders be displayed?
		BORDERCOL : ["666666", "666666"],				// color of the cell borders
		zoom : 3,							// zoom in on canvas with this factor.
		
		// Output images
		SAVEIMG : true,						// Should a png image of the grid be saved
		// during the simulation?
		IMGFRAMERATE : 1,					// If so, do this every <IMGFRAMERATE> MCS.
		SAVEPATH : "output/img/Mitochondria",	// ... And save the image in this folder.
		EXPNAME : "Mitochondria",					// Used for the filename of output images.
		
		// Output stats etc
		STATSOUT : { browser: false, node: true }, // Should stats be computed?
		LOGRATE : 10							// Output stats every <LOGRATE> MCS.

	}
}
/*	---------------------------------- */
let sim, colorby


let custommethods = {
    postMCSListener : postMCSListener,
    initializeGrid : initializeGrid,
    drawCanvas : drawCanvas,
    logStats : logStats
    }
sim = new CPM.Simulation( config, custommethods )

sim.C.add( new CPM.SubCellConstraint( config["conf"] ) )

colorby = "heteroplasmy"
// changeColorBy()
const util = require('util')
function logStats(){
	console.log(  "%------------------------------ " ,this.time, " ------------------------------")
	jsonobj = {}
    for( let cell of this.C.cells ){
		if (cell instanceof CPM.HostCell){
			jsonobj[cell.id] = {}
			let host = jsonobj[cell.id]
			host["n mito"] = cell.subcells.length
			host["selfishness"] = cell.selfishness
			host["V"] = cell.V
			host["vol"] = cell.vol
			host["total_oxphos"] = cell.total_oxphos
			host["cytosol"] = cell.cytosol
			host["parent"] = cell.parentId
			host["subcells"] = {}
			for (let subcell of cell.subcells){
				host["subcells"][subcell.id] = {}
				let mito = host["subcells"][subcell.id]
				mito["V"] = subcell.V
				mito["vol"] = subcell.vol
				// // could be post computed!
				mito["n DNA"] = subcell.DNA.length
				mito["oxphos"] = subcell.oxphos
				mito["translate"] = subcell.translate
				mito["replicate"] = subcell.replicate
				mito["replisomes"] = subcell.n_replisomes
				mito["heteroplasmy"] = subcell.heteroplasmy()
				mito["translatable heteroplasmy"] = subcell.heteroplasmy("translatable")
				mito["replicating heteroplasmy"] = subcell.heteroplasmy("replicating")
				// from this
				mito["products"] = subcell.products
				mito["DNA"] = {}
				for (let [ix, dnaobj] of subcell.DNA.entries()){
					mito["DNA"][ix] = {}
					let dna = mito["DNA"][ix]
					dna["quality"] = dnaobj.quality
					dna["replicating"] = dnaobj.replicating
				}
			}
		}
	}
	// this.fs.write()
	// console.log(util.inspect(jsonobj, {showHidden: false, depth: null}))
	console.log(JSON.stringify(jsonobj))
}

function seedSubCells(){
    if (!sim.gm){
        sim.addGridManipulator()
    } 
    let cellpixelsbyid = sim.C.getStat(CPM.PixelsByCell)
    for (let cid of Object.keys(cellpixelsbyid)) {
        if (sim.C.cellKind(cid) == 1){
            for (let i =0; i < sim.conf["NRCELLS"][1]; i++){
                let coord = cellpixelsbyid[cid][Math.floor(sim.C.mt.random()*cellpixelsbyid[cid].length)]
                let nid = sim.gm.seedCellAt( 2, coord )
				sim.C.cells[nid].host = cid
            }
        }
    }
}

/* The following custom methods will be added to the simulation object*/
function postMCSListener(){
    if (sim.time == 100){
        seedSubCells()
    }
	if (sim.time < 200){
		return
	}
	if( !this.helpClasses["gm"] ){ this.addGridManipulator() }

	let neighs = sim.C.getStat( CPM.CellNeighborList )
	
	for (let cid of this.C.cellIDs()){
		if (this.C.cells[cid] instanceof CPM.HostCell){
			this.C.cells[cid].update()
		}
	}

	for( let cid of this.C.cellIDs() ){
		if (this.C.cells[cid] instanceof CPM.SubCell){
			if (this.C.random() < this.C.conf['fission_rate'] * this.C.getVolume(cid)  && this.C.getVolume(cid) > this.C.conf["division_volume"][2]){
				let nid = this.gm.divideCell(cid, this.C.conf['MITO_PARTITION'])
			} else {
				// console.log(neighs, cid)
				for (let neigh of Object.keys(neighs[cid])){
					// console.log(neigh)
					if (this.C.cells[neigh] instanceof CPM.Mitochondrion && this.C.random() < this.C.conf['fusion_rate'] && this.C.cells[neigh].host == this.C.cells[cid].host){
						this.gm.fuseCells(cid, neigh)
					}
				}
			}
		}
		if (this.C.cells[cid] instanceof CPM.SuperCell){
			if (this.C.getVolume(cid) > this.C.conf.division_volume[this.C.cellKind(cid)]){
				let nid = this.gm.divideCell(cid)
				transferSubCells(cid, nid) 
			}
		}
	}
}


function initializeGrid(){

	// add the initializer if not already there
	if( !this.helpClasses["gm"] ){ this.addGridManipulator() }

    let nrcells = this.conf["NRCELLS"][0], i
    
    for( i = 0; i < nrcells; i++ ){			// Only seed Supercells in initialize
        if( i == 0 ){
            this.gm.seedCellAt( 1, [this.C.midpoint[0]/2, this.C.midpoint[1] ] )
        } else {
            this.gm.seedCell(1)
        }
    }
}

function transferSubCells (parent, child){
	let neighborlst = sim.C.getStat(CPM.CellNeighborList)
	let subcellids = []
	for (let mito of sim.C.cells[parent].subcells){
		subcellids.push(mito.id)
	}
	for (let mitoid of subcellids){
	
		let parentlength = (neighborlst[mitoid][parent] || 0)
		let childlength = (neighborlst[mitoid][child] || 0)
		if (childlength > parentlength){
			sim.C.cells[mitoid].host = child
		} 
		if (childlength == parentlength){
			if (sim.C.random() < 0.5){
				sim.C.cells[mitoid].host = child
			}
		}
	}
}

// Custom drawing function to draw the preferred directions.
function drawCanvas(){
	if( !this.helpClasses["canvas"] ){ this.addCanvas() }
	this.Cim.clear( this.conf["CANVASCOLOR"] || "FFFFFF" )
	let nrcells=this.conf["NRCELLS"], cellkind, cellborders = this.conf["SHOWBORDERS"]

	let colfun = getColor.bind(this)
	for( cellkind = 0; cellkind < nrcells.length; cellkind ++ ){
		this.Cim.drawCells( cellkind+1, colfun)
		if(  cellborders[ cellkind  ]  ){
			this.Cim.drawCellBorders( cellkind+1, "000000" )
		}
	}
}

const cmap = new ColorMap({
		colormap: 'viridis',
		nshades: 100,
		format: 'hex', 
		alpha: 1
})

function getColor (cid) {
	let cell = this.C.cells[cid]
	if (cell.id < 0){
		return
	}
	let c = 0
	let no_cmap = false
	if (cell instanceof CPM.SuperCell){
		switch (colorby){
			case "host":
				c = Math.floor(cell.host/10)
				break
			default:
				no_cmap= true
				c = String(this.conf["CELLCOLOR"][cell.kind-1])
		}
	} else {
		switch (colorby){
			case "host":
				if (this.C.cells[cell.host].subcells.includes(cell)){
					c = Math.floor(cell.host/10)
				} else {
					c = NaN
				}
				break
			case 'n_DNA':
				c = Math.floor(cell.DNA.length) 
				break
			case 'heteroplasmy':
				c = Math.floor(cell.heteroplasmy() *100)
				break
			case 'translate':
				c = Math.floor(cell.translate)*5
				break
			case 'oxphos':
				c = Math.floor(cell.oxphos)
				break
			case 'replicate':
				c = Math.floor(cell.replicate)*10
				break
			case 'replisomes':
				c = Math.floor(cell.n_replisomes)*5
				let check = 0
				for (let dna of cell.DNA){
					if (dna.replicating > 0){
						check++
					}
				}
				if (check !== cell.n_replisomes){
					c = NaN
					if(this.C.random() < 0.1){
						console.log("cell n replisomes: ", cell.n_replisomes, "counted: ", check)
					}
				}
				break
			// case 'host':
			// 	c = Math.floor(cell.host/100)
			// 	break
			case 'kill':
				exit()
			default:
				no_cmap= true
				c = String(this.conf["CELLCOLOR"][cell.kind-1]) //very ugly!
		}
	}
	// console.log(c)
	
	if (!no_cmap){ 
		if (Number.isNaN(c)){
		return "A9A9A9"
		}
		c = Math.min(cmap.length-1, c)
		c = Math.max(1, c)
		
		c = cmap[c].substring(1)
	}

	return c
}

sim.run()