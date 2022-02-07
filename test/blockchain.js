const { Blockchain } = require('../src/blockchain.js');
const { Block } = require('../src/block.js');
const hex2ascii = require('hex2ascii');
const CryptoJS = require('crypto-js');
const util = require('util');

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
        try {
            let block = await blockchain.submitStar(WALLET_ADRESS, MESSAGE, SIGNATURE, STAR);
            expect(block).toBeTruthy();
            expect(block.height).toBe(1);

            expect(blockchain.getChainHeight()).resolves.toBe(1);
        } catch (e) {
            throw `Error: ${e}`
        }
    })

    it('of 3 stars eventually resolves with all 3 stars in blockchain', async () => {
        try {
            let block1 = await blockchain.submitStar(WALLET_ADRESS, MESSAGE, SIGNATURE, STAR);
            expect(block1.height).toBe(1);

            let block2 = await blockchain.submitStar(WALLET_ADRESS, MESSAGE, SIGNATURE, STAR);
            expect(block2.height).toBe(2);
            expect(block2.hash.toString(CryptoJS.enc.Hex)).not.toEqual(block1.hash.toString(CryptoJS.enc.Hex));

            let block3 = await blockchain.submitStar(WALLET_ADRESS, MESSAGE, SIGNATURE, STAR);
            expect(block3.height).toBe(3);
            expect(block3.hash.toString(CryptoJS.enc.Hex)).not.toEqual(block1.hash.toString(CryptoJS.enc.Hex));
            expect(block3.hash.toString(CryptoJS.enc.Hex)).not.toEqual(block2.hash.toString(CryptoJS.enc.Hex));

            expect(blockchain.getChainHeight()).resolves.toBe(3);
        } catch (e) {
            throw `Error: ${e}`
        }
    })

    it('add stars that could be found by hash in blockchain', async () => {
        try {
            let hash;
            for (let i = 0; i < 20; i++) {
                let block = await blockchain.submitStar(WALLET_ADRESS, MESSAGE, SIGNATURE, STAR);
                if (i == 16) {
                    // Make a copy of the hash to get an individual hash object instead of a reference to the block's hash within the blockchain.
                    hash = CryptoJS.enc.Hex.parse(block.hash.toString());
                }
            }
            let block = await blockchain.getBlockByHash(hash);
            expect(block).toBeTruthy();
            expect(block.hash.toString(CryptoJS.enc.Hex)).toEqual(hash.toString(CryptoJS.enc.Hex));
        } catch (e) {
            throw `Error: ${e}`
        }
    });

    it('add stars that could be found by wallet address in blockchain', async () => {
        try {
            await blockchain.submitStar(WALLET_ADRESS, MESSAGE, SIGNATURE, STAR);
            await blockchain.submitStar('1KhG78MQHtPxP2c7wPC8AFCor72BziaSSj', '1KhG78MQHtPxP2c7wPC8AFCor72BziaSSj:2011775400:starRegistry', 'IGAzhjctuyjmfS0JzVh8B8DGnlK75mx8otzkNLxP6cRDec08Z8mb+7fJDhQydgTaklc/TccyDdhBscoCqayxOKI=', STAR);
            await blockchain.submitStar('16thM3ZKUekL9VSXDXhxmoiaK2UoJeKTuT', '16thM3ZKUekL9VSXDXhxmoiaK2UoJeKTuT:2011775400:starRegistry', 'HxenXJxOmf42dGaq4scDkQMq24xcM4FjVtYsDXGB+inoD9H3/m4DoCogmSp9f0l863LmH4zBysDx7fNy3jEfvI8=', STAR);
            await blockchain.submitStar(WALLET_ADRESS, MESSAGE, SIGNATURE, STAR);
            await blockchain.submitStar('1KhG78MQHtPxP2c7wPC8AFCor72BziaSSj', '1KhG78MQHtPxP2c7wPC8AFCor72BziaSSj:2011775400:starRegistry', 'IGAzhjctuyjmfS0JzVh8B8DGnlK75mx8otzkNLxP6cRDec08Z8mb+7fJDhQydgTaklc/TccyDdhBscoCqayxOKI=', STAR);
            await blockchain.submitStar('16thM3ZKUekL9VSXDXhxmoiaK2UoJeKTuT', '16thM3ZKUekL9VSXDXhxmoiaK2UoJeKTuT:2011775400:starRegistry', 'HxenXJxOmf42dGaq4scDkQMq24xcM4FjVtYsDXGB+inoD9H3/m4DoCogmSp9f0l863LmH4zBysDx7fNy3jEfvI8=', STAR);
            await blockchain.submitStar('16thM3ZKUekL9VSXDXhxmoiaK2UoJeKTuT', '16thM3ZKUekL9VSXDXhxmoiaK2UoJeKTuT:2011775400:starRegistry', 'HxenXJxOmf42dGaq4scDkQMq24xcM4FjVtYsDXGB+inoD9H3/m4DoCogmSp9f0l863LmH4zBysDx7fNy3jEfvI8=', STAR);
            await blockchain.submitStar(WALLET_ADRESS, MESSAGE, SIGNATURE, STAR);

            let blocks = await blockchain.getStarsByWalletAddress(WALLET_ADRESS);
            expect(blockchain.getChainHeight()).resolves.toBe(8);
            expect(blocks).toBeTruthy();
            expect(blocks.length).toBe(3);
        } catch (e) {
            throw `Error: ${e}`
        }
    });
});