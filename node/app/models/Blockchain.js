class Blockchain{

    constructor(){
        this.blocks = [];
    }

    add(block){
        this.blocks.push(block);
    }

    static validateChain(chain){
        var lastBlock = chain[0]

        i = 1

        while(i < chain.length){
            let block = chain[i]

            if(block.prevHash != Block.hash(lastBlock)){
                return false;
            }
            if(!Block.validateProof(last_block.proof, block.proof)){
                return false;
            }
            lastBlock = block;
            i += 1;
        }
        return true;
    }

    static fromJSON(chain){

        var newChain = new Blockchain();
        
        for(let block in chain){
            newChain.add(Block.fromJSON(block));
        }

        return newChain;
    }

}

module.exports = Blockchain;