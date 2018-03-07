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
    reader.on('line', function (line) {
        process.stdout.write(line);
    });

}