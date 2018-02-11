
class Block{
    
    constructor(index, transactions, difficulty, prevHash, minedBy, blockDataHash, nonce, timestamp, blockHash){
        this.index = index;
        this.transactions = transactions;
        this.difficulty = difficulty;
        this.prevHash = prevHash;
        this.minedBy = minedBy;
        this.blockDataHash = blockDataHash;
        this.nonce = nonce;
        this.timestamp = timestamp;
        this.blockHash = blockHash;
    }

    
}

module.exports = Block;