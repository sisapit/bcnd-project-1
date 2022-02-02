const assert = require('assert').strict;
const hex2ascii = require('hex2ascii');
const { Block } = require('../src/block.js');


describe('Block constructor', function () {
    let block = new Block({ amount: 123, currency: 'EUR' });
    it('should construct object', function () {
        assert.ok(block !== null && block !== undefined);
    });
    it('should construct block with height 0', function () {
        assert.equal(block.height, 0);
    });
    it('should construct block with non-empty body', function () {
        assert.ok(block.body.length > 0);
    });
    it('should construct block with body data given', function () {
        assert.equal(hex2ascii(block.body), '{"amount":123,"currency":"EUR"}');
    });
});

describe('Block validator', function () {
    let block = new Block({ amount: 123, currency: 'EUR' });
    it('should recognize newly constructed block as being invalid',
        (done) => {
            block.validate()
                .then(() => done('ERROR: Newly constructed block should not be valid!')) // NOT OK
                .catch(() => done()) // OK - Rejection of promise expected!
        });
});

describe('Block data', function () {
    it('should reject getting genesis block data',
        (done) => {
            let genesis_block = new Block({ amount: 123, currency: 'EUR' });
            genesis_block.getBData()
                .then((d) => { console.error(d); done('ERROR') }) // NOT OK
                .catch((e) => { console.log(e); done() }) // OK        
        });
    it('should return non genesis block data',
        (done) => {
            let block = new Block({ amount: 123, currency: 'EUR' });
            block.height = 1;
            block.getBData()
                .then((d) => { console.log(d); done() }) // OK
                .catch((e) => { console.error(e); done('ERROR') }) // NOT OK
        });

});

// https://javascript.tutorialink.com/mocha-test-false-assert-timeouts/
