var assert = require('chai').assert;

var bip32 = require('./bip32');


var keysEqual = function(left, right){

    var version = left._version;
    var keylen = left._key;
    var chaincodelen = left._chainCode;
    var depth = left._depth;
    var childNum = left._childNum;
    var parentFP = left._parentFP;
    var isPrivate = left._isPrivate;

    assert.equal(version, right._version);
    assert.equal(keylen, right._key);
    assert.equal(chaincodelen, right._chainCode);
    assert.equal(depth, right._depth);
    assert.equal(childNum, right._childNum);
    assert.equal(parentFP, right._parentFP);
    assert.equal(isPrivate, right._isPrivate);

}

var keysNotEqual = function(left, right){

    var version = left._version;
    var keylen = left._key;
    var chaincodelen = left._chainCode;
    var depth = left._depth;
    var childNum = left._childNum;
    var parentFP = left._parentFP;
    var isPrivate = left._isPrivate;

    assert.notEqual(keylen, right._key);

}

describe('Bip32 Generator Functionality Test', function(){
    

    describe('#derive()', function(){

        it("should generate master key correctly", function(){

            var wallet = bip32('joro', 'test', 'generator');
            
            var version = "0x0488ade4";
            var keylen = 64;
            var chaincodelen = 64;
            var depth = 0;
            var childNum = 0;
            var parentFP = "0x00000000";

            var masterKey = wallet.derive();

            assert.equal(version, masterKey._version);
            assert.equal(keylen, masterKey._key.length);
            assert.equal(chaincodelen, masterKey._chainCode.length);
            assert.equal(depth, masterKey._depth);
            assert.equal(childNum, masterKey._childNum);
            assert.equal(parentFP, masterKey._parentFP);
            assert.isTrue(masterKey._isPrivate);
        });

        it("should derive equal key every time from the same instance", function(){

            var wallet = bip32('joro', 'test', 'generator');
            var testKey = wallet.derive();
            var masterKey = wallet.derive();

            keysEqual(testKey, masterKey);

        });

        it("should derive different key from instance independent entropy", function(){

            var wallet = bip32('joro', 'test', 'generator');
            var testKey = wallet.derive();

            var masterKey = wallet.derive(true);

            keysNotEqual(testKey, masterKey);

        });

    });

});

describe("Bip32 Loader Functionality Test", function(){

    describe("#deserialize()", function(){

    })

})