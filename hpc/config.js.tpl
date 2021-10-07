let CPM = require("../../../build/artistoo-cjs.js")
let ColorMap = require("../../../examples/node/colormap-cjs.js")
 
"use strict"

let config = {

	// Grid settings
	ndim : 2,
	field_size : [600,600],
	
	// CPM parameters and configuration
	conf : {
		// Basic CPM parameters
		torus : [true,true],				// Should the grid have linked borders?
		seed : <<random.randint(0,10000)>>,							// Seed for random number generation.
		T : 2,								// CPM temperature
        
    
		CELLS : ["empty", CPM.HostCell, CPM.Mitochondrion], 
		  
        J_INT:  [ [15,15], 
        		[  15,15] ],

        J_EXT:  [ 	[15,50,1500], 
					[50,750,1500], 
            		[1500, 1500,15000] ],

		
        N_OXPHOS : 5, 
        N_TRANSLATE : 5,
        N_REPLICATE : 50,
        INIT_MITO_V : 500,
        N_INIT_DNA : 5,
		MTDNA_MUT_REP : 0.0003,
		MTDNA_MUT_INIT: 0.002,
        MTDNA_MUT_ROS : 0.00005,
		NDNA_MUT_REP : 0,
        NDNA_MUT_LIFETIME : <<0.000001, 0.000005, 0.00001, 0.00005>>,
		INIT_HOST_V : 700,
		INIT_OXPHOS : 10,
		INIT_TRANSLATE : 10,
		INIT_REPLICATE : 2,
		FACTOR_HOSTSHRINK_OVERFLOW: 10,

		// Carrying capacity for pathways per 100 volume pixels 

		OXPHOS_PER_100VOL: 0.5,

		// Constraint parameters. 
		// Mostly these have the format of an array in which each element specifies the
		// parameter value for one of the cellkinds on the grid.
        // First value is always cellkind 0 (the background) and is often not used.

		REPLICATE_TIME: 30,
		//fission_rate : 0.0001,
		fission_rate : 0.000025,
		fusion_rate : 0.00025,
		rep: 19,
		rep2: 0,
		evolvables: {"fission_rate": {"sigma" : 0.00001}, 
							"fusion_rate":{"sigma" : 0.00003}, 
							"rep": {"sigma" : 0.5}, 
							"HOST_V_PER_OXPHOS":{"sigma" : 0.025}, 
							"host_division_volume":{"sigma" : 75, "lower_bound" : 2, "upper_bound":5000}
		 } ,
		
		deprecation_rate : 0.1,
		
		MITO_SHRINK : 1,
		MITOPHAGY_THRESHOLD: 0,
		MITOPHAGY_SHRINK : 0,
		HOST_SHRINK : 5,
		MITO_GROWTH_MAX : 9,
		HOST_GROWTH_MAX : 9,
		MITO_V_PER_OXPHOS : 2,
		HOST_V_PER_OXPHOS : 0.3,
	
		VOLCHANGE_THRESHOLD : 10,
		SELECTIVE_FUSION: false,

		MITO_PARTITION : 0.5,


		// VolumeConstraint parameters
		LAMBDA_V : [0, 1, 1],				// VolumeConstraint importance per cellkind
		V : [0,502, 200],					
		host_division_volume: 2000,
	},
	
	// Simulation setup and configuration: this controls stuff like grid initialization,
	// runtime, and what the output should look like.
	simsettings : { 
	
		// Cells on the grid
		NRCELLS : [20, 5],						// Number of cells to seed for all
		// non-background cellkinds. 
		// Runtime etc
		BURNIN : 0,
		RUNTIME : 600000,
		RUNTIME_BROWSER : "Inf",
		
		// Visualization
		CANVASCOLOR : "EEEEEE",
		CELLCOLOR : ["9E60BE", "FFAAEA"],
		SHOWBORDERS : [true, true],				// Should cellborders be displayed?
		BORDERCOL : ["666666", "666666"],				// color of the cell borders
		zoom : 1,							// zoom in on canvas with this factor.
		
		// Output images
		SAVEIMG : true,						// Should a png image of the grid be saved
		// during the simulation?
		IMGFRAMERATE : 10,					// If so, do this every <IMGFRAMERATE> MCS.
		SAVEPATH : "./",	// ... And save the image in this folder.
		LOGPATH: "./",
		EXPNAME : "Mitochondria",					// Used for the filename of output images.
		
		// Output stats etc
		STATSOUT : { browser: false, node: true }, // Should stats be computed?
		LOGRATE : 10,							// Output stats every <LOGRATE> MCS.
		FLUSHRATE : 30

	}
}
/*	---------------------------------- */
let sim

