const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const DefaultFaucetPort = 7000;
const FaucetPrivKey = "3c55b7fb429881b2b5e6ecff42ef897606543ae5f5a83b63a976039c8910ccca";

const Crypto = require('crypto-js');
const secp256k1 = new require('elliptic').ec('secp256k1');
const request = require('request');

app.use(express.static('public'));
app.use(bodyParser.json());

app.get("/", (req, res) => {
    res.render('./public/index.html');
})

app.post("/", (req, res) => {

    let address = res.body.address;

    var transaction = {
        from: from,
        to: to,
        amount: amount,
        timestamp: new Date().toISOString()
    };

    var hash = Crypto.SHA256(JSON.stringify(transaction)).toString();
    var keyPair = secp256k1.genKeyPair();
    var privKey = new BN(FaucetPrivKey, 16, 'be');
    keyPair.priv = privKey;

    var signature = keyPair.sign(hash).toHex();

    transaction.senderPubKey = keyPair.getPublic();
    transaction.signature = signature;
    transaction.transactionHash = hash;

    request.post('localhost:3000/transactions/send', {body: transaction}, (err, res, body) => {

        if(!err){
            res.json(body.message);
        }else{
            res.send(err);
        }

    });

});

app.listen(DefaultFaucetPort, () => {
    console.log(`Listening on port: ${DefaultFaucetPort}`);
});