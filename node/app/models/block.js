const Crypto = require('crypto-js');
const Transaction = require('./transaction');

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

    static hash(block){
        var hashObj = Crypto.SHA256(JSON.stringify(block))
        return hashObj.toString();
    }

    static fromJSON(block) {

        var txs = [];

        for(var tx of block.transactions){
            txs.push(Transaction.fromJSON(tx));
        }

        return new Block(block.index, txs,
            block.difficulty, block.prevHash, block.minedBy,
            block.blockDataHash, block.nonce, block.timestamp,
            block.blockHash
        );
    }

    static validateProof(block, newBlock){

        //Turning it into header
        var lastBlock = {
            blockIndex: block.index + 1,
            prevBlockHash: block.blockHash,
            difficulty: newBlock.difficulty,
            expectedReward: 0,
            transactionsHash: Crypto.SHA256(block.transactions.slice(0,-1).toString()).toString(),
            transactionsCount: block.transactions.length - 1
        };
        
        var hashObj = Crypto.SHA256(JSON.stringify(lastBlock) + newBlock.timestamp + newBlock.nonce);
        return hashObj.toString() === newBlock.blockHash;
    }

}

module.exports = Block;