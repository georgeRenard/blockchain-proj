const Crypto = require('crypto-js');
const Base58 = require('bs58');
const EC = require('elliptic').ec
const secp256k1 = new EC('secp256k1');

const PublicKeyCompressedLength = 33;
const PublicKeyUncompressedLength = 65;
const publicKeyCompressedFormat = 0x2;

const Secp256k1PointP = "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F";

/** 
 *
 * @author Joro Angelov
 * @Softuni
 * ExtendedKey class is just a wrapper around an extended key
 * It holds all the data required by the protocol. Just a nefty
 * way to hold data.
 * @constructor
 * @param version - version of the network
 * @param key - the actual key
 * @param chainCode - current chain code
 * @param parentFP - parent fingerprint
 * @param depth - current chain depth
 * @param childNum - child number
 * @param isPrivate - is a private key
 */
class ExtendedKey {

    constructor(version, key, chainCode, parentFP, depth, childNum, isPrivate) {
        this._version = version;
        this._key = key;
        this._chainCode = chainCode;
        this._parentFP = parentFP;
        this._depth = depth;
        this._childNum = childNum;
        this._isPrivate = isPrivate;
    }

    /** 
     * Transforms the extended key into Base58 format
     */
    toBase58() {
        //Padding with null nibble if necessary
        var depth = this._depth < 15 ? '0' + this._depth : this._depth.toString(16);

        //childNum 4 bytes buffer
        var childNum = new Buffer(4);
        childNum.fill(0);

        childNum.writeUInt32BE(childNum);

        var serializedBytes =
            Buffer.concat([Buffer.from(this._version.slice(2,), 'hex'),
                Buffer.from(depth, 'hex'),
                Buffer.from(this._parentFP.slice(2, ), 'hex'),
                Buffer.from(childNum, 'hex'),
                Buffer.from(this._chainCode, 'hex')
            ]);

        if (this._isPrivate) {
            serializedBytes = Buffer.concat([serializedBytes,
                new Buffer(1).fill(0),
                Buffer.from(this._key, 'hex')
            ]);
        } else {
            serializedBytes = paddedAppend(32, serializedBytes, this.pubKeyBytes());
        }

        // Double sha256 to generate a 4byte checksum
        var checksum = Crypto.SHA256(serializedBytes).toString(Crypto.enc.Hex);
        checksum = Crypto.SHA256(checksum).toString(Crypto.enc.Hex).slice(0, 8);
        serializedBytes = Buffer.concat([serializedBytes, Buffer.from(checksum, 'hex')]);

        return Base58.encode(serializedBytes);
    }

    /** 
     * Multiplies the private key by G (point on the curve) and returns
     * new public key point.
     * @returns compressed public key bytes
     */
    pubKeyBytes() {

        if (!this._isPrivate) return this._key;

        const pubKeyCompressed = 0x2;

        var G = secp256k1.g;
        var pubKeyPoint = G.mul(this._key);

        //Compressing the key
        var isOddPointY = pubKeyPoint.y % 2 != 0
        var format = pubKeyCompressed;
        if (isOddPointY) format |= 0x1;

        var formatBuffer = Buffer.from('0' + format, 'hex');
        var buffer = Buffer.from(pubKeyPoint.x.toString('hex'), 'hex');

        return this.paddedAppend(32, format, buffer);
    }

    /**
     * Parse public key determines whether the passed in key object
     * is valid point on the curve (x: x, y: y)
     * It supports compressed and uncompressed public keys
     * 
     * @param {*} key - The public key you are trying to validate
     */
    parsePublicKey(key){


        if(key.length === 0){
            throw new Error(`Key length should not be 0.`)
        }

        //The key format -> isOdd of the y point i think
        let format = key.slice(0,1).toString('hex');
        //Is y bit odd
        let yBit = (format & 0x1) == 0x1;
        //Return the format to the default 0x2
        format = format & (~0x1);
        let pubX;
        let pubY;
        switch(key.length){
            //Key is compressed (not implemented so i will leave it empty)
            case PublicKeyCompressedLength:
            break;
            //Key is uncompressed
            case PublicKeyUncompressedLength:
            
                if(format !== publicKeyCompressedFormat){
                    throw new Error("The format of the key is incorrect!");
                }

                //X point of the public key
                let pubX = key.slice(1,33); 
                //WHERE ARE THE EXTENSION METHODS WHEN YOU NEED THEM :(
                let pubY = this.decompressPoint(pubX, yBit);
                return 
            break;
            default:
            throw new Error(`KeyLength should be eihter 
                            ${PublicKeyUncompressedLength} or ${PublicKeyUncompressedLength}`)
        }

        if(pubX === undefined || pubY === undefined){
            throw new Error("The key couldn't be parsed.");
        }

        // P represents the {Zp} finite field over which secp256k1 is mapped
        let primeField = parseInt(Secp256k1PointP, 16);
        if(pubX >= primeField || pubY >= primeField){
            throw new Error("Invalid curve coordinates " +
                            "~they exceed the curve order, which is impossible for normal key.");
        }

        return {x: pubX, y: pubY};

    }

    /**
     * paddedAppend appends src to dest and adds padding of "size"
     * to the source if its size is smaller
     * @param {*} size - padding size
     * @param {*} src - source to append
     * @param {*} dest - destination to append to
     */
    paddedAppend(size, dest, src) {

        var source = src;
        var delta = src.length - size;
        if (delta > 0) source = Buffer.concat([Buffer.from('00'.repeat(delta), 'hex'), source]);

        return Buffer.concat([dest, source]);
    }

    /**
     * Decompress point expands a 33byte compressed key into
     * 65 byte point on the curve
     * It uses sqrtModPrime(x^3 + secp256k1.B, secp256k1.P)
     * @param {*} x - Public key x coordinate
     * @param {*} yBit - Is the y point odd @type boolean
     */
    decompressPoint(x, yBit){



    }

}

module.exports = ExtendedKey;