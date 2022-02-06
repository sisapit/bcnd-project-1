const { Blockchain } = require('../src/blockchain.js');
const { Block } = require('../src/block.js');
const hex2ascii = require('hex2ascii');

// https://jestjs.io/docs/expect

describe('Blockchain constructor', function () {
    let blockchain;
    beforeEach(() => {
        blockchain = new Blockchain();
    })

    it('constructs blockchain', () => {
        expect(blockchain).not.toBeNull();
        expect(blockchain).toBeDefined();
    });

    it('constructs empty blockchain with height 0', () => {
        expect(blockchain.height).toBe(0);
    });

    it('constructs "empty" blockchain except for genesis block', () => {
        expect(blockchain.chain.length).toBe(1);
        let genesis = blockchain.chain[0]
        expect(genesis.height).toBe(0);
        expect(genesis.time.length).toBeGreaterThan(9);
        expect(genesis.previousBlockHash).toBeNull();
        expect(hex2ascii(genesis.body)).toEqual(expect.stringMatching(/genesis/i));
    });
});

describe('Requesting the blockchain for a message', function () {
    const WALLET_ADRESS = '12ckHYRzrP1tdv4jf9mL1mPv5H3E8RFKDf';
    let blockchain, message;
    beforeEach(() => {
        blockchain = new Blockchain();
        // Example: "12ckHYRzrP1tdv4jf9mL1mPv5H3E8RFKDf:1644170760:starRegistry"
        message = blockchain.requestMessageOwnershipVerification(WALLET_ADRESS);
    })

    it('eventually resolves with a message', () => {
        expect(message).toBeTruthy();
        expect(typeof message).toBe('object');
        return expect(message).resolves.toEqual(expect.stringMatching(/:starRegistry$/));
    });

    it('returns a promise that resolves with a message', () => {
        message.then(m => {
            expect(m).toBeTruthy();
            expect(typeof m).toBe('string');
            expect(m).toEqual(expect.stringMatching(/:starRegistry$/));
        })
    });
});

describe('Star submission', function () {
    const WALLET_ADRESS = '12ckHYRzrP1tdv4jf9mL1mPv5H3E8RFKDf';
    // Time travel - fake a message with timestamp "Sat Oct 01 2033 12:30:00 GMT+0200" coming from future.
    const MESSAGE = '12ckHYRzrP1tdv4jf9mL1mPv5H3E8RFKDf:2011775400:starRegistry';
    // Signing MESSAGE with WALLET_ADDRESS resolves the following signature:
    let SIGNATURE = 'IGxEyUnyf3W3ZhmjlUYv4gbabKkiJzJirWs49ZtxJkb+I2FbLiw/e/bfxYtMzkUkoES795ZvJR8ortSGYrOv92s=';
    const STAR = {
        dec: "68° 52' 56.9",
        ra: "16h 29m 1.0s",
        story: "Hello star! :-)"
    };
    let blockchain;

    beforeEach(() => {
        blockchain = new Blockchain();
    })

    it('eventually resolves with new star in blockchain', async () => {
        expect(blockchain.submitStar(WALLET_ADRESS, MESSAGE, SIGNATURE, STAR)).resolves;
        expect(blockchain.getChainHeight()).resolves.toBe(1);
    })

    it('of 3 stars eventually resolves with all new stars in blockchain', async () => {
        expect(blockchain.submitStar(WALLET_ADRESS, MESSAGE, SIGNATURE, STAR)).resolves;
        expect(blockchain.submitStar(WALLET_ADRESS, MESSAGE, SIGNATURE, STAR)).resolves;
        expect(blockchain.submitStar(WALLET_ADRESS, MESSAGE, SIGNATURE, STAR)).resolves;
        expect(blockchain.getChainHeight()).resolves.toBe(3);
    })
});