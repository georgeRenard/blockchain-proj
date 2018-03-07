const Crypto = require('crypto-js');

class Block {

    constructor(index, transactions, difficulty, prevHash, minedBy, blockDataHash, nonce, timestamp, blockHash) {
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

    validate(minerJob) {
        
        let transactionsHash = Crypto.SHA256(this.transactions.toString()).toString();
        let proof = Crypto.SHA256(JSON.stringify(minerJob) + this.timestamp + this.nonce).toString();
        return transactionsHash === this.blockDataHash && this.blockHash === proof;
    }

    static fromJSON(block) {
        return new Block(block.index, block.transactions,
            block.difficulty, block.prevHash, block.minedBy,
            block.blockDataHash, block.nonce, block.timestamp,
            block.blockHash
        );
    }

}

module.exports = Block;