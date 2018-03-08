const request = require('request'),
    BlockHeader = require('./app/models/block-header'),
    Crypto = require('crypto-js'),
    sleep = require('system-sleep')
const errorMsgMiner = 'Miner address not specified. Please set env variable MINER_ADDRESS to correct wallet address.';
const errorMsgNode = 'Node address not specified. Please set env variable NODE_ADDRESS to connect to a node.';

var minerAddress = process.env.MINER_ADDRESS;
var nodeAddress = process.env.NODE_ADDRESS;

if (!minerAddress) {
    throw new Error(errorMsgMiner);
}
if (!nodeAddress) {
    throw new Error(errorMsgNode);
}

var url = `http://${nodeAddress}/mining/get-block/${minerAddress}`;


var currentBlock = {};
var nonce = 0;
var blockJSON = JSON.stringify(currentBlock);
var nodeCallback = function (err, response, body) {

    if(err){
        console.log(err);
        return;
    }
    
    let block = JSON.parse(body);
    let blockIndex = block.blockIndex;
    let transactionsHash = block.transactionsHash;
    let expectedReward = block.expectedReward;
    let difficulty = block.difficulty;
    let prevBlockHash = block.prevBlockHash;
    let transactionsCount = block.transactionsCount;

    if (JSON.stringify(currentBlock) !== '{}') {
        if (blockIndex == currentBlock.blockIndex) {
            if (transactionsHash !== currentBlock.transactionsHash) {
                currentBlock.expectedReward = expectedReward;
                currentBlock.transactionsHash = transactionsHash;
                currentBlock.transactionsCount = transactionsCount;
                console.log("Block update!");
                blockJSON = JSON.stringify(currentBlock);
                return;
            }
        }
    }
 
    console.log(`Start mining block ${blockIndex}`);
    currentBlock = new BlockHeader(blockIndex, transactionsHash,transactionsCount, prevBlockHash, difficulty, expectedReward);

    blockJSON = JSON.stringify(currentBlock);

}

let ms = 0;
requestBlock = ((immediate, elapsed) => {
    ms = elapsed + ms;
    if(immediate || ms > 20){
        request(url, nodeCallback);
        sleep(200);
        ms = 0;
    }
});


requestBlock(true);
timer = process.hrtime()[0];
do {
    
    var difficulty = currentBlock.difficulty;

    var timestamp = new Date().toISOString();
    hashObj = Crypto.SHA256(blockJSON + timestamp + nonce);
    blockHash = hashObj.toString();

    //console.log(`Block hash: ${blockHash}, nonce: ${nonce}`);
    
    target = '0'.repeat(difficulty);
    
    requestBlock(false, process.hrtime()[0] - timer);
    timer = process.hrtime()[0];
    if (blockHash.substring(0, difficulty) === target) {
        //done
        request({
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            url: url,
            body: JSON.stringify({
                nonce: nonce,
                blockHash: blockHash,
                difficulty: difficulty,
                timestamp: timestamp,
                transactionsCount: currentBlock.transactionsCount,
                transactionsHash: currentBlock.transactionsHash
            })
        }, function (error, response, body) {

            if (!error) {
                console.log("Block mined successfully");
            }

        });
        requestBlock(true);
        sleep(500);
        nonce = 0;
    }else{
        nonce += 1;   
    }

} while (true)
