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
        this.confirmedTransactions = [];
    }

    addPendingTransaction(transaction) {
        this.pendingTransactions.push(transaction);
    }

    confirmTransaction(transaction){
        this.confirmedTransactions.push(transaction);
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

    resolveConflict() {
        return new Promise((resolve,reject) => {
            let peers = this.peers;
            var newChain = undefined;
            var maxLen = this.blockchain.blocks.length;

            var awaitRequest = new Promise((res, rej) => {
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

                        if(peer == peers[-1]){
                            res();
                        }
                    });
                }
            });
            awaitRequest.then(() => {
                  if (newChain) {
                     this.blockchain = newChain;
                  }
                  resolve();
            });
        });
    }

}

module.exports = Node;