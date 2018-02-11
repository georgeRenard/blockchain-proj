const request = require('request'),
    BlockHeader = require('./app/models/block-header'),
    sha256 = require('crypto-js/sha256');

const errorMsgMiner = 'Miner address not specified. Please set env variable MINER_ADDRESS to correct wallet address.';
const errorMsgNode = 'Node address not specified. Please set env variable NODE_ADDRESS to connect to a node.';

var minerAddress = process.env.MINER_ADDRESS ||
    throw Error(errorMsgMiner);

var nodeAddress = process.env.NODE_ADDRESS ||
    throw Errror(errorMsgNode);

var url = `http://${nodeAddress}/mining/get-block/${minerAddress}`;


var currentBlock = {};
var nonce = 0;
var blockJSON = JSON.stringify(currentBlock);
var nodeCallback = (function (error, response, body) {

    if (!error) {

        let blockIndex = body.index;
        let transactionsHash = body.transactionsHash;
        let expectedReward = body.expectedReward;
        let difficulty = body.difficulty;
        let prevBlockHash = body.prevBlockHash;

        if (JSON.stringify(block) !== '{}') {
            if (blockIndex == currentBlock.index) {
                if (transactionsHash !== currentBlock.transactionsHash) {
                    currentBlock.expectedReward = expectedReward;
                    currentBlock.transactionsHash = transactionsHash;
                    currentBlock.difficulty = difficulty;
                    currentBlock.prevBlockHash = prevBlockHash;
                    console.log("Block update!");
                    blockJSON = JSON.stringify(currentBlock);
                    return;
                }
            }
        }

        console.log(`Start mining block ${blockIndex}`);
        currentBlock = new BlockTemplate(blockIndex, transactionsHash, prevBlockHash, difficulty, expectedReward);
    } else {
        console.log(error);
    }
    
    blockJSON = JSON.stringify(currentBlock);

});

request(url, nodeCallback);
var difficulty = currentBlock.difficulty;
do {
    
    setTimeout(request, 2000);

    var timestamp = new Date().toISOString();
    blockHash = sha256(blockJSON + timestamp + nonce);
    
    if (blockHash.startsWith('0'.rpeat(difficulty))){
        //done
        request({
            method: "POST",
            headers: {"Content-Type":"application/json"},
            url: url,
            body: JSON.stringify({
               "blockHash": blockHash,
               "difficulty": difficulty,
               "timestamp": timestamp;
            });
        }, function(error, response, body){
            
            if(!error){
                console.log("Block mined successfully"); 
            }
            
        })
    }

    nonce++;
} while (true)
