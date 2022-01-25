let CPM = require("../../build/artistoo-cjs.js")
let ColorMap = require("./colormap-cjs.js")

let config = {

	// Grid settings
	ndim : 2,
	field_size : [150,150],
	
	// CPM parameters and configuration
	conf : {
		// Basic CPM parameters
		torus : [true,true],				// Should the grid have linked borders?
		seed : 5,							// Seed for random number generation.
		T : 20,								// CPM temperature
		
		//This declaration of CELLS instantiates the CPMEvol model instead of the CPM model
		CELLS : ["empty", CPM.Divider, CPM.Divider], //The cell internal classes
        
        // used internally by StochasticCorrector subclass
		INIT_PRODUCTS : [ [40,40],
										   [40,40] ],
		INIT_V : [250, 125],
		NOISE : [0,0],

		// used in postMCSListener.
        division_volume : [0, 500, 250],
		growth_rate : [0, 20, 5],
		death_rate : [0, 0.001, 0.001],

        // Adhesion parameters:
         J: [ [15,15,15], 
			[15,15,15], 
			[15,15,15] ],
		
		// VolumeConstraint parameters
		LAMBDA_V : [0, 1, 1],				// VolumeConstraint importance per cellkind
		V : [0, 200, 100]					// Unused - are backup.
		
	},
	
	// Simulation setup and configuration: this controls stuff like grid initialization,
	// runtime, and what the output should look like.
	simsettings : { 
	
		// Cells on the grid
		NRCELLS : [10, 10],						// Number of cells to seed for all
		// non-background cellkinds. 
		// Runtime etc
		BURNIN : 100,
		RUNTIME : 100,
		RUNTIME_BROWSER : "Inf",
		
		// Visualization
		CANVASCOLOR : "EEEEEE",
		CELLCOLOR : ["AA111A","FFA110"],
		SHOWBORDERS : [true, true],				// Should cellborders be displayed?
		BORDERCOL : ["666666", "666666"],				// color of the cell borders
		zoom : 3,							// zoom in on canvas with this factor.
		
		// Output images
		SAVEIMG : true,						// Should a png image of the grid be saved
		// during the simulation?
		IMGFRAMERATE : 1,					// If so, do this every <IMGFRAMERATE> MCS.
		SAVEPATH : "output/img/StochasticCorrection",	// ... And save the image in this folder.
		EXPNAME : "StochasticCorrection",					// Used for the filename of output images.
		
		// Output stats etc
		STATSOUT : { browser: true, node: true }, // Should stats be computed?
		LOGRATE : 10							// Output stats every <LOGRATE> MCS.

	}
}
/*	---------------------------------- */
let sim, showYcolors

let custommethods = {
	postMCSListener : postMCSListener,
	initializeGrid : initializeGrid,
	drawCanvas : drawCanvas
	}
sim = new CPM.Simulation( config, custommethods )

showYcolors = false

/* The following custom methods will be added to the simulation object*/
function postMCSListener(){
	
	// add the initializer if not already there
	if( !this.helpClasses["gm"] ){ this.addGridManipulator() }
	
	for( let i of this.C.cellIDs() ){
		updateCell(this.C, this.C.cells[i])
		if( this.C.getVolume(i) > this.C.conf.division_volume[this.C.cellKind(i)] ){
			this.gm.divideCell(i)
		}
	}
}

// Models internal concentrations of RNA replicators, with a master sequence  (X) creating mutants (Y) with lower growth rate,
//  Y population is necessary for vesicle to survive.
function updateCell(C, cell){
	let vol = C.getVolume(cell.id)
    let V = cell.V

	if ((cell.V - vol) < 10)
	{
		V += C.conf.growth_rate[cell.kind]
	}
	// else
	// {
	// 	// V -= C.conf.growth_rate[cell.kind] - 0.001* vol * C.conf.growth_rate[cell.kind]
	// 	// V -= C.conf.shrink_rate[cell.kind]
	// 	V -= C.conf.growth_rate[cell.kind]
	// }

	let grid_vol = C.grid.extents[0] * C.grid.extents[1]

	// if (Math.random() < 0.1* vol/grid_vol)
	// {
	// 	V = -500
	// }

	if (Math.random() < C.conf.death_rate[cell.kind])// * 100 * vol/grid_vol)
	{
		V = -500
	}

	// else if (cell.V > vol+3)
	// {
	// 	V -= C.conf.growth_rate[cell.kind]
	// }

    // if ((cell.V - vol) < 10){
	// 	V += C.conf.growth_rate[cell.kind]
	// 	// if (Math.random() < 0.95)
	// 	// {
	// 	// 	V += C.conf.growth_rate[cell.kind]
	// 	// }
	// 	// else
	// 	// {
	// 	// 	// V -= C.conf.growth_rate[cell.kind]
	// 	// 	V = 0.9*cell.V
	// 	// }
	// }
	// else if ((cell.V - vol))
	// V -= 10

	// if (Math.random() < 0.1)
	// {
	// 	V -= 100
	// }
    cell.V = V
}

function initializeGrid(){
	
	// add the initializer if not already there
	if( !this.helpClasses["gm"] ){ this.addGridManipulator() }
    
	let nrcells = this.conf["NRCELLS"], cellkind, i
		
	// Seed the right number of cells for each cellkind 
	for( cellkind = 0; cellkind < nrcells.length; cellkind ++ ){
		
		for( i = 0; i < nrcells[cellkind]; i++ ){
			// first cell always at the midpoint. Any other cells
			// randomly.				
			if( i == 0 ){
                this.gm.seedCellAt( cellkind+1, [this.C.midpoint[0]/2, this.C.midpoint[1] ] )
			} else {
				this.gm.seedCell( cellkind+1 )
			}
		}
	}
}


// Custom drawing function to draw the preferred directions.
function drawCanvas(){
	// Add the canvas if required
	if( !this.helpClasses["canvas"] ){ this.addCanvas() }

	// Clear canvas
	this.Cim.clear( this.conf["CANVASCOLOR"] || "FFFFFF" )
	let nrcells=this.conf["NRCELLS"], cellkind, cellborders = this.conf["SHOWBORDERS"]
	
	let colfun = getColor.bind(this)
	for( cellkind = 0; cellkind < nrcells.length; cellkind ++ ){
		this.Cim.drawCells( cellkind+1, colfun)
		// Draw borders if required
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
	if (!showYcolors){
		return this.conf["CELLCOLOR"][this.C.cellKind(cid)-1]
	}
	let cell = this.C.cells[cid]
	let c = (35 * 3)
	if (c >= cmap.length){
		c = cmap.length - 1
	} else if (c < 0){
		c = 0
	}
	return cmap[c].substring(1)
}

sim.run()