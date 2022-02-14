/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create your own private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message` 
 *  to verify a message signature. The chain is stored in the array
 *  `this.chain = [];`. Of course each time you run the application the chain will be empty because and array
 *  isn't a persisten storage method.
 *  
 */

const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./block.js');
const bitcoinMessage = require('bitcoinjs-message');
const util = require('util');
const { resourceLimits } = require('worker_threads');

class Blockchain {

    /**
     * Constructor of the class, you will need to setup your chain array and the height
     * of your chain (the length of your chain array).
     * Also everytime you create a Blockchain class you will need to initialized the chain creating
     * the Genesis Block.
     * The methods in this class will always return a Promise to allow client applications or
     * other backends to call asynchronous functions.
     */
    constructor() {
        this.chain = [];
        this.height = -1;
        this.initializeChain();
    }

    /**
     * This method will check for the height of the chain and if there isn't a Genesis Block it will create it.
     * You should use the `addBlock(block)` to create the Genesis Block
     * Passing as a data `{data: 'Genesis Block'}`
     */
    async initializeChain() {
        if (this.height === -1) {
            let block = new BlockClass.Block({ data: 'Genesis Block' });
            await this._addBlock(block);
        }
    }

    /**
     * Utility method that return a Promise that will resolve with the height of the chain
     */
    getChainHeight() {
        return new Promise((resolve, reject) => {
            resolve(this.height);
        });
    }

    /**
     * _addBlock(block) will store a block in the chain
     * @param {*} block 
     * The method will return a Promise that will resolve with the block added
     * or reject if an error happen during the execution.
     * You will need to check for the height to assign the `previousBlockHash`,
     * assign the `timestamp` and the correct `height`...At the end you need to 
     * create the `block hash` and push the block into the chain array. Don't for get 
     * to update the `this.height`
     * Note: the symbol `_` in the method name indicates in the javascript convention 
     * that this method is a private method. 
     */
    _addBlock(block) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            try {
                // Execute the validateChain() function every time a block is added.
                // if(!self.validateChain()) throw("EChainInvalid, Chain is invalid");
                // CAUTION: The result of self.validateChain() is a promise and it is always truthy. So !self.validateChain() always 
                // provides false, even in case of an invalid blockchain!
                // if (! await self.validateChain().length) throw ("EChainInvalid, Validation of blockchain provided errors");
                let errors = await self.validateChain();
                if (errors.length > 0)
                    throw ("EChainInvalid, Validation of blockchain provided errors");
                // Check for the height to assign the `previousBlockHash`.
                if (self.height >= 0) {
                    block.previousBlockHash = self.chain[self.height].hash;
                } else {
                    block.previousBlockHash = null;
                }
                // Assign the `timestamp` and the correct `height`.
                block.time = new Date().getTime().toString().slice(0, -3);
                block.height = self.height + 1;
                // Create the `block hash` and push the block into the chain array.
                block.createHash();
                self.chain.push(block);
                // Update the `this.height`
                self.height++;
                // Return a Promise that will resolve with the block added.
                resolve(block);
            } catch (e) {
                // Return a Promise that will reject if an error happens during the execution.
                reject(e);
            }
        });
    }

    /**
     * The requestMessageOwnershipVerification(address) method
     * will allow you to request a message that you will use to
     * sign it with your Bitcoin Wallet (Electrum or Bitcoin Core)
     * This is the first step before submit your Block.
     * The method returns a Promise that will resolve with the message to be signed.
     * @param {*} address 
     */
    requestMessageOwnershipVerification(wallet_address) {
        // The user will request the application to send a message to be signed using a Wallet and 
        // in this way verify the ownership over the wallet address. 
        return new Promise((resolve) => {
            // The message format will be: `<WALLET_ADRESS>:${new Date().getTime().toString().slice(0,-3)}:starRegistry`;
            let message_to_be_signed = `${wallet_address}:${new Date().getTime().toString().slice(0, -3)}:starRegistry`;
            resolve(message_to_be_signed);
        });
    }

    /**
     * The submitStar(address, message, signature, star) method
     * will allow users to register a new Block with the star object
     * into the chain. This method will resolve with the Block added or
     * reject with an error.
     * Algorithm steps:
     * 1. Get the time from the message sent as a parameter example: `parseInt(message.split(':')[1])`
     * 2. Get the current time: `let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));`
     * 3. Check if the time elapsed is less than 5 minutes
     * 4. Veify the message with wallet address and signature: `bitcoinMessage.verify(message, address, signature)`
     * 5. Create the block and add it to the chain
     * 6. Resolve with the block added.
     * @param {*} address 
     * @param {*} message 
     * @param {*} signature 
     * @param {*} star 
     */
    submitStar(address, message, signature, star) {
        const FIVE_MIN = 5 * 60;
        let self = this;
        return new Promise(async (resolve, reject) => {
            try {
                let time = parseInt(message.split(':')[1]);
                let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));
                if (currentTime - time > FIVE_MIN) throw 'EOutdated, Message is outdated';
                if (!bitcoinMessage.verify(message, address, signature, null, true)) throw 'EVerification, Verification failed';
                // Make sure the blockchain knows who owned each star.
                let block = new BlockClass.Block({ owner: address, star: star });
                await self._addBlock(block);
                resolve(block);
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block
     *  with the hash passed as a parameter.
     * Search on the chain array for the block that has the hash.
     * @param {*} hash 
     */
    getBlockByHash(hash) {
        let self = this;
        return new Promise((resolve, reject) => {
            // Caution: ==/=== comparison is not enough, because hashes could be equal, although being different objects!
            // let found = self.chain.filter(b => b.hash == hash);
            let found = self.chain.filter(b => util.isDeepStrictEqual(b.hash, hash));
            if (found.length === 1)
                resolve(found[0])
            else if (found.length === 0)
                reject('No block found for hash')
            else
                reject('More than one block found for hash')
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block object 
     * with the height equal to the parameter `height`
     * @param {*} height 
     */
    getBlockByHeight(height) {
        let self = this;
        return new Promise((resolve, reject) => {
            let block = self.chain.filter(p => p.height === height)[0];
            if (block) {
                resolve(block);
            } else {
                resolve(null);
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with an array of Stars objects existing in the chain 
     * and are belongs to the owner with the wallet address passed as parameter.
     * Remember the star should be returned decoded.
     * @param {*} address 
     */
    getStarsByWalletAddress(address) {
        let self = this;
        let stars = [];
        return new Promise((resolve, reject) => {
            // Caution: self.chain.filter(...) didn't work here, and I coulnd't figure out why. :-(
            self.chain.forEach(async b => {
                try {
                    let data = await b.getBData();
                    if (data.hasOwnProperty('owner') && data.owner == address)
                        stars.push(data);
                } catch (e) {
                    // Ignore exception.
                }
            });
            resolve(stars);
        });
    }

    /**
     * This method will return a Promise that will resolve with the list of errors when validating the chain.
     * Steps to validate:
     * 1. You should validate each block using `validateBlock`
     * 2. Each Block should check the with the previousBlockHash
     */
    validateChain() {
        let self = this;
        let errorLog = [];
        return new Promise(async (resolve, reject) => {
            try {
                let previousBlockHash = null;
                self.chain.forEach(async b => {
                    // Validate the block.
                    b.validate().then(r => {
                        if (!r)
                            errorLog.push(`Error: Block at height ${b.height} is invalid.`);
                    })
                    // Check hash of block's predecessor within the blockchain.
                    if (b.height > 0) {
                        if (!b.previousBlockHash)
                            errorLog.push(`Error: Previous hash for block at height ${b.height} is not set.`);
                        else if (!util.isDeepStrictEqual(previousBlockHash, b.previousBlockHash))
                            errorLog.push(`Error: Previous hash for block at height ${b.height} is wrong.`);
                    }
                    previousBlockHash = b.hash;
                });
                resolve(errorLog);
            } catch (e) {
                errorLog.push(e);
                reject(errorLog);
            }
        });
    }

}

module.exports.Blockchain = Blockchain;   