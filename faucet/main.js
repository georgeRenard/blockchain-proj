const express = require('express');
const bodyParser = require('body-parser');
const BN = require('bn.js');
const app = express();
const DefaultFaucetPort = 7000;
const FaucetPrivKey = "3c55b7fb429881b2b5e6ecff42ef897606543ae5f5a83b63a976039c8910ccca";
const FaucetAddress = "0x1b2f108f8297d330d822dde0cddd40e709233856";

const Crypto = require('crypto-js');
const secp256k1 = new require('elliptic').ec('secp256k1');
const request = require('request');

var homeRouter = express.Router();

app.use(bodyParser.json());
app.use(express.static('public'));

homeRouter.get("/", (req, res) => {
    res.render('./public/index.html');
})

homeRouter.post("/", bodyParser.json(), (req, res) => {

    let address = req.body.address;

    var transaction = {
        from: FaucetAddress,
        to: address,
        amount: 5,
        timestamp: new Date().toISOString()
    };

    var hash = Crypto.SHA256(JSON.stringify(transaction)).toString();
    var keyPair = secp256k1.genKeyPair();
    var privKey = new BN(FaucetPrivKey, 16, 'be');
    keyPair.priv = privKey;

    var signature = keyPair.sign(hash);

    transaction.senderPubKey = keyPair.getPublic();
    transaction.signature = signature;
    transaction.transactionHash = hash;
    
    request({
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        url: "http://localhost:3000/transactions/send",
        body: JSON.stringify(transaction)
    }, function (err, response, body) {
        if(!err){
            res.json(response);
        }else{
            res.send(err);
        }

    });
});

app.use('/', homeRouter);

app.listen(DefaultFaucetPort, () => {
    console.log(`Listening on port: ${DefaultFaucetPort}`);
});