const Crypto = require('crypto-js');

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

    validate(minerJob){
           
        let transactionsHash = Crypto.SHA256(this.transactions.toString()).toString(Crypto.enc.hex);
        let proof = Crypto.SHA256(minerJob + this.timestamp + this.nonce).toString(Crypto.enc.hex);
        
        return transactionsHash === this.blockDataHash && this.blockHash === proof;
        
    }
    
}

module.exports = Block;