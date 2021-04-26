import SuperCell from "../SuperCell.js" 

class HostCell extends SuperCell {

		/* eslint-disable */ 
	constructor (conf, kind, id, mt) {
		super(conf, kind, id, mt)
        this.mitochondria = []
        this.selfishness = 0.5
	}

	birth(parent){
		super.birth(parent)
		this.selfishness = parent.selfishness
	}
}

export default HostCell