process.stdout.write("---------Welcome to JoroWallet---------\n");
process.stdout.write("Please enter your username and password");


const fs = require('fs');
const reader = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

const bip32 = require('./bip32');
const ExtendedKey = require('./ExtendedKey');

const DefaultDerivationPath = [46, 60, 0, 0];
const Crypto = require('crypto-js');
const secp256k1 = new require("elliptic").ec('secp256k1');
const BN = require('bn.js');
const request = require('request');

var main = function () {
    reader.question("Create or Import (Write Create or Import) ?", (answer) => {

        switch (answer) {
            case "Create":
                createWallet();
                break;
            case "Import":
                importWallet();
                break;
            default:
                main();
        }

    });
}

main();

var importWallet = function () {

    reader.question("Please enter your username: \n", (name) => {
        var username = name;
        reader.question("Please enter your password: \n", (pass) => {
            var password = pass;
            let wallet = new bip32(username, password, "loader");
            let masterKey = wallet.deserialize(true);
            reader.question("Derivation path (empty or wrong format will call for default) e.g m/40/30/0/Ih)",
                (answer) => {
                    var regex = new RegExp('m\/(\\\d{1,9})\/(\\\d{1,9})\/(\\\d{1,9})\/(\\\d{1,9})', 'g');
                    var match = regex.exec(answer);
                    var derivationPath = match ? [match[1], match[2], match[3], match[4]] : DefaultDerivationPath
                    initWallet(username, masterKey, derivationPath);
                });

        });
    });

}

var createWallet = function () {

    var username = "";
    reader.question("Please enter your username: \n", (answer) => {
        username = answer;
        var password = "";
        reader.question("Please enter your password: \n", (answer) => {
            password = answer;
            var wallet = new bip32(username, password, "generator");
            var masterKey = wallet.derive();
            wallet.serialize(masterKey);
            reader.question("Derivation path (empty or wrong format will call for default) e.g m/40/30/0/Ih)",
                (answer) => {
                    var regex = new RegExp('m\/(\\\d{1,9})\/(\\\d{1,9})\/(\\\d{1,9})\/(\\\d{1,9})', 'g');
                    var match = regex.exec(answer);
                    var derivationPath = match ? [match[1], match[2], match[3], match[4]] : DefaultDerivationPath
                    initWallet(username, masterKey, derivationPath);
                });
        });
    });
}

var initWallet = function (username, masterKey, dp) {
    process.stdout.write("===============Initialization was successfull================\n");
    process.stdout.write(`===================Welcome ${username}=======================\n`);

    //External key chain
    var derivationChainKey = masterKey.deriveChild(dp[0])
        .deriveChild(dp[1])
        .deriveChild(dp[2])
        .deriveChild(dp[3]);

    // Extended Key objects for easy and fast usage
    var privateKeys = {};
    var addresses = {};

    for (let i = 0; i < 10; i++) {
        let privateKey = derivationChainKey.deriveChild(i);
        let pubKey = privateKey.deriveExtendedPublicKey();

        let address = ExtendedKey.toAddress(pubKey);
        let privateKeyEncoded = privateKey.toBase58();
        privateKeys[privateKeyEncoded] = privateKey;
        addresses[privateKeyEncoded] = address;

    }

    process.stdout.write("\n================Public Keys (Addresses)=====================\n");
    let count = 0;
    for (let addr in addresses) {
        process.stdout.write(`(${count}) 0x${addresses[addr].hash} \n`);
        count++;
    }
    process.stdout.write("\n");
    process.stdout.write("=====================Private Keys============================\n");
    count = 0;
    for (let key in privateKeys) {
        process.stdout.write(`(${count}) ${key} \n`);
        count++;
    }
    process.stdout.write("============================================================\n");

    process.stdout.write("HD Wallet\n");
    process.stdout.write(`Derivation path: m/${dp[0]}/${dp[1]}/${dp[2]}/${dp[3]}/{account_id}\n`);

    process.stdout.write("============================================================\n");
    process.stdout.write("\n");

    process.stdout.write('\n=======Commands you can use======');
    process.stdout.write('\n1) w-send {from} {to} {amount}');
    process.stdout.write('\n2) w-balance {address} (you can leave out address to check full balance)');
    process.stdout.write('\n3) w-load-new');
    mainLoop(username, privateKeys, addresses);

}

var mainLoop = function (username, privk, pubk) {

    reader.on('line', function (line) {
        var args = line.split(' ');
        try {
            switch (args[0]) {
                case "w-send":
                    sendTransaction(args[1], args[2], parseInt(args[3]));
                    break;
                case "w-balance":
                    checkBalance(args.length > 1 ? args.slice(1) : [args[1]], privk, pubk);
                    break;
                case "w-load-new":
                    importWallet();
                    break;
            }
        } catch (err) {
            process.stdout.write("Wrong command. Try again!");
        }
    });


}

var sendTransaction = function (from, to, amount, privk, pubk) {

    var key = undefined;
    for (var addr in pubK) {
        if (addr === key) {
            key = addr;
        }
    }

    if (!key) {
        process.stdout.write("Please, choose from the listed addresses.\n");
    }

    var transaction = {
        from: from,
        to: to,
        amount: amount,
        timestamp: new Date().toISOString(),
    };
    console.log(transaction);
    console.log("\n");
    reader.question("Do you sign and agree with the transaction ? (Y/N) \n ", (answer) => {
        var hash = Crypto.SHA256(JSON.stringify(transaction)).toString();

        if (answer === 'Y') {

            var keyPair = secp256k1.genKeyPair();
            var privKey = new BN(key._key.slice(1), 16, 'be');
            keyPair.priv = privKey;

            var signature = keyPair.sign(hash).toHex();

            transaction.senderPubKey = keyPair.getPublic();
            transaction.signature = signature;
            transaction.transactionHash = hash;

            request.post('localhost:3000/transactions/send', {body: transaction}, (err, res, body) => {

                if(!err){
                    console.log(body.message);
                }else{
                    console.log(err);
                }

            });
        } else {
            return;
        }
    });

}