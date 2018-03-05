const fs = require('fs');

/** 
 *
 * @author Georgi Angelov @Softuni
 * 
 * Keystore class is a wrapper around the physical keystore files in the
 * system. You can use it to wrap the serializing functionality of the
 * HD wallet (it will compile the JSON and then it will write the whole 
 * JSON object to file)
 * The naming convetion of the file is:
 * @example UTC-${timestamp}-${userid}
 * 
 * @constructor
 * @param {*} cipherType - The symmetric cipher used to encrypt the data
 * @param {*} cipherparams - JSON object which holds the params used for the encryption round
 * @param {*} ciphertext - The actual ciphertext
 * @param {*} kdf - Key derivation function type used to derive the enc/dec key
 * @param {*} kdfparams - Key derivation params used to schedule the key for the symmetric cipher
 * @param {*} mac - Message authentication code to prove that the password is correct
 * @param {*} id
 * @param {*} version
 * 
 */
class Keystore{

    constructor(cipherType, cipherparams, ciphertext, kdf, kdfparams, mac, id, version){
        this._cipherType = cipherType;
        this._cipherparams = cipherparams;
        this._ciphertext = ciphertext;
        this._kdf = kdf;
        this._kdfparams = kdfparams;
        this._mac = mac;
        this._id = id;
        this._version = version;
    }

    /** 
     * 
     * Transforms the current object into JSON object ready to be
     * serialized. It hold the information required to recover
     * the master key of the wallet.
     * 
     * @link https://github.com/hashcat/hashcat/issues/1228
     * @example Test Vector
     * ---------------------------------------------------
     * {
     *    "crypto" : {
     *      "cipher" : "aes-128-ctr",
     *      "cipherparams" : {
     *          "iv" : "83dbcc02d8ccb40e466191a123791e0e"
     *       },
     *      "ciphertext" : "d172bf743a674da9cdad04534d56926ef8358534d458fffccd4e6ad2fbde479c",
     *      "kdf" : "scrypt",
     *      "kdfparams" : {
     *         "dklen" : 32,
     *         "n" : 262144,
     *         "r" : 1,
     *         "p" : 8,
     *         "salt" : "ab0c7876052600dd703518d6fc3fe8984592145b591fc8fb5c6d43190334ba19"
     *       },
     *      "mac" : "2103ac29920d71da29f15d75b4a16dbe95cfd7ff8faea1056c33131d846e3097"
     *    },
     *   "id" : "3198bc9c-6672-5ab3-d995-4942343ae5b6",
     *   "version" : 3
     * }
     * ---------------------------------------------------
     * 
     */
    toJSON(){
        return {
            crypto: {
                cipher: this._cipherType,
                cipherparams: this._cipherparams,
                ciphertext: this._ciphertext,
                kdf: this._kdf,
                kdfparams: this._kdfparams,
                mac: this._mac
            },
            id: this._id,
            version: this._version
        };
    }

    /** 
     *
     * 
     *  
     */
    save(filename){
        var serializableJSON = this.toJSON();

        
    }

    /**
     * 
     * @param {*} userid 
     */
    static load(userid){



    }

}