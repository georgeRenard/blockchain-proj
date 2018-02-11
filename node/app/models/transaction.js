class Transaction{
    
    constructor(from, to, amount, timestamp, senderPubKey, signature, hash, blockIndex, success){
        this._from = from;
        this._to = to;
        this._amount = amount;
        this._timestamp = timestamp;
        this._senderPubKey = senderPubKey;
        this._signature = signature;
        this._hash = hash;
        this._blockIndex = blockIndex;
        this._success = success;
    }
    
    
}