var fs = require('fs');
var util = require('util');

let custommethods = {
    postMCSListener : postMCSListener,
    initializeGrid : initializeGrid,
    drawCanvas : drawCanvas,
	drawOnTop : drawOnTop,
	createOutputs : createOutputs,
    logStats : logStats
}
sim = new CPM.Simulation( config, custommethods )
const {
	performance
  } = require('perf_hooks');
let starttime = performance.now()


sim.C.add( new CPM.SubCellConstraint( config["conf"] ) )
var colorby = "fraction_unmutated"

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
    sim.C.stat_values = {} // remove cached stats or this will crash!!!
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
 	//sim.C.stat_values = {} // remove cached stats or this will crash!!!
	let neighs = sim.C.getStat( CPM.CellNeighborList )
	
	for (let cid of this.C.cellIDs()){
		if (this.C.cells[cid] instanceof CPM.HostCell){
			// this calls update on its subcells
			this.C.cells[cid].update()
		}
	}

	// fission, fusion, division
	for( let cid of this.C.cellIDs() ){
		let cell = this.C.cells[cid]
		if (cell instanceof CPM.SubCell){
			if (this.C.random() < (cell.cellParameter("fission_rate") * cell.vol) && cell.vol > 2){
				this.C.cells[cell.host].fission_events++
				this.gm.divideCell(cid, cell.cellParameter('MITO_PARTITION'))
			} 
			if (this.C.random() <cell.cellParameter("fusion_rate") ){
				let fuser = pickFuser(cell)
				if (fuser !== undefined){
					this.C.cells[cell.host].fusion_events++
					this.gm.fuseCells(cid, fuser)
				}
			}
		}
		if (cell instanceof CPM.SuperCell){
			if (cell.vol > cell.cellParameter('host_division_volume')){
				let nid = cell.divideHostCell(cid)
				cell.write("divisions.txt", {"daughter":this.C.cells[nid].stateDct(), "parent":cell.stateDct()})
			}
		}
	}
	if (Object.keys(this.C.cells).length <= 1){
		let endtime = performance.now()
		stringbuffer += "\n##all died; time taken: "  + String((endtime-starttime)/(1000*60)) + " minutes\n"
		fs.appendFileSync(logpath, stringbuffer)		
		process.exit(0)
	}
}

