const express = require('express'),
    homeController = express.Router(),
    node = require('../../bc-entrypoint'),
    Block = require('../models/block');
request = require('request');

homeController.get('/info', (req, res) => {
    res.json({
        about: "Blockchain Node /1.0 @Softuni",
        url: node.url,
        peers: node.peers.length,
        blocks: node.blockchain.blocks.length,
        pendingTransactionsCount: node.pendingTransactions.length,
        difficulty: node.difficulty
    });
});

homeController.get('/blocks', (req, res) => {

    res.type('application/json');
    res.json({
        blocks: node.blockchain.blocks
    });
})

homeController.get('/blocks/:id', (req, res) => {

    res.type('application/json');
    res.json({
        block: node.blockchain.blocks[req.params.id]
    });
})

homeController.get('/peers', (req, res) => {

    res.type('application/json');
    res.json({
        peers: node.peers
    });
});

homeController.post('/peers/notify', (req, res) => {
    let block = req.body;

    if (node.blockchain.getLastBlock().index + 1 < block.index) {

        node.resolveConflict().then(() => {

            console.log("Resolving conflicts");

        });

    } else if (node.blockchain.getLastBlock().index >= block.index) {
        request.get(`${url}/peers/resolve`, (err, res, body) => {
            console.log("Resolving conflicts");

        });
        res.send("Resolving....");
    } else {
        var newBlock = Block.fromJSON(block);
        for (let tx of newBlock.transactions) {
            try {
                node.transferBalance(tx.from, tx.to);
            } catch (err) {

            }
        }
        node.blockchain.add(newBlock);
        res.send(`Peer ${node.url}: 'New block received'`);
    }
});

homeController.get('/peers/resolve', (req, res) => {

    node.resolveConflict().then((replaced) => {
        res.type('application/json');
        if (replaced)
            res.json(JSON.stringify({
                message: 'Our chain was replaced',
                new_chain: JSON.stringify(node.blockchain)
            }));
        else {
            res.json(JSON.stringify({
                message: 'Our chain is authoritative',
                chain: node.blockchain
            }));
        }
    });
})

homeController.post('/peers', (req, res) => {
    console.log(req.body);
    var url = req.body.peerUrl;
    if (url === undefined || typeof (url) !== 'string') {
        res.send("Invalid peer url. Please, try agian!");
        return;
    }

    node.addPeer(url, req.body.isPeerRequest);

    if (!req.body.isPeerRequest) {
        request.post(`http://${url}/peers`, {
            body: JSON.stringify({
                peerUrl: url,
                isPeerRequest: true
            })
        }, (err, res, body) => {
            if (err) {
                console.log("Couldn't connect to peer." + err);
            }
        });
    }

});


module.exports = homeController;