let CPM = require("../../build/artistoo-cjs.js")
let ColorMap = require("./colormap-cjs.js")

"use strict"

let config = {

	// Grid settings
	ndim : 2,
	field_size : [250,250],
	
	// CPM parameters and configuration
	conf : {
		// Basic CPM parameters
		torus : [true,true],				// Should the grid have linked borders?
		seed : 3,							// Seed for random number generation.
		T : 2,								// CPM temperature
        
    
		CELLS : ["empty", CPM.HostCell, CPM.Mitochondrion], 
		  
        J_INT:  [ [15,15], 
        				 [15,15] ],

        J_EXT:  [ [15,50,1500], 
						[50,750,1500], 
            			[1500, 1500,15000] ],

		
        // NOISE : 5,
        N_OXPHOS : 5, 
        N_TRANSLATE : 5,
        N_REPLICATE : 100,
        INIT_MITO_V : 500,
        N_INIT_DNA : 5,
		MTDNA_MUT_REP : 0.0003,
        MTDNA_MUT_LIFETIME : 0.02, //deadly!!!!!! TODO REPLACE!!!!!
		INIT_HOST_V : 700,
		INIT_OXPHOS : 10,
		INIT_TRANSLATE : 10,
		INIT_REPLICATE : 2,
		HOST_DEPRECATION: 0.00,


		// Constraint parameters. 
		// Mostly these have the format of an array in which each element specifies the
		// parameter value for one of the cellkinds on the grid.
        // First value is always cellkind 0 (the background) and is often not used.
        
		// division_volume : [0, 200],
		// minimal_division_volume : 150,
		REPLICATE_TIME: 2,
		// fission_rate : 0.000003,
		// fusion_rate : 0.003,
		fission_rate : 0.00004,
		fusion_rate : 0.02,
		deprecation_rate : 0.5,
		dna_deprecation_rate :0.00,
		// replication_rate : 1,
		// translation_rate: 1, 
		host_selfishness : 0.5, 
		mut_selfishness: 0.0,
		MITO_SHRINK : 0,
		MITOPHAGY_THRESHOLD: 1,
		MITOPHAGY_SHRINK : 2,
		HOST_SHRINK : 2,
		EMPTY_HOST_SHRINK: 10,
		MITO_GROWTH_MAX : 9,
		HOST_GROWTH_MAX : 9,
		MITO_V_PER_OXPHOS : 1,
		HOST_V_PER_OXPHOS : 1,
		REP_MACHINE_PER_OXPHOS: 10,
		PREF_FRACTION_MITO_PER_HOST : 0.7,
	
		VOLCHANGE_THRESHOLD : 10,
		// SELECTIVE_FUSION: false,
		SELECTIVE_FUSION: true,

		// BORDER_SHRINK: 0.0,

		MITO_PARTITION : 0.5,


		// VolumeConstraint parameters
		LAMBDA_V : [0, 1, 1],				// VolumeConstraint importance per cellkind
		V : [0,502, 200],					
		division_volume: [100, 1200, 400]
		// division_volume: [100, 600, 200]
	},
	
	// Simulation setup and configuration: this controls stuff like grid initialization,
	// runtime, and what the output should look like.
	simsettings : { 
	
		// Cells on the grid
		NRCELLS : [8, 5],						// Number of cells to seed for all
		// non-background cellkinds. 
		// Runtime etc
		BURNIN : 0,
		RUNTIME : 1000,
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
		LOGPATH: "output/logs/Mitochondria",
		EXPNAME : "Mitochondria",					// Used for the filename of output images.
		
		// Output stats etc
		STATSOUT : { browser: false, node: true }, // Should stats be computed?
		LOGRATE : 10,							// Output stats every <LOGRATE> MCS.
		FLUSHRATE : 10

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

const {
	performance
  } = require('perf_hooks');
let starttime = performance.now()

// let stream = fs.createWriteStream("./"+config['simsettings']["LOGPATH"]+'/'+config['simsettings']["EXPNAME"]+".txt", {flags:'w+'});
// stream.cork()
sim.C.add( new CPM.SubCellConstraint( config["conf"] ) )

colorby = "fraction unmutated"

let logpath = "./"+config['simsettings']["LOGPATH"]+'/'+config['simsettings']["EXPNAME"]+".txt"
const fs = require('fs')
if (fs.existsSync(logpath)){
	fs.unlinkSync(logpath)
}
let stringbuffer = ""
function logStats(){
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
					mito["DNA"][dnaobj.id] = {}
					let dna = mito["DNA"][dnaobj.id]
					dna["quality"] = dnaobj.quality
					dna["replicating"] = dnaobj.replicating
				}
			}
		}
	}
	let timestr = String(  "\n%------------------------------ " + this.time + " ------------------------------\n")
	let objstr = JSON.stringify(jsonobj)
	stringbuffer += timestr+objstr
	if ((this.time / config['simsettings']['LOGRATE'] ) % config['simsettings']["FLUSHRATE"] == 0 || this.time >=  config['simsettings']["RUNTIME"]- config['simsettings']["LOGRATE"] ){
		fs.appendFileSync(logpath, stringbuffer)
		stringbuffer = ""
		console.log(this.time, Object.keys(this.C.cells).length)
	}
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
		let cell = this.C.cells[cid]
		if (cell instanceof CPM.SubCell){
			if (this.C.random() < this.C.conf['fission_rate'] * cell.vol && cell.vol > this.C.conf["division_volume"][2]){
				this.gm.divideCell(cid, this.C.conf['MITO_PARTITION'])
			} else {
				for (let neigh of Object.keys(neighs[cid])){
					fusable = this.C.cells[neigh]
					if (fusable instanceof CPM.Mitochondrion && cell.host == fusable.host){
						if (this.C.random() < this.C.conf['fusion_rate'] ){
							if (!(this.C.conf["SELECTIVE_FUSION"]) || (cell.oxphos >= this.C.conf["MITOPHAGY_THRESHOLD"] && fusable.oxphos >= this.C.conf["MITOPHAGY_THRESHOLD"])){
								this.gm.fuseCells(cid, neigh)
							}
						}
					}
				}
			}
		}
		if (this.C.cells[cid] instanceof CPM.SuperCell){
			if (this.C.getVolume(cid) > this.C.conf.division_volume[this.C.cellKind(cid)]){
				this.C.cells[cid].divideHostCell(cid)
			}
		}
	}
	if(sim.time > 600){
		console.log(Object.keys(this.C.cells).length <= 1,Object.keys(this.C.cells).length)
	}
	if (Object.keys(this.C.cells).length <= 1){
		let endtime = performance.now()
		stringbuffer += "\n##broken; time taken: "  + String((endtime-starttime)/(1000*60)) + " minutes\n"
		fs.appendFileSync(logpath, stringbuffer)
		
		// console.log("\n##broken; time taken: "  + String((endtime-starttime)/(1000*60)) + " minutes\n")
		process.exit(0)
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
			case 'fraction unmutated':
				c = Math.floor(cell.unmutated/cell.DNA.length *100)
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


let endtime = performance.now()
stringbuffer += "\n##broken; time taken: "  + String((endtime-starttime)/(1000*60)) + " minutes\n"
fs.appendFileSync(logpath, stringbuffer)
		
// console.log("time taken: "  + String((endtime-starttime)/(1000*60)) + " minutes")