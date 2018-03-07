const secp256k1 = new require('elliptic').ec('secp256k1');


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

        var key = secp256k1.fromPublicKey(this.senderPubKey);
        return key.verify(this.hash, this.signature);
    }
    
}