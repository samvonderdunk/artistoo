import SuperCell from "../SuperCell.js" 
import nDNA from "./nDNA.js"

class HostCell extends SuperCell {

		/* eslint-disable */ 
	constructor (conf, kind, id, mt) {
		super(conf, kind, id, mt)
        this.mitochondria = []
		this.selfishness = 0.5
		this.V = conf["INIT_HOST_V"]
		this.total_oxphos = 0
		this.DNA = new nDNA(conf, mt)
	}

	birth(parent){
		super.birth(parent)
		this.mutate_selfishness(parent)
		this.V = parent.V/2
		parent.V /= 2
		this.DNA = new nDNA(conf, mt, parent.DNA)
	}

	mutate_selfishness(parent){
		this.selfishness = parent.selfishness + (this.mt.random() - 0.5)*0.2
		this.selfishness = Math.min(1, this.selfishness)
		this.selfishness = Math.max(0, this.selfishness)
	}

	update(C){
		// update mitochondria
		this.total_oxphos = 0
		let volcumsum = []
		for (let mito of this.mitochondria){
			volcumsum.push(C.getVolume(mito.id))
			mito.update(C.getVolume(mito.id))
			this.total_oxphos += mito.oxphos
		}
		console.log(volcumsum)
		volcumsum = volcumsum.map(x => x/volcumsum[-1])
		console.log(volcumsum)

		let trues = this.DNA.trues()
		for (let i = 0; i < this.total_oxphos*(1-this.selfishness); i++){
			let ix = trues[Math.floor(this.mt.random() * trues.length)]
			let mito = cumsum_norm.findIndex(element => this.mt.random() < element )
			this.mitochondria[mito].products[ix]++
		}
		if (this.V - C.getVolume(this.id) < 30){
			this.V += Math.max(this.total_oxphos *  this.selfishness / 100, 10)
		}
		this.V -= 3
		
		

		// let replication_products = new Array(this.conf["N_REPLICATE"]).fill(Math.floor((1-this.C.conf['host_selfishness']) * host_cell.total_oxphos / this.C.conf['N_REPLICATE']))
		// // distribute 
		
		// // cumsum_norm = cumsum_norm.reverse() // enables finding first
		// // console.log(host_cell.total_oxphos,replication_products, cumsum_norm, host_cell.total_mito_vol)
		// for (const [ix, product] of replication_products.entries()){
		// 	for (let i = 0; i < product; i++){
		// 		let ran = this.C.mt.random()
		// 		let mito = cumsum_norm.find(element => ran < element['vol_part']   )
		// 		this.C.getCell(mito.cid).products[ix+this.C.conf["N_OXPHOS"]+this.C.conf["N_TRANSLATE"]]++
		// 		// console.log(mito, ran)
		// 		// console.log(cumsum_norm)
		// 		// console.log(this.C.getCell(mito.cid), ran)
		// 	}
		// }
	}

}

export default HostCell