const Block = require('./block');
const Crypto = require('crypto-js');

class Blockchain{

    constructor(){
        this.blocks = [];
    }

    add(block){
        this.blocks.push(block);
    }

    getLastBlock(){
        return this.blocks.slice(-1)[0];
    }

    static validateChain(chain){
        var lastBlock = chain[0]

        var i = 1

        while(i < chain.length){
            let block = chain[i]

            if(block.prevHash != Block.hash(lastBlock)){
                return false;
            }
            if(!Block.validateProof(lastBlock, block)){
                return false;
            }
            lastBlock = block;
            i += 1;
        }
        return true;
    }

    static fromJSON(chain){

        var newChain = new Blockchain();
        
        for(let block of chain){
            newChain.add(Block.fromJSON(block));
        }

        return newChain;
    }

}

module.exports = Blockchain;