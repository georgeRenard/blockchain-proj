const Crypto = require('crypto-js');
const Base58 = require('bs58');
const EC = require('elliptic').ec
const secp256k1 = new EC('secp256k1');
const BigNumber = require('bn.js');

const PublicKeyCompressedLength = 33;
const PublicKeyUncompressedLength = 65;
const publicKeyCompressedFormat = 0x2;

const Secp256k1PointP = "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F";

const HardenedKeyStart = 0x80000000
//max derivation depth ~ i don't need more for this project
const MaxDerivationDepth = 32;

//Version is appended to the key
//MainNetVersion
//xpriv and xpub
const HDPrivateKeyID = '0x0488ade4';
const HDPublicKeyID = '0x0488b21e';

const HDPublicKeyHashAddressID = "0x00";

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
     * Derive child key is a derivation schedule for extended public 
     * and private keys. It allows you to derive multiple child public
     * and private keys. They can be Hardened or normal as indicated by
     * the index passed
     * The keys between 0 (inclusive) and 0x80000000 (exclusive) are normal
     * and those between 2^31 and 2^32 - 1 are Hardened
     * @link https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
     * 
     * @param {*} index - child index, must be a valid unsigned integer
     * 
     * @throws Error if you try to derive Hardened child key from extended public key
     */
    deriveChild(index) {

        if (index < 0 || index > ((0x80000000 * 2) - 1)) {
            throw new Error("Index out of range. The index should be between 0 and int.MaxValue");
        }
        if (this._depth > MaxDerivationDepth) {
            throw new Error("Max derivation depth was exceeded");
        }

        //Check if the derivation is from public extended 
        //to HARDENED child public key
        var isHardened = index >= HardenedKeyStart;
        if (isHardened && !this._isPrivate) {
            throw new Error("Cannot derive public hardened key from extended parent public key.");
        }

        var keyLen = 33;
        var data;

        //ser256(k) is the BigEndian 32byte sequence of the current parent key
        //ser(i) are the Hex Encoded BigEndian 4 bytes of the index 
        if (isHardened) {
            //This is possible only if the current extended key is private
            //The format for this type of child key specified by BIP32
            //is 0x00 + ser256(k) + ser(i) ~ 1 byte + 32 bytes + 4 bytes ~ 37 bytes
            data = Buffer.concat([new Buffer(1), new Buffer(this._key, 'hex')]);
        } else {
            //The current parent key is eihter private or public extended
            //The format for this type of child key
            //is serP(k) + ser(i) ~ 33 bytes + 4 bytes ~ 37 bytes
            var secp256CompressedPublicKey = this.pubKeyBytes();
            data = Buffer.from(secp256CompressedPublicKey, 'hex');
        }

        // Ser32(i) is the index turned into hex encoded
        // BigEndian bytes buffer
        // It must be appended to the childKeyDataBuffer
        var ser32 = new Buffer(4);
        ser32.fill(0);
        ser32.writeUInt32BE(index);
        data = Buffer.concat([data, ser32]).toString('hex');

        // Derive Hmac from the chaincode and the child
        var hmac = Crypto.HmacSHA512(this._chainCode, data);
        var l = hmac.toString();

        // Left side is the newly derived childkey part
        var lL = l.slice(0, 64);
        // Right side is the newly derived chain code
        var lR = l.slice(64, 128);
        //if it doesn't throw error just continue
        this.isOutOfCurveOrder(lL);

        var childIsPrivate;
        var childKey;
        if (this._isPrivate) {
            //Format is ser256(lL) + k
            //Order of the curve
            var n = new BigNumber(secp256k1.n, 16, 'be');
            var intermediateKey = new BigNumber(lL, 16, 'be');
            var parentKey = new BigNumber(this._key, 16, 'be');
            var result = intermediateKey.add(parentKey);
            childKey = result.mod(n).toString('hex');

            childIsPrivate = true;
        } else {
            //Scalar multiplication ~ deriving new point on the curve
            var G = secp256k1.g;
            var childPoint = G.mul(lL);
            //Turning the parent public key into a point (uncompress)
            var parentPoint = this.parseKey(this._key);
            childKey = childPoint.add(parentPoint);

            childKey = this.compressKey(childKey);
        }
        //Creating the parent fingerprint ~ the first 4 bytes from RIPEMD160(SHA256(pubKey))
        var shaPublicKeyBytes = Crypto.SHA256(this.pubKeyBytes()).toString(Crypto.enc.Hex);
        var ripeShaPublicKeyBytes = Crypto.RIPEMD160(this.pubKeyBytes()).toString(Crypto.enc.Hex);
        //Parent fingerprint for the child ~ ensures that this child was derived from this parent
        var parentFP = '0x' + ripeShaPublicKeyBytes.slice(0, 8);

        return new ExtendedKey(this._version, childKey, lR, parentFP,
            this._depth + 1, index, childIsPrivate);
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
            Buffer.concat([Buffer.from(this._version.slice(2, ), 'hex'),
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
            serializedBytes = this.paddedAppend(32, serializedBytes,
                Buffer.from(this.pubKeyBytes(), 'hex'));
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
    pubKeyBytes(key) {

        if (!this._isPrivate) return this._key;

        var G = secp256k1.g;
        var pubKeyPoint = G.mul(this._key);
        //Compressing the key
        return this.compressKey(pubKeyPoint);
    }

    /**
     * Parse public key determines whether the passed in key object
     * is valid point on the curve (x: x, y: y)
     * It supports compressed and uncompressed public keys
     * 
     * @param {*} key - The public key you are trying to validate
     */
    parsePublicKey(key) {


        if (key.length === 0) {
            throw new Error(`Key length should not be 0.`)
        }

        //The key format -> isOdd of the y point i think
        let format = key.slice(0, 1).toString('hex');
        //Is y bit odd
        let yBit = (format & 0x1) == 0x1;
        //Return the format to the default 0x2
        format = format & (~0x1);
        let pubX;
        let pubY;
        switch (key.length) {
            //Key is compressed (not implemented so i will leave it empty)
            case PublicKeyCompressedLength:
                if (format !== publicKeyCompressedFormat) {
                    throw new Error("The format of the key is incorrect!");
                }

                //X point of the public key
                let pubX = key.slice(1, 33);
                //WHERE ARE THE EXTENSION METHODS WHEN YOU NEED THEM :(
                let point = this.decompressPoint(pubX, yBit);
                return point;
                //Key is uncompressed
            case PublicKeyUncompressedLength:
                break;
            default:
                throw new Error(`KeyLength should be eihter 
                            ${PublicKeyUncompressedLength} or ${PublicKeyUncompressedLength}`)
        }

        if (pubX === undefined || pubY === undefined) {
            throw new Error("The key couldn't be parsed.");
        }

        // P represents the {Zp} finite field over which secp256k1 is mapped
        let primeField = parseInt(Secp256k1PointP, 16);
        if (pubX >= primeField || pubY >= primeField) {
            throw new Error("Invalid curve coordinates " +
                "~they exceed the curve order, which is impossible for normal key.");
        }

        return {
            x: pubX,
            y: pubY
        };

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
        var delta = size - source.length;
        if (delta > 0) source = Buffer.concat([new Buffer(delta), source]);
        var buffer = Buffer.concat([dest, source]);
        return buffer;
    }

    /**
     * Decompress point expands a 33byte compressed key into
     * 65 byte point on the curve
     * It uses sqrtModPrime(x^3 + secp256k1.B, secp256k1.P)
     * @param {*} x - Public key x coordinate
     * @param {*} yBit - Is the y point parity odd @type number
     */
    decompressPoint(x, yBit) {
        return ecp.curve.pointFromX(x, yBit);
    }

    /**
     * Utility method which checks whether the passed in key is valid
     * and on the elliptic curve. If its zero,less or bigger,equal to curve order
     * it is not valid. There is extremely low chance but there is still chance
     * that the generated key is not valid. ~~@damn probablistic algorithms
     * @param {*} key - The key you want to check for curve validity
     * @returns true
     * 
     * @throws Error, if 
     */
    isOutOfCurveOrder(key) {
        var curveOrder = secp256k1.n.toString('hex');
        curveOrder = parseInt(curveOrder, 16);

        var parsedKey = parseInt(key, 16);
        if (parsedKey <= 0 || parsedKey >= curveOrder) {
            throw new Error("Key generation failed. " +
                "Please, try again (the failure chance is extremely low)");
        }

        return true;
    }

    /**
     * Compresses the passed publci key point
     * From Point{x, y} it becomes a compressed 33 byte public key
     * It can be later decompressed with the following equation
     * Y^2 = X^3 + B mod n
     * Y = Sqrt(x^3 + b) mod n
     * Where n is the order of the curve
     * @see elliptic - Elliptic provides nefty way for decompressing
     * @example
     * 
     * const EC = require('elliptic').ec;
     * var secp256k1 = new EC('secp256k1');
     * 
     * decompressedPoint = secp256k1.curve.pointFromX(x, parity);
     * 
     * @param {*} point 
     */
    compressKey(point) {

        const pubKeyCompressed = 0x2;

        var isOddPointY = point.y % 2 != 0
        var format = pubKeyCompressed;
        if (isOddPointY) format |= 0x1;

        var formatBuffer = Buffer.from('0' + format, 'hex');
        var buffer = Buffer.from(point.x.toString('hex'), 'hex');

        return this.paddedAppend(32, formatBuffer, buffer).toString('hex');
    }

    /** 
     * This function derives a new public
     * ExtendedKey from the current private extended key
     * which you can use for generating new public extended keys
     * 
     * @returns ExtendedKey / public if this is a private extended key
     * / else returns this instance
     * 
     */
    deriveExtendedPublicKey() {
        // Already an extended public key.
        if (!this._isPrivate) {
            return this;
        }

        // Convert it to an extended public key.  The key for the new extended
        // key will simply be the pubkey of the current extended private key.
        //
        // This is the function N((k,c)) -> (K, c) from [BIP32].
        return new ExtendedKey(HDPublicKeyID, this.pubKeyBytes(), this._chainCode, this._parentFP,
            this._depth, this._childNum, false);
    }


    /**
     * Static method which provides way to convert a public extended key
     * into payment address.
     * @param {*} key - the public key which you want to convert to standard address
     */
    static toAddress(key){

        if(key === undefined || !(key instanceof ExtendedKey)){
            throw new Error("The key argument should be of type ExtendedKey");
        }

        let keyHash = Crypto.SHA256(key.pubKeyBytes()).toString();
        keyHash = Crypto.RIPEMD160(keyHash).toString();

        return {
            netId: HDPublicKeyHashAddressID,
            hash: keyHash
        };

    }

}

module.exports = ExtendedKey;