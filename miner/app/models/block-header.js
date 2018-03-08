

class BlockHeader{
    
    constructor(blockIndex, transactionsHash, transactionsCount, prevBlockHash, difficulty, expectedReward){
        this.blockIndex = blockIndex;
        this.prevBlockHash = prevBlockHash;
        this.difficulty = difficulty;
        this.expectedReward = expectedReward;
        this.transactionsHash = transactionsHash;
        this.transactionsCount = transactionsCount;
        console.log(this);
    }
    
}

module.exports = BlockHeader;