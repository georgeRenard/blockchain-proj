const express = require('express'),
    miningRouter = express.Router(),
    MiningJob = require('../models/mining-job'),
    Transaction = require('../models/transaction'),
    node = require('../../bc-entrypoint'),
    Crypto = require('crypto-js'),
    Block = require('../models/block');
/**
 *
 *
 */
miningRouter.get('/get-block/:id', function (req, res) {
    let minerId = req.params.id;
    let hashObj = Crypto.SHA256(node.pendingTransactions.toString());
    let transactionsHash = hashObj.toString();
    let lastBlock = node.blockchain.getLastBlock();
    let reward = 0;
    node.pendingTransactions.forEach(x => reward += x.transactionFee);

    if (minerId in node.miningJobs) {
        if (node.miningJobs[minerId].blockIndex == lastBlock.index) {
            if (node.miningJobs[minerId].transactionsHash != transactionsHash) {
                node.miningJobs[minerId].transactionsHash = transactionsHash;
                node.miningJobs[minerId].expectedReward = reward;
            }
            res.send({
                "blockIndex": node.miningJobs[minerId].blockIndex,
                "transactionsHash": transactionsHash,
                "expectedReward": reward
            })
        }
    }
    //Create new mining job and assign the miner to it
    let miningJob = new MiningJob(lastBlock.index + 1, transactionsHash,
        node.pendingTransactions.length, lastBlock.blockHash,
        node.difficulty, reward);

    node.addMiningJob(minerId, miningJob);
    if (!(minerId in node.balances)) {
        node.balances[minerId] = 0;
    }
    res.send(JSON.stringify(miningJob));
});

miningRouter.post('/get-block/:id', function (req, res) {

    //Block found
    let minerId = req.params.id;
    //Add the block to the existing blockchain
    let minerResponse = req.body;
    let minerJob = node.miningJobs[minerId];
    let index = minerJob.blockIndex;
    let transactions = node.pendingTransactions.slice(0, minerResponse.transactionsCount);
    let difficulty = minerResponse.difficulty;
    let transactionsHash = minerResponse.transactionsHash;
    let nonce = minerResponse.nonce;
    let timestamp = minerResponse.timestamp;
    let blockHash = minerResponse.blockHash;
    let prevHash = minerResponse.prevHash;

    let block = new Block(index,
        transactions, difficulty, prevHash, minerId,
        transactionsHash, nonce, timestamp, blockHash);

    //Validate
    if (block.index === node.blockchain.getLastBlock().index + 1 && block.validate(minerJob)) {
        //Send coinbase to miner address
        let reward = 5 + minerJob.expectedReward;
        block.transactions.push(Transaction.newCoinbaseTo(minerId, reward));
        node.blockchain.add(block);
        node.pendingTransactions = node.pendingTransactions.slice(minerResponse.transactionsCount);
        block.transactions.forEach(x => {
            node.transferBalance(x.from, x.to, x.amount);
            node.confirmedTransactions.push(x)
            x.paid = true;
        });
        node.notifyPeers(block);
        delete node.miningJobs[minerId];
        res.send({
            "message": "Block mined successfully"
        });
    } else {
        res.send(JSON.stringify({
            "message": "Something went wrong when verifying PROOF"
        }));
    }
});


module.exports = miningRouter;