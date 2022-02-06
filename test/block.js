const hex2ascii = require('hex2ascii');
const { Block } = require('../src/block.js');

// https://jestjs.io/docs/expect

describe('Block constructor', function () {
    let block;
    const content = { amount: 333, currency: 'EUR' };
    beforeEach(() => {
        block = new Block(content);
    });

    it('constructs block', () => {
        expect(block).not.toBeNull()
        expect(block).toBeDefined()
    });

    it('constructs genesis block unless otherwise indicated', function () {
        expect(block.height).toEqual(0)
    });

    it('constructs genesis block containing content', function () {
        expect(block.body.length).toBeGreaterThan(0)
    });

    it('constructs block containing a copy of content given', function () {
        expect(JSON.parse(hex2ascii(block.body))).toStrictEqual(content)
        expect(JSON.parse(hex2ascii(block.body))).not.toBe(content)
    });
});

describe('Block validator', function () {
    let block;
    beforeEach(() => {
        block = new Block('Hello world!');
        block.createHash();
    });

    it('recognizes that newly constructed block is valid', () => {
        return expect(block.validate()).resolves.toBeTruthy();
    });

    it('recognizes that empty block is valid', () => {
        block = new Block('');
        block.createHash();
        return expect(block.validate()).resolves.toBeTruthy();
    });

    it('recognizes that null block is valid', () => {
        block = new Block(null);
        block.createHash();
        return expect(block.validate()).resolves.toBeTruthy();
    });

    it('recognizes that incorrectly hashed block is invalid', () => {
        // Flip bits in lowest byte of hash value without updating block content.
        block.hash.words[0] ^= 255
        expect.assertions(1)
        return expect(block.validate()).rejects.toBeTruthy();
    });

    it('recognizes that block with outdated hash is invalid', () => {
        // Change block content without updating body hash.
        block.body = ':-o'
        // block.generateHash();
        expect.assertions(1);
        return expect(block.validate()).rejects.toBeTruthy();
    });
});

describe('Block data', function () {
    let block;
    const content = { amount: 123, currency: 'EUR' };

    beforeEach(() => {
        block = new Block(content);
    });

    it('connot be fetched for genesis block', () => {
        return expect(block.getBData()).rejects.toBeTruthy();
    });

    it('can be fetched for regular block', () => {
        block.height = 4444;
        return expect(block.getBData()).resolves.toBeTruthy();
    });

    it('contains data passed to constructor', () => {
        block.height = 4444;
        return block.getBData().then(d => expect(d).toStrictEqual(content));
    });
});

// https://javascript.tutorialink.com/mocha-test-false-assert-timeouts/