function pickFuser(cell){
	let fusables = [], bordercumsum = [], totalborder = 0
	let neighs = sim.C.getStat( CPM.CellNeighborList )[cell.id] //needs to be recomputed as neighbors change with fisfus :(
	for (let neigh of Object.keys(neighs)){
		fusable = sim.C.cells[neigh]
		if (fusable instanceof CPM.Mitochondrion && cell.host == fusable.host){
			if (!(sim.C.conf["SELECTIVE_FUSION"]) || (cell.oxphos >= cell.cellParameter('MITOPHAGY_THRESHOLD') && fusable.oxphos >= cell.cellParameter('MITOPHAGY_THRESHOLD'))){
				totalborder += sim.C.getStat( CPM.CellNeighborList )[cell.id][fusable.id]
				fusables.push(fusable.id)
				bordercumsum.push(totalborder)
			}
		}
	}
	bordercumsum = bordercumsum.map(function(item) {return item/ totalborder})
	if (fusables.length > 0){
		let which = bordercumsum.findIndex(element => sim.C.random() < element )
		return fusables[which]
	}
	return undefined
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

/** This automatically creates all outputs (images and logged stats) at the correct
rates. See the {@link constructor} documentation for options on how to control these
outputs. */
function createOutputs(){
	// Draw the canvas every IMGFRAMERATE steps
	if( this.imgrate > 0 && this.time % this.imgrate == 0 ){
		
		if( this.mode == "browser" ){
			this.drawCanvas()
		}
		
		// Save the image if required and if we're in node (not possible in browser)
		if( this.mode == "node" && this.saveimg ){
			settings =  ["fraction_unmutated", "n_DNA", "oxphos_avg"]
			for (let setting of settings){
				colorby = setting
				this.drawCanvas()
				let outpath = this.conf["SAVEPATH"], expname = this.conf["EXPNAME"] || "mysim"
				this.Cim.writePNG( outpath +"/" + expname + "-" + setting + "-t"+this.time+".png" )
			}
		}
	}
	
	// Log stats every LOGRATE steps
	if( this.logstats && this.time % this.lograte == 0 ){
		this.logStats()
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
	this.drawOnTop()
}

const viridis = new ColorMap({colormap: 'viridis',nshades: 100,format: 'hex', alpha: 1})
const magma = new ColorMap({colormap: 'magma',nshades: 100,format: 'hex', alpha: 1})
const density = new ColorMap({colormap: 'density',nshades: 100,format: 'hex', alpha: 1})

function getColor (cid) {
	let cell = this.C.cells[cid]
	if (cell.id < 0){
		return
	}
	let c = 0
	let no_cmap = false
	if (cell instanceof CPM.SuperCell){
		if (cell.dna_good){
			return String(this.conf["CELLCOLOR"][cell.kind-1])
		} else {
			return "FF0000"
		}
	} else {
		switch (colorby){
			case 'n_DNA':
				return map_color(density, cell.DNA.length * 5)
			case 'oxphos_avg':
				return map_color(magma, cell.oxphos_avg * 10)
			case 'replicate':
				return map_color(magma, cell.replicate * 10)
			case 'fraction_unmutated':
				return map_color(viridis, cell.unmutated/cell.DNA.length *100)
			default:
				return String(this.conf["CELLCOLOR"][cell.kind-1]) 
		}
	}
}

function map_color(cmap, c){
	c = Math.floor(c)
	if (Number.isNaN(c)){
		return "A9A9A9"
		}
	c = Math.min(cmap.length-1, c)
	c = Math.max(1, c)
	
	c = cmap[c].substring(1)
	return c
}

function drawOnTop(){
	this.Cim.ctx.font = "24pt Comic Sans MS";
	this.Cim.ctx.fillStyle = "#ffffff";
	this.Cim.ctx.lineWidth = 1
	let now = this.C.time - 1
    this.Cim.ctx.fillText(colorby + " " + now, 10, 35);
	this.Cim.ctx.strokeText(colorby + " " + now, 10, 35);
}

let logpath = "./"+config['simsettings']["LOGPATH"]+'/'+config['simsettings']["EXPNAME"]+"log.txt"

if (fs.existsSync(logpath)){
	fs.unlinkSync(logpath)
}
if (fs.existsSync('./deaths.txt')){
	fs.unlinkSync('./deaths.txt')
}
if (fs.existsSync('./divisions.txt')){
	fs.unlinkSync('./divisions.txt')
}
let stringbuffer = ""
let prevdna = {}
function logStats(){
	if (this.C.time <=200){
		return
	}
	jsonobj = {}
	let curdna = {}
    for( let cell of this.C.cells ){
		if (cell instanceof CPM.HostCell){
			jsonobj[cell.id] = cell.stateDct()
			let host = jsonobj[cell.id]
			host["subcells"] = {}
			for (let subcell of cell.subcells()){
				host["subcells"][subcell.id] = subcell.stateDct()
				let mito = host["subcells"][subcell.id]
				mito["new DNA ids"] = 0
				for (let [ix, dnaobj] of subcell.DNA.entries()){
					curdna[dnaobj.id] = true
					if (!prevdna.hasOwnProperty(dnaobj.id) ){
						mito["new DNA ids"]++
					}
				}
			}
		}
	}
	prevdna = curdna
	let timestr = String(  "\n%------------------------------ " + this.time + " ------------------------------\n")
	let objstr = JSON.stringify(jsonobj)
	stringbuffer += timestr+objstr
	if ((this.time / config['simsettings']['LOGRATE'] ) % config['simsettings']["FLUSHRATE"] == 0 ){
		fs.appendFileSync(logpath, stringbuffer)
		stringbuffer = ""
	}
}



try {
	sim.run()

} catch (error) {
	var fs = require("fs")
	let stringbuffer = ""
	
	stringbuffer += " broke during run \n\n"
	stringbuffer += error.stack
	fs.appendFileSync("./debug.log", stringbuffer)
	console.log(stringbuffer)
  //console.error(error);
  // expected output: ReferenceError: nonExistentFunction is not defined
  // Note - error messages will vary depending on browser
}



let endtime = performance.now()
stringbuffer += "\n##ended; time taken: "  + String((endtime-starttime)/(1000*60)) + " minutes\n"
fs.appendFileSync(logpath, stringbuffer)
		
