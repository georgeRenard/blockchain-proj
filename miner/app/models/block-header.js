

class BlockHeader{
    
    constructor(index, transactionsHash, prevBlockHash, difficulty, expectedReward){
        this.index = index;
        this.prevBlockHash = prevBlockHash;
        this.difficulty = difficulty;
        this.expectedReward = expectedReward;
        this.transactionsHash = transactionsHash;
    }
    
}

module.exports = BlockHeader;