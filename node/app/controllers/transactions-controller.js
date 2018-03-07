const express = require('express'),
    transactionsRouter = express.Router(),
    Transaction = require('../models/transaction'),
    node = require('../../bc-entrypoint');

transactionsRouter.get('/pending', (req, res) => {
    res.json(node.pendingTransactions);
});

transactionsRouter.get('/confirmed', (req, res) => {

});

transactionsRouter.get('/addresses/:id')
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
    if(tx.validateSignature()){
        message = "Transaction was successfully submited. IT WILL BE PROCESED ASAP."
        node.addPendingTransaction(tx);
    }
    res.json({
        "message": message
    });
});

module.exports = transactionsRouter;