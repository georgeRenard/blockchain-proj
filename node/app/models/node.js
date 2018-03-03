class Node {
    constructor(peers, blockchain, balances, miningJobs, pendingTransactions){
        this.balances = balances;
        this.peers = peers;
        this.blockchain = blockchain;
        this.miningJobs = miningJobs;
        this.pendingTransactions = pendingTransactions;
    }
    
    addTransaction(transaction){
        this.pendingTransactions.push(transaction);
    }
    
    addBlock(block){
        this.blockchain.push(block);
    }
    
    addMiningJob(miner, miningJob){
        this.miningJobs[miner] = (miningJob);
    }
    
    transferBalance(from, to, amount){
        if(this.balances[from] < amount){
            throw new Error("Insufficient funds");
        }
        this.balances[from] -= amount;
        this.balances[to] += amount;
    }
    
    getLastBlock(){
        return this.blockchain.slice(-1)[0];
    }
    
}


const masterNode = new Node([], [], {},
                            {}, []);

module.exports = masterNode;