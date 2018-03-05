const bip39 = require('./bip39');
const {
    randomBytes
} = require('crypto');
const Crypto = require('crypto-js');
const Base58 = require('bs58');
 
const ExtendedKey = require('./ExtendedKey');
const EC = require('elliptic').ec;
const secp256k1 = new EC('secp256k1');

//Version is appended to the key
//MainNetVersion
//xpriv and xpub
const HDPrivateKeyID = '0x0488ade4';
const HDPublicKeyID = '0x0488b21e';

//The length of the serialized extended public/private key
// 1. 4bytes net version
// 2. 1byte depth
// 3. 4bytes parentFingerprint
// 4. 4bytes child number
// 5. 32 bytes chaincode
// 6. 33 bytes public/private key 
const serializedKeyLength = 4 + 1 + 4 + 4 + 32 + 33

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
 * @param {*} mode - The working mode of the instance @type string
 * 
 * @example 
 * 
 * var bip32 = require('bip32');
 * var instance = bip32("username", "password", "generator");
 * var extendedKey = instance.derive();
 * 
 * ExtendedKey {
 *      _version: '0x0488ade4',
 *      _key: 'd303c02c4504e6e6dce2b6567b7154ee8e1f71310a5121ff248637e71c3c1df3',
 *      _chainCode: 'bdc579448f07c62438c2c0abf083b5a15b171d25e510b96f6bf1c4dcccd81579',
 *      _parentFP: '0x00000000',
 *      _depth: 0,
 *      _childNum: 0,
 *      _isPrivate: true 
 *}
 * 
 * extendedKey.toBase58()
 * 'xprv9s21ZrQH143K3wwWYhi892R7ACanYZqMJJGEBEvoiJa4qTx1hcYLjSsEwGJwF6FB9K8oN4nYUYfgomYBtgMW1psnS9YkrTEgF7TuhP83z6t'
 * 
 * 
 * var bip32 = require('bip32');
 * var instance = bip32('username', 'password', 'loader')
 * TODO
 * 
 * @returns Bip32 object which holds wallet state
 * 
 * @throws Throws Error if correct parameters are not passed
 * 
 */
const bip32 = function (walletName, password, mode) {

    if (typeof (walletName) !== 'string' || walletName === undefined) {
        throw new Error("You should provide a wallet name");
    }

    if (typeof (password) !== 'string' || password === undefined) {
        throw new Error("You should provide a password");
    }

    if (typeof (mode) !== 'string' || mode === undefined) {
        throw new Error("You should specifiy working mode")
    }

    if (mode != 'generator' && mode != 'loader') {
        throw new Error("The specified mode is incorrect. Use eihter 'generator' or 'loader'");
    }

    // Prerequisits for master key derivation 
    // They are bound to the instance
    const walletCore = bip39(walletName, password);
    const seed = walletCore.generateSeedKey();
    var bytesBuffer = randomBytes(32);

    /**
     * Parse256 converts large 256bits hex to large 256bits integer
     * @param {*} hex 
     * @returns Large 32byte Integer 
     * @type int
     */
    var parse256 = function (hex) {
        return parseInt(hex, 16);
    }

    /**
     * Deriving a new master key for a new HD Wallet
     * The derivation process uses the procedure specified in
     * BIP32 and BIP39.
     * @link https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
     * @param {*} bytes - random bytes to extend the master key (if not provided - entropy
     * will be automatically generated)
     * @param {*} instanceIndependent - boolean value which specifies whether the derivation
     * should be instance independent or it should use the entropy generated with the
     * instance
     */
    var deriveMasterKey = function (bytes, instanceIndependent) {

        //Wallet master seed generated through bip39
        if(bytes !== undefined){
            bytesBuffer = bytes;
        }

        if(instanceIndependent === true){
            bytesBuffer = randomBytes(32);
        }

        //Entropy to extend the master key
        var entropy = bytesBuffer.toString('hex');
        //I have no idea why this is called l in the paper :()
        var l = Crypto.HmacSHA512(seed, entropy).toString(Crypto.enc.Hex);

        //lL is 32byte integer used as Master Private Key
        var lL = l.slice(0, 64);
        //lR is 32byte hex used as chaincode
        var lR = l.slice(64, 128);

        var curveOrder = secp256k1.n.toString('hex');
        curveOrder = parse256(curveOrder);

        var parsedKey = parse256(lL);
        if(parsedKey <= 0 || parsedKey >= curveOrder){
            throw new Error("Wallet Master Key generation failed. " +
                            "Please, try again (the failure chance is extremely low)");
        }

        //4 null bytes
        var parentFP = '0x00000000';
        return new ExtendedKey(HDPrivateKeyID, lL, lR, parentFP, 0, 0, true);
    }


    /**
     * The serializeWallet function serializes the master key using 8 rounds of scrypt
     * to derive a symmetric key. Then it utilizes AES to encrypt the masterKey
     * @param {*} masterKey - Master key to encrypt
     */
    var serializeWallet = function(masterKey){
        var scrypt = require('scrypt');        
    
        //Keystore protocol prereqs
        //The timestamp of creation
        var timestamp = new Date().toISOString();
        //Uniq userid generated via the passed walletName and password through HmacSHA1
        var userid = Crypto.HmacSHA1(walletName, password).toString(Crypto.enc.Hex);
        var nameFormat = `UTC--${timestamp}--${userid}`;

        var error = undefined;
        var key = Buffer.from(password);
        //8 rounds of scrypt to derive the decryption key
        scrypt.hash(key, {"N":1024,"r":8,"p":1},64,"")
            .then(function(derivedKey) {
                const fs = require('fs');

                Crypto.AES.encrypt(masterKey,derivedKey)
            })
            .catch((err) => error = err);

        return error;
    }

    
    var deserializeWallet = function(){

    }

    /**
     * Deserialize wallet is a function which turns an extended master key 
     * encoded in base58 back into @ExtendedKey object
     * @param {*} base58EncodedKey - the extended master key you are deserializing
     */
    var decodeKey = function(base58EncodedKey){

        //Base58.decode returns a Buffer object with bytes in hexadecimal
        var extKey = Base58.decode(base58EncodedKey);

        if(extKey.length != serializedKeyLength + 4){
            throw new Error(`The length of your decoded key is ${extKey.length} 
                                        and should be ${serializedKeyLength}`);
        }

        //The serialization format is
        // {version - 4} + {depth - 1} + {parentFingerprint - 4} + {childNumber - 4} + 
        // {chaincode - 32} + {public/private key - 33} + {checksum + 4}

        // buffer from 0 to 3
        let version = '0x' + extKey.slice(0,4).toString('hex');
        // buffer from 3 to 4
        let depth = parseInt(extKey.slice(4,5).toString('hex'), 16);
        // buffer from 5 to 8
        let parentFP = '0x' + extKey.slice(5,9).toString('hex');
        // buffer from 9 to 12
        let childNum = parseInt(extKey.slice(9,13).toString('hex'), 16);
        // buffer from 13 to 35
        let chainCode = extKey.slice(13,45).toString('hex');
        // buffer from 46 to 79
        let key = extKey.slice(45, 78).toString('hex');
        // buffer from 78 to 81
        let checksum = extKey.slice(78, 82).toString('hex');

        var checksumVerify = Crypto.SHA256(extKey).toString(Crypto.enc.Hex);
        checksumVerify = Crypto.SHA256(checksumVerify).toString(Crypto.enc.Hex).slice(0, 8);
        if(checksum !== checksumVerify) {
            throw new Error("Checksum is wrong. This key is invalid.");
        }

        //If the key is padded with null byte it means it is private
        //Otherwise it must be public
        var isPrivate = key.slice(0,2).toString('hex') === '00';
        var curveOrder = secp256k1.n.toString('hex');
        curveOrder = parse256(curveOrder);

        if(isPrivate){
            key = key.slice(2,);
            var parsedKey = parse256(key);
            if(parsedKey <= 0 || parsedKey >= curveOrder){
                throw new Error("Invalid key. The key you are trying to decode is invalid!");
            }
        }else{

        }

        return new ExtendedKey(version, key, chainCode, parentFP, depth, childNum, isPrivate);
    }

    // Generator instance is for creating a new HD wallet
    var generatorInstance = {
        derive: deriveMasterKey,
        serialize: serializeWallet,
        toExtendedKey: decodeKey
    };

    // Loader instance should be returned if you are loading an already
    // existing wallet
    var loaderInstance = {
        deserialize: deserializeWallet
    }

    //Depending on the mode return the correct instance 
    //This is for purpose of encapsulation
    if (mode === 'generator') {
        return generatorInstance;
    } else {
        return loaderInstance;
    }
}

module.exports = bip32;