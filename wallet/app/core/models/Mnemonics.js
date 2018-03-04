const {
    randomBytes
} = require('crypto');

const Crypto = require('crypto-js');
const MNEMONICS_FILEPATH = "../../../resources/mnemonics.txt";

//Loading the mnemonics.txt file in-memory
//Creating an interface to read the file line by line
var lineReader = require('readline').createInterface({
    input: require('fs').createReadStream(MNEMONICS_FILEPATH)
});


/**
 * Mnemonics generator class
 * 
 * @returns Object containing the generate() function
 * 
 */
var Mnemonics = (function () {

    var wordList = [];
    //Each line gets appended to the wordList
    lineReader.on('line', function (line) {
        wordList.push(line);
    });
    /**
     * Mnemonics count will always be 24 (hardcoded) ~ 8 bits addition
     * 24 * 11 bits
     * Generates 24 pseud-random mnemonic words
     * @returns list of words
     */
    var generateMnemonics = function () {

        //Bytes Buffer obj
        let seedBuffer = randomBytes(32);
        let additionalByte = Crypto.SHA256(seedBuffer).toString(Crypto.enc.Hex);
        //I take the first 2 chars (2 nibbles = 8bits = byte) as checksum
        additionalByte = Buffer.from(additionalByte.slice(0, 2), 'binary');
        //Concat the entropy buffer and the checksum buffer
        var bytesBuffer = Buffer.concat([seedBuffer, additionalByte]);
        //Boolean array
        var binaryArr = [];
        //Buffer length should be 33 (33 bytes)
        for (let i = 0; i < bytesBuffer.length - 1; i++) {
            let byte = bytesBuffer.slice(i, i + 1).toString('hex');
            let deca = parseInt(byte, 16);
            //Turn byte to binary and append to arr
            for (let j = 0; j < 8; j++) {
                //From the most significant byte to the less significant ones
                let bit = (deca & (1 << 7 - j)) != 0;
                binaryArr.push(bit);
            }
        }
        //Check if the binaryArray length is correct
        const requireLengthInBinary = 264;
        if (binaryArr.length != requireLengthInBinary)
            throw Error(`Expected ${requireLengthInBinary} and got ${binaryArr.length}`);
        //This must be a really bad practice....'
        //Have no idea how to await the fileReader
        var mnemonics = [];
        for (let i = 0; i < 264; i += 11) {

            let binaryIndex = binaryArr
                .slice(i, i + 11)
                .map(x => x ? 1 : 0)
                .join('');
            let mnemonicIndex = parseInt(binaryIndex, 2);
            mnemonics.push(wordList[mnemonicIndex]);
        }
        return mnemonics;
    }

    return {
        generate: generateMnemonics
    };
})();

module.exports = Mnemonics;