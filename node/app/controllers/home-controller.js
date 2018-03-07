const express = require('express'),
      homeController = express.Router(),
      node = require('../../bc-entrypoint')();
      request = require('request');

homeController.get('/info', (req,res) => {
    res.json({
        about: "Blockchain Node /1.0 @Softuni",
        url: node.url,
        peers: node.peers.length,
        blocks: node.blockchain.blocks.length,
        pendingTransactionsCount: node.pendingTransactions.length,
        difficulty: node.difficulty
    });
});

homeController.get('/blocks', (req,res) => {
    res.json(node.blockchain.blocks);
})

homeController.get('/blocks/:id', (req,res) => {
    res.json(node.blockchain.blocks[req.params.id]);
})

homeController.get('/peers', (req,res) => {
    res.json(node.peers);
});

homeController.post('/peers', (req,res) => {

    var url = req.body.peerUrl;
    if(url === undefined || typeof(url) !== 'string'){
        res.send("Invalid peer url. Please, try agian!");
    }

    node.addPeer(url);

    if(req.body.isPeerRequest){
        return;
    }
    request.post(url, {peerUrl: url, isPeerRequest: true}, (err, res, body) => {
        if(!err) {
            res.send({message: `Added peer: ${url}`});
        }else{
            res.send("Couldn't connect to peer.");
        }
    })

});


module.exports = homeController;