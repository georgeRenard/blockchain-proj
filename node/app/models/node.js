const Blockchain = require('./Blockchain');
const request = require('request');


class Node {

    constructor(url, peers, difficulty) {
        this.url = url;
        this.difficulty = difficulty;
        this.balances = {};
        this.peers = peers || [];
        this.blockchain = new Blockchain();
        this.miningJobs = {};
        this.pendingTransactions = [];
    }

    addTransaction(transaction) {
        this.pendingTransactions.push(transaction);
    }

    addBlock(block) {
        this.blockchain.add(block);
    }

    addMiningJob(miner, miningJob) {
        this.miningJobs[miner] = (miningJob);
    }

    addPeer(peer) {

    }

    transferBalance(from, to, amount) {
        if (this.balances[from] < amount) {
            throw new Error("Insufficient funds");
        }
        this.balances[from] -= amount;
        this.balances[to] += amount;
    }

    getLastBlock() {}


    resolveConflict() {
        let peers = this.peers;
        var newChain = undefined;
        var maxLen = this.blockchain.blocks.length;

        for (let peer in peers) {
            response = request.get(`${peer}/chain`, (err, res, body) => {

                if(res.statusCode === 200){
                    var length = body.length;
                }
                chain = response.json()['chain']
                
                if(length > maxLen && Blockchain.validateChain(chain)){
                    maxLen = length;
                    newChain = Blockchain.fromJSON(chain);
                }
            });
        }
        if (newChain) {
            this.blockchain = newChain;
        }

        return True
    }

}

module.exports = Node;