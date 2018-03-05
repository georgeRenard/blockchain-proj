const Mnemonics = require('./Mnemonics');
const Crypto = require('crypto-js');
const DERIVATION_ROUNDS = 2048;

const NKFD = require('unorm').nfkd;

const SERIALIZATION_PATH = "../../../user-wallets";

/** 
 * 
 * @author Georgi Angelov @Softuni
 * 
 * Bip39 can be used for generating HD Wallet seeds
 * Bip39 module is a function and each call is a new instance
 * which holds mnemonics and utility functions
 * You should be using this module with bip32 one. 
 * @param {*} password - Optional parameter which adds additional security
 * to your mnemonics. It is applied as salt to the PBKDF2
 * 
 * 
 * Derivation process....
 * 1. Initial 256 bit entropy -> generated via CSPRNG (i hope)
 * 2. Checksum of 8 bits is added via SHA256(entropy) - Mnemnoic words are 11bit ( 256 % 11 != 0 )
 * 3. Indices between 0 and 2047 are generated -> get relative mnemonics
 * 4. Mnemnoics are appended and UTF-8 Normalized via unorm module
 * 5. Pass the password or empty string and the mnemonics to the PBKDF2 with 2048 iterations
 * 6. 64byte seed key is ready for use
 */
const bip39 = (function (walletName, password) {

    //List of 24 mnemonics
    let mnemonics = Mnemonics.generate();

    /** 
     * Serializes your wallet in JSON format encrypted with AES
     */

    var generateSeedKey = function () {
        var generateSeedKey = (function () {
            var salt = NKFD(password) || '';
            var phrase = NKFD(mnemonics.join(' '));

            return {
                seedKey: Crypto.PBKDF2(phrase, salt, {
                    hasher: Crypto.algo.SHA256,
                    iterations: DERIVATION_ROUNDS,
                    keySize: 64
                }).toString(Crypto.enc.Hex)
            };
        });

        if (mnemonics === undefined) {
            setTimeout(generateSeedKey, 1000);
        } else {
            return generateSeedKey();
        }
    }

    /** 
     * Be careful when using this function because it returns
     * the generated mnemonics in 
     */
    var getMnemonicsList = function () {
        return this.mnemonics;
    }

    return {
        generateSeedKey: generateSeedKey,
        mnemonics: getMnemonicsList
    };

});


module.exports = bip39;