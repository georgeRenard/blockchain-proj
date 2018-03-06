const fs = require('fs');

const WALLETS_SERIALIZATION_PATH = "../../../user-wallets/";

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
class Keystore {

    constructor(cipherType, cipherparams, ciphertext, kdf, kdfparams, mac, id, version) {
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
    toJSON() {
        return {
            version: this._version,
            id: this._id,
            Crypto: {
                cipher: this._cipherType,
                cipherparams: this._cipherparams,
                ciphertext: this._ciphertext,
                kdf: this._kdf,
                kdfparams: this._kdfparams,
                mac: this._mac
            }
        };
    }


    /**
     * Performs DFS directory traversal and adds every file to the
     * passed in list
     * @static The function is static because it is accessed through static function
     * @param {*} dir - directory to traverse 
     * @param {*} filelist - filelist to append to
     */
    static traverse(dir, filelist) {
        var files = fs.readdirSync(dir);
        filelist = filelist || [];
        files.forEach(function (file) {
            if (fs.statSync(dir + file).isDirectory()) {
                filelist = traverse(dir + file + '/', filelist);
            } else {
                filelist.push(file);
            }
        });
        return filelist;
    }

    /**
     * 
     * @save function is writing the current instance of Keystore object
     * to file so it can be later deserialized for native use or 
     * even imported into other HD Wallets with some modifications (mby?)
     * 
     * @param {*} fileName - The name of the keystore file
     */
    save(fileName) {

        if (fileName === undefined || fileName === '') {
            throw new Error("File name should be supplied before serialization.");
        }

        var serializableJSON = this.toJSON();
        var content = JSON.stringify(serializableJSON);

        var extension = "." + fileName.split("--")[2];
        var walletFileName = WALLETS_SERIALIZATION_PATH + fileName + extension;
        fs.writeFile(walletFileName, content, {
            flag: 'w'
        }, function (err) {
            if (err) {
                throw new Error("Your new wallet couldn't be saved. Please, try again. \n" + err);
            }
            console.log("Your wallet was successfully created :)");
        });
    }

    /**
     * Used for loading a keystore file in memory
     * @static This static method is used to read a keystore file from the 
     * filesystem using the "fs" module and to return a new instance
     * of Keystore, which later will be used by bip32 module for deserialization
     * of a wallet.
     * @param {*} userid - The userid of the serialized wallet. Indicates which file to load
     */
    static load(userid) {

        //Populating the files list by sync-traversing the wallets directory
        let files = [];
        Keystore.traverse(WALLETS_SERIALIZATION_PATH, files);

        let walletFile = '';
        //looking for the correct wallet with the correct id in the name
        files.forEach(x => {
            if (x.includes(userid)) {
                walletFile = x;
                return;
            }
        });

        if (walletFile === '') throw new Error('No such wallet was found.');
        //Read the contents of the keystore file
        var filePath = WALLETS_SERIALIZATION_PATH + walletFile;
        var lineReader = require('readline').createInterface({
            input: fs.createReadStream(filePath)
        });
        //Read line by line async
        var json = [];
        lineReader.on('line', function (line) {
            json.push(line);
        });
        //Simulating sync functionality because i suck at node.js
        const sleep = require('system-sleep');
        sleep(100);
        //Deserialization of the Keystore object
        //parse the object
        var KeystoreObject = JSON.parse(json.join('\n'));
        return KeystoreObject;

    }

}


module.exports = Keystore;