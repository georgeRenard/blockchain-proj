const express = require('express'),
    transactionsRouter = express.Router(),
    Transaction = require('../models/transaction'),
    node = require('../../bc-entrypoint');

transactionsRouter.get('/pending', (req, res) => {
    res.type('application/json');
    res.json(node.pendingTransactions);
});

transactionsRouter.get('/confirmed', (req, res) => {
    res.type('application/json');
    res.json(node.confirmedTransactions);
});

transactionsRouter.get('/addresses/:id', (req,res) =>{

    var address = req.params.id;
    var current = node.blockchain.blocks[0];
    let txs = [];
    let i = 1;
    while(i < node.blockchain.blocks.length){

        for(var tx in current.transactions){
            if(tx.from === address || tx.to === address){
                txs.push(tx);
            }
        }
        current = node.blockchain.blocks[i];
        i++;
    }

    res.type("application/json");
    res.json({address: txs});
});

transactionsRouter.get("/addresses/:id/balance", (req,res) => {

    var address = req.params.id;

    if(!(address in node.balances)){
        res.send("This address has no history!");
        return;
    }

    var current = node.blockchain.blocks[0];
    let i = 1;
    let confirmations = [6,11,17,21];
    let response = {};
    let balance = node.balances[address];
    while(i < node.blockchain.blocks.length){
        for(var tx in current.transactions){
            if(tx.from === address && tx.paid){
                balance -= tx.amount;
            }
        }
        current = node.blockchain.blocks[i];
        i++;
        if(i in confirmations){
            response[`${i} confirmations`] = balance;
        }
    }

    res.type('application/json');
    res.json(JSON.stringify(response));
});
/** 
 * @example
 *{
 *  "from": "44fe0696beb6e24541cc0e8728276c9ec3af2675",
 *  "to": "9a9f082f37270ff54c5ca4204a0e4da6951fe917", 
 *  "value": 25.00,
 *  "senderPubKey": "2a1d79fb8743d0a4a8501e0028079bcf82a4f…eae1",
 *  "senderSignature": [e20c…a3c29d3370f79f, cf92…0acd0c132ffe56]
 *  "transactionHash": "4dfc3e0ef89ed603ed54e47435a18b836b…176a"
 *  "paid": true,
 *  "dateReceived": "2018-02-01T07:47:51.982Z"
 *  "minedInBlockIndex": 7
 *}   
 */
transactionsRouter.post("/send", (req, res) => {
    console.log(req.body);
    var transactionJSON = req.body;
    let from = transactionJSON.from;
    let to = transactionJSON.to;
    let amount = transactionJSON.amount;
    let timestamp = transactionJSON.timestamp;
    let senderPubKey = transactionJSON.senderPubKey;
    let senderSignature = transactionJSON.signature;
    let transactionHash = transactionJSON.transactionHash;
    let paid = false;

    var tx = new Transaction(from, to, amount, timestamp,
        senderPubKey, senderSignature,
        transactionHash, paid);

    message = "The transaction was not accepted by the node on premise that it is invalid.";
    if(tx.validateSignature() && node.checkBalance(from, amount)){
        message = "Transaction was successfully submited. IT WILL BE PROCESED ASAP."
        node.addPendingTransaction(tx);
    }
    res.type('application/json');
    res.json({
        "message": message
    });
});

module.exports = transactionsRouter;