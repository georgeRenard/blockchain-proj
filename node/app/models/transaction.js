const secp256k1 = new require('elliptic').ec('secp256k1');


const CoinbaseAddress = "0x0000000000000000000000000000000000000000";

/** 
 * @author Georgi Angelov
 * 
 * Transaction class
 * @constructor
 * @param from
 * @param to
 * @param amount
 * @param timestamp
 * @param senderPubKey
 * @param signature
 * @param hash
 * @param blockIndex
 * @param success
*/
class Transaction{
    
    constructor(from, to, amount, timestamp, senderPubKey, signature, hash, blockIndex, success){
        this.from = from;
        this.to = to;
        this.amount = amount;
        this.timestamp = timestamp;
        this.senderPubKey = senderPubKey;
        this.signature = signature;
        this.hash = hash;
        this.blockIndex = blockIndex;
        this.success = success;
    }
    
    validateSignature(){
        this.senderPubKey = {x: this.senderPubKey[0], y: this.senderPubKey[1]};
        var key = secp256k1.keyFromPublic(this.senderPubKey, 'hex');
        return key.verify(this.hash, this.signature);
    }

    static newCoinbaseTo(to, amount){
        return new Transaction(CoinbaseAddress, to,
                50000, new Date().toISOString(), 'Coinbase', 'Coinbase',
                'Coinbase', 0, true);
    }
    
}

module.exports = Transaction;