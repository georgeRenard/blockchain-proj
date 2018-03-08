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

    confirmTransaction(transaction) {
        this.confirmedTransactions.push(transaction);
    }

    addMiningJob(miner, miningJob) {
        this.miningJobs[miner] = (miningJob);
    }

    addPeer(peer, isPeerRequest) {
        console.log(`${this.url}: Adding ${peer}, IsPeerRequest: ${isPeerRequest}`);
        this.peers.push(peer);

        if (isPeerRequest) {
            return;
        }
        let body = {
            peerUrl: this.url,
            isPeerRequest: true
        }
        let peerurl = `http://${peer}/peers`;
        request({
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            url: peerurl,
            body: JSON.stringify(body)
        }, function (error, response, body) {

            if (error) {
                console.log(body);
            } else {
                console.log(error);
            }

        });

    }

    notifyPeers(block) {

        for (let peer of this.peers) {
            var peerurl;
            if (!peer.startsWith('http://')) {
                peerurl = `http://${peer}/peers/notify`;
            } else {
                peerurl = `${peer}/peers/notify`;
            }
            request({
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                url: peerurl,
                body: JSON.stringify(block)
            }, function (error, response, body) {

                if (error) {
                    console.log(body);
                } else {
                    console.log(error);
                }

            });

        }

    }

    transferBalance(from, to, amount) {
        if (this.balances[from] < amount) {
            throw new Error("Insufficient funds");
        }
        this.balances[from] -= amount;
        this.balances[to] += amount;
    }

    checkBalance(sender, amount) {
        if (this.balances[sender] < amount) {
            return false;
        }

        return true
    }

    updateBalances() {

        let current = this.blockchain.blocks[0];

        let i = 1;

        this.balances['0x1b2f108f8297d330d822dde0cddd40e709233856'] = 50000;
        this.balances['0x0000000000000000000000000000000000000000'] = 100000000000;

        while (i < this.blockchain.blocks.length) {

            for (let tx of current.transactions) {
                try {
                    this.transferBalance(tx.from, tx.to);
                } catch (err) {

                }
            }
            current = this.blockchain.blocks[i];
            i++;
        }

    }

    resolveConflict() {
        return new Promise((resolve, reject) => {
            let peers = this.peers;
            var newChain = undefined;
            var maxLen = this.blockchain.blocks.length;

            var awaitRequest = new Promise((resolv, rejec) => {
                for (let peer of peers) {
   
                    let url = `http://${peer}/blocks`;
                    request.get(url, (err, res, body) => {
                        let blocks = JSON.parse(body).blocks;
                        if (!err) {
                            var length = blocks.length;

                            if (length > maxLen && Blockchain.validateChain(blocks)) {
                                maxLen = length; 
                                newChain = Blockchain.fromJSON(blocks);
                            }
                            if (peer == peers.slice(-1)[0]) {
                                resolv();
                            }
                        }
                    });
                }
            });
            awaitRequest.then(() => {
            
                if (newChain) {
                    this.blockchain = newChain;
                    this.updateBalances();
                }
                resolve(!(!(newChain)));
            });
        });
    }

}

module.exports = Node;