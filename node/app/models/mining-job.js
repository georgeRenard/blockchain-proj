class MiningJob{
    
    constructor(blockIndex, transactionsHash, transactionsCount, prevBlockHash, difficulty, expectedReward){
        this.blockIndex = blockIndex;
        this.transactionsHash = transactionsHash;
        this.prevBlockHash = prevBlockHash;
        this.difficulty = difficulty;
        this.expectedReward = expectedReward;
        this.transactionsCount = transactionsCount;
    }
    
}

module.exports = MiningJob;