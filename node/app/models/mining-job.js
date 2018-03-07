

class MiningJob{
    
    constructor(blockIndex, transactionsHash, transactionsCount, prevBlockHash, difficulty, expectedReward){
        this.blockIndex = blockIndex;
        this.prevBlockHash = prevBlockHash;
        this.difficulty = difficulty;
        this.expectedReward = expectedReward;
        this.transactionsHash = transactionsHash;
        this.transactionsCount = transactionsCount;
    }
    
}

module.exports = MiningJob;