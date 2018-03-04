const bip39 = require('./bip39');
const {randomBytes} = require('crypto');
const Crypto = require('crypto-js');

/**
 * 
 * @author Georgi Angelov @Softuni
 * 
 * The Bip32 module allows you to create HD Wallets by utilizing
 * the Password Base Key Derivation and a Mnemonic sequence of words
 * You can either create a new wallet or use an old one by 
 * deserializing it using your passed in password and wallet name
 * Bip32 objects hold state and cannot be used for multiple user-wallets (you have to create
 * new object each time)
 * 
 * @constructor - Creates new HD Wallet instance
 * 
 * @param {*} walletName - The name of your wallet @type string
 * @param {*} password - The password of your wallet @type string
 * 
 * @returns Bip32 object which holds wallet state
 * 
 * @throws Throws Error if correct parameters are not passed
 * 
 */
const bip32 = function(walletName, password){

    if(typeof(walletName) !== 'string' || walletName === undefined){
        throw new Error("You should provide a wallet name");
    }

    if(typeof(password) !== 'string' || password === undefined){
        throw new Error("You should provide a password");
    }

    const walletCore = bip39(walletName, password);

    /**
     * Parse256 converts large 256bits hex to large 256bits integer
     * @param {*} hex 
     * @returns Large 32byte Integer 
     * @type int
     */
    var parse256 = function(hex){
        return parseInt(hex, 16);
    }

    var deriveMasterKey = function(seed, bytes) {
        
        //Wallet master seed generated throuh bip39
        var seed = walletCore.generateSeedKey();
        var bytesBuffer = bytes;

        if(bytes === undefined){
            bytesBuffer = randomBytes(32);
        }
        //Entropy to extend the master key
        var entropy = bytesBuffer.toString('hex');
        //I have no idea why this is called l in the paper :()
        var l = Crypto.HmacSHA512(seed, entropy).toString(Crypto.enc.Hex);

        //lL is 32byte integer used as Master Private Key
        var lL = parse256(l.slice(0,64));
        var lR = l.slice(64,128);

    }

    return {
        
    }

}

module.exports = bip32;