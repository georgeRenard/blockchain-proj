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
        this.peers.push(peer);
    }

    notifyPeers(block){

    }

    transferBalance(from, to, amount) {
        if (this.balances[from] < amount) {
            throw new Error("Insufficient funds");
        }
        this.balances[from] -= amount;
        this.balances[to] += amount;
    }

    checkBalance(sender, amount){
        if(this.balances[sender] < amount){
            return false;
        }

        return true
    }

    resolveConflict() {
        return new Promise((resolve,reject) => {
            let peers = this.peers;
            var newChain = undefined;
            var maxLen = this.blockchain.blocks.length;

            var awaitRequest = new Promise((resolve, reject) => {
                for (let peer of peers) {

                    let url = `http://${peer}/blocks`;
                    request.get(url, (err, res, body) => {
                        let blocks = JSON.parse(body);
                        if(!err){
                            var length = blocks.length;
                        }
                        let chain = blocks.blocks;
                
                        if(length > maxLen && Blockchain.validateChain(chain)){
                            maxLen = length;
                            newChain = Blockchain.fromJSON(chain);
                        }

                        if(peer == peers.slice(-1)){
                            resolve();
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