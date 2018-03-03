class Transaction{
    
    constructor(from, to, amount, timestamp, senderPubKey, signature, hash, blockIndex, success){
        this.from = from;
        this.to = to;
        this._amount = amount;
        this.timestamp = timestamp;
        this.senderPubKey = senderPubKey;
        this.signature = signature;
        this.hash = hash;
        this._blockIndex = blockIndex;
        this._success = success;
    }
    
    
}