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
		
		        
        J_INT:  [ 
			[15,15], 
            [15,30] ],

        J_EXT:  [ [15,50,1500], 
			[50,750,1500], 
            [1500, 1500,15000] ],

			        
        // J_INT:  [ 
		// 	[15,15], 
        //     [15,2000] ],

        // J_EXT:  [ [150,15,15000], 
		// 	[10,150,1500], 
        //     [1500, 1500,15000] ],


        
        // J_INT:  [ 
		// 	[15,15], 
        //     [15,150] ],

        // J_EXT:  [ [15,15,1500], 
		// 	[10,750,1500], 
        //     [1500, 15000,15000] ],


        // LAMBDA_SUB: [0, 0, 500] ,
	
        // NOISE : 5,
        N_OXPHOS : 5, 
        N_TRANSLATE : 10,
        N_REPLICATE : 70,
        INIT_MITO_V : 300,
        N_INIT_DNA : 3,
		MTDNA_MUT_RATE : 0.2,
		INIT_HOST_V : 500,
		INIT_OXPHOS : 80,
		INIT_TRANSLATE : 40,
		INIT_REPLICATE : 1,
		HOST_DEPRECATION: 0.005,


		// Constraint parameters. 
		// Mostly these have the format of an array in which each element specifies the
		// parameter value for one of the cellkinds on the grid.
        // First value is always cellkind 0 (the background) and is often not used.
        
		// division_volume : [0, 200],
		// minimal_division_volume : 150,
		REPLICATE_TIME: 100,
		fission_rate : 0.00003,
		fusion_rate : 0.005,
		deprecation_rate : 0.05,
		dna_deprecation_rate :0.00001,
		// replication_rate : 1,
		// translation_rate: 1, 
		host_selfishness : 0.2, 
		MITO_SHRINK : 0,
		MITOPHAGY_THRESHOLD: 5,
		MITOPHAGY_SHRINK : 6,
		HOST_SHRINK : 3,
		EMPTY_HOST_SHRINK: 10,
		MITO_GROWTH_MAX : 5,
		HOST_GROWTH_MAX : 5,
		MITO_V_PER_OXPHOS : 1.2,
		HOST_V_PER_OXPHOS : 1,
	
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

function logStats(){
    return
}

function seedSubCells(){
    let nrcells = sim.conf["NRCELLS"][1], i
    // Only seed Supercells in initialize
    // let cellkind = 0
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
	
	// let all_sub = {} //sorted by host
	// let all_super = {} //cells by host
	// for (let cid of this.C.cellIDs()){
	// 	let cell = this.C.cells[cid]
	// 	if (cell instanceof CPM.SubCell){
	// 		if (!all_sub.hasOwnProperty(cell.host)){
	// 			all_sub[cell.host] = []
	// 		}
	// 		all_sub[cell.host].push(cell) 
	// 	} else if (cell instanceof CPM.SuperCell){
	// 		all_super[cid] = cell
	// 	}
	// }
	
	for (let cid of this.C.cellIDs()){
		if (this.C.cells[cid] instanceof CPM.HostCell){
			this.C.cells[cid].update()
		}
	}

	for( let cid of this.C.cellIDs() ){
		if (this.C.cells[cid] instanceof CPM.SubCell){
			// if (this.C.random() < 0.002){ 
				// let cell = this.C.cells[cid]
				// console.log("n DNA: ", cell.DNA.length, "oxphos: ", cell.oxphos, "translate: ", cell.translate, "replicate: ", cell.replicate, "replisomes: ", cell.n_replisomes ,"heteroplasmy: ", cell.heteroplasmy(), "V:", cell.V , "vol:", cell.vol, "DNA:" ,cell.DNA, cell.products)
			// }
			// if (isBorder(this.C, cid, neighs) && this.C.cells[cid].closeToV()){
			// 	this.C.cells[cid].V -= this.C.conf["BORDER_SHRINK"] * isBorder(this.C, cid, neighs)
			// }
			// console.log((neighs[cid].length > 1 ))
			
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
			// if (this.C.random() < 0.01){ 
			// 	let cell = this.C.cells[cid]
			// 	// console.log("n mito: ", cell.subcells.length, "V:", cell.V , "vol:", cell.vol, "total oxphos", cell.total_oxphos,  "cytosol total: ", cell.sum, cell.cytosol)
			// }
			if (this.C.getVolume(cid) > this.C.conf.division_volume[this.C.cellKind(cid)]){
				// console.log("dividing host")
				let nid = this.gm.divideCell(cid)
				transferSubCells(cid, nid) 
			}
		}
	}
}

// function isBorder(C, cid, neighs){
// 	let sum = 0
// 	if (Object.keys(neighs[cid]).length > 1 ){
// 		for (let neigh in neighs[cid]){
// 			// console.log(neigh,  (C.cells[neigh] || {}).host,  C.cells[neigh].host)
// 			if (neigh == 0 || (C.cells[neigh] || {}).host != C.cells[cid].host){
// 				sum += neighs[cid][neigh]
// 				// for (let neigh2 in neighs[cid]){
// 				// 	console.log(neigh2, C.cells[neigh2].host, C.cells[cid].host)
// 				// }
// 				// console.log('broken on ', neigh, neighs[cid][neigh])
// 				// if (neighs[cid][neigh] > 3){
					
// 				// }
// 			}
// 		}
// 	}
// 	return sum
// }

function initializeGrid(){
	
	// add the initializer if not already there
	if( !this.helpClasses["gm"] ){ this.addGridManipulator() }

    let nrcells = this.conf["NRCELLS"][0], i
    // Only seed Supercells in initialize
    // let cellkind = 0
    for( i = 0; i < nrcells; i++ ){			
        if( i == 0 ){
            this.gm.seedCellAt( 1, [this.C.midpoint[0]/2, this.C.midpoint[1] ] )
        } else {
            this.gm.seedCell(1)
        }
    }
}

function euclidean(x0, y0, x1, y1){
	return Math.sqrt(Math.pow(x0-x1, 2)+Math.pow(y0-y1,2))
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
			// console.log(childlength, parentlength, neighborlst[mitoid],child, parent, "new host")
			sim.C.cells[mitoid].host = child
		} 
		// 	console.log(childlength, parentlength, neighborlst[mitoid],child, parent, "no new host")
		// }
		if (childlength == parentlength){
			// console.log(parentlength, childlength)
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