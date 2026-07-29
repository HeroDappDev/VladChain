"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chain = exports.VladChain = void 0;
const database_1 = require("./database");
const generateUniqueNames = () => {
    const names = [
        'alice', 'ayra', 'jarvis', 'cortana', 'lumina', 'nix',
        'grover', 'nova', 'zen', 'echo', 'pulse', 'flux',
        'orbit', 'stellar', 'cosmic', 'nebula', 'quasar', 'pulsar',
        'galaxy', 'universe'
    ];
    return names.sort(() => Math.random() - 0.5);
};
class VladChain {
    constructor() {
        this.blocks = [];
        this.accounts = {};
        this.txPool = [];
        this.transactionHistory = [];
        this.lastBlockTime = 0;
        this.blockTimeMs = 400; // Solana-like: ~400ms block time
        this.transactionFee = 0.001; // 0.001 VLADCHAIN fee per transaction
        // Epoch & validator performance - Solana-like parameters
        this.epoch = 1;
        this.slotsPerEpoch = 432000; // Solana: ~432k slots per epoch (~2-3 days)
        this.currentSlot = 265000; // Will be loaded from database
        this.validatorStats = {};
        this.currentSlot = this.loadPersistedSlot();
        this.initializeNetwork();
    }
    loadPersistedSlot() {
        try {
            // Try to load from database first (most reliable for Railway)
            const slotData = database_1.db.getSlotData();
            if (slotData && slotData.currentSlot && !isNaN(Number(slotData.currentSlot))) {
                console.log(`Loading persisted slot from database: ${slotData.currentSlot}`);
                this.epoch = slotData.epoch;
                return Number(slotData.currentSlot);
            }
        }
        catch (error) {
            console.log('Could not load slot from database:', error.message);
        }
        // Try to load from environment variable as backup
        const envSlot = process.env.CURRENT_SLOT;
        if (envSlot && !isNaN(Number(envSlot))) {
            console.log(`Loading persisted slot from env: ${envSlot}`);
            return Number(envSlot);
        }
        // Fallback to a reasonable starting point
        const fallbackSlot = 265000; // Start from where you mentioned it was
        console.log(`Using fallback slot: ${fallbackSlot}`);
        return fallbackSlot;
    }
    persistSlot() {
        try {
            // Save to database (persistent across Railway builds)
            database_1.db.saveSlotData({
                currentSlot: this.currentSlot,
                epoch: this.epoch,
                lastUpdated: Date.now()
            });
            console.log(`Persisted slot ${this.currentSlot} to database`);
        }
        catch (error) {
            console.log('Could not persist slot to database:', error.message);
            // Fallback to environment variable (less reliable but better than nothing)
            try {
                process.env.CURRENT_SLOT = this.currentSlot.toString();
                console.log(`Set environment variable CURRENT_SLOT to ${this.currentSlot}`);
            }
            catch (envError) {
                console.log('Could not set environment variable:', envError.message);
            }
        }
    }
    initializeNetwork() {
        const uniqueNames = generateUniqueNames();
        // Initialize 20 accounts with random balances
        uniqueNames.forEach((name, index) => {
            const balance = Math.floor(Math.random() * 5000) + 100; // Random balance between 100-5100 VLADCHAIN
            this.accounts[name] = { address: name, balance };
        });
        // Only set up validator stats for the 6 AI validators (not all accounts)
        const aiValidators = ['alice', 'ayra', 'jarvis', 'cortana', 'lumina', 'nix'];
        aiValidators.forEach(validator => {
            this.validatorStats[validator] = {
                produced: Math.floor(Math.random() * 50000) + 10000, // Realistic Solana-like stats
                missed: Math.floor(Math.random() * 1000) + 100,
                totalSlots: Math.floor(Math.random() * 100000) + 50000 // Realistic total slots assigned
            };
        });
        console.log(`VladChain initialized with ${uniqueNames.length} unique accounts`);
    }
    getAccounts() { return Object.values(this.accounts); }
    getBalance(address) { return this.accounts[address]?.balance ?? 0; }
    getBlocks() { return this.blocks.slice(-50); } // Show last 50 blocks (realistic for explorer)
    getAllBlocks() { return this.blocks; } // Get all blocks for comprehensive view
    getPendingTxs() { return this.txPool; }
    getTransactionHistory() { return this.transactionHistory.slice(-100); } // Last 100 transactions (realistic for explorer)
    getValidators() {
        // Only return the 6 AI validators, not all accounts
        return ['alice', 'ayra', 'jarvis', 'cortana', 'lumina', 'nix'];
    }
    getEpoch() { return { epoch: this.epoch, slot: this.currentSlot, nextEpochAt: this.slotsPerEpoch }; }
    getValidatorStats() {
        const stats = { ...this.validatorStats };
        // Calculate performance percentages
        for (const validator in stats) {
            const stat = stats[validator];
            if (stat.totalSlots > 0) {
                stat.performance = Math.round(((stat.produced - stat.missed) / stat.totalSlots) * 100);
            }
            else {
                stat.performance = 0;
            }
        }
        return stats;
    }
    generateTxHash() {
        return Math.random().toString(36).substr(2, 32).toUpperCase();
    }
    sendTx(from, to, amount) {
        if (!this.accounts[from] || !this.accounts[to] || isNaN(amount) || amount <= 0)
            return false;
        const totalCost = amount + this.transactionFee;
        if (this.accounts[from].balance < totalCost)
            return false;
        this.accounts[from].balance -= totalCost;
        this.accounts[to].balance += amount;
        const tx = {
            from,
            to,
            amount,
            timestamp: Date.now(),
            hash: this.generateTxHash(),
            fee: this.transactionFee
        };
        this.txPool.push(tx);
        this.transactionHistory.push(tx);
        return tx;
    }
    createAccount(address) {
        if (this.accounts[address])
            return false;
        this.accounts[address] = { address, balance: 0 };
        // Don't add validator stats for user-created accounts
        return true;
    }
    faucet(address, amount, faucetLimits) {
        const now = Date.now();
        if (!this.accounts[address])
            return { error: 'Account does not exist' };
        if (!faucetLimits[address] || (now - faucetLimits[address]) > 30000) {
            this.accounts[address].balance += amount;
            faucetLimits[address] = now;
            // Add faucet transaction to history
            const faucetTx = {
                from: 'faucet',
                to: address,
                amount: amount,
                timestamp: now,
                hash: this.generateTxHash(),
                fee: 0
            };
            this.transactionHistory.push(faucetTx);
            return { ok: true };
        }
        else {
            return { error: 'Faucet cooldown: try again later' };
        }
    }
    produceBlock(validator) {
        const txs = this.txPool.splice(0, this.txPool.length);
        const block = {
            height: this.blocks.length + 1,
            producer: validator,
            transactions: txs,
            timestamp: Date.now(),
            hash: this.generateTxHash()
        };
        this.blocks.push(block);
        this.lastBlockTime = block.timestamp;
        // Block reward and transaction fees
        if (this.accounts[validator]) {
            const blockReward = 10;
            const totalFees = txs.reduce((sum, tx) => sum + (tx.fee || 0), 0);
            this.accounts[validator].balance += blockReward + totalFees;
        }
        // Update epoch and stats:
        if (this.validatorStats[validator]) {
            this.validatorStats[validator].produced++;
            this.validatorStats[validator].totalSlots++;
        }
        // Simulate missed blocks for other validators (realistic)
        const aiValidators = ['alice', 'ayra', 'jarvis', 'cortana', 'lumina', 'nix'];
        aiValidators.forEach(v => {
            if (v !== validator && this.validatorStats[v]) {
                // 5% chance of missing a block (realistic)
                if (Math.random() < 0.05) {
                    this.validatorStats[v].missed++;
                    this.validatorStats[v].totalSlots++;
                }
            }
        });
        this.currentSlot++;
        // Persist the slot count every 10 slots to avoid too many writes
        if (this.currentSlot % 10 === 0) {
            this.persistSlot();
        }
        if (this.currentSlot >= this.slotsPerEpoch) {
            this.nextEpoch();
        }
        return block;
    }
    nextEpoch() {
        this.epoch++;
        this.currentSlot = 0;
        console.log(`Epoch ${this.epoch} started!`);
        // Update stats for new epoch (realistic)
        for (const v of Object.keys(this.validatorStats)) {
            const currentStats = this.validatorStats[v];
            this.validatorStats[v] = {
                produced: currentStats.produced,
                missed: currentStats.missed,
                totalSlots: currentStats.totalSlots + Math.floor(Math.random() * 20000) + 10000 // Realistic slots for next epoch
            };
        }
    }
    // Generate random transactions continuously
    generateRandomTransaction() {
        const accountNames = Object.keys(this.accounts);
        if (accountNames.length < 2)
            return;
        const from = accountNames[Math.floor(Math.random() * accountNames.length)];
        const to = accountNames[Math.floor(Math.random() * accountNames.length)];
        if (from === to)
            return; // Skip self-transfers for random generation
        const amount = Math.floor(Math.random() * 100) + 1; // Random amount 1-100 VLADCHAIN
        // Only send if sender has enough balance
        if (this.accounts[from].balance >= amount + this.transactionFee) {
            this.sendTx(from, to, amount);
        }
    }
    // Generate Solana-style address ending with VLADCHAIN
    generateSolanaAddress() {
        // Generate 32 random bytes
        const bytes = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
            bytes[i] = Math.floor(Math.random() * 256);
        }
        // Convert to base58 using simplified algorithm
        let num = 0n;
        for (let i = 0; i < bytes.length; i++) {
            num = num * 256n + BigInt(bytes[i]);
        }
        const base58chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        let result = '';
        while (num > 0) {
            const remainder = Number(num % 58n);
            result = base58chars[remainder] + result;
            num = num / 58n;
        }
        // Ensure minimum length and that address ends with "VLADCHAIN" for Vlad Wallet App compatibility
        if (result.length < 39) {
            result = result.padStart(39, '1');
        }
        // Force address to end with VLADCHAIN (last 5 characters)
        return result.substring(0, 35) + 'VLADCHAIN';
    }
    // Generate 12-word BIP39-compatible mnemonic phrase
    generateMnemonic() {
        const words = [
            'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse',
            'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act',
            'action', 'actor', 'actress', 'actual', 'adapt', 'add', 'addict', 'address', 'adjust', 'admit',
            'adult', 'advance', 'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent',
            'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album', 'alcohol', 'alert',
            'alien', 'all', 'alley', 'allow', 'almost', 'alone', 'alpha', 'already', 'also', 'alter',
            'always', 'amateur', 'amazing', 'among', 'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger',
            'angle', 'angry', 'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna', 'antique',
            'anxiety', 'any', 'apart', 'apology', 'appear', 'apple', 'approve', 'april', 'arch', 'arctic',
            'area', 'arena', 'argue', 'arm', 'armed', 'armor', 'army', 'around', 'arrange', 'arrest',
            'arrive', 'arrow', 'art', 'artefact', 'artist', 'artwork', 'ask', 'aspect', 'assault', 'asset',
            'assist', 'assume', 'asthma', 'athlete', 'atom', 'attack', 'attend', 'attitude', 'attract', 'auction',
            'audit', 'august', 'aunt', 'author', 'auto', 'autumn', 'average', 'avocado', 'avoid', 'awake',
            'aware', 'away', 'awesome', 'awful', 'awkward', 'axis', 'baby', 'bachelor', 'bacon', 'badge',
            'bag', 'balance', 'balcony', 'ball', 'bamboo', 'banana', 'banner', 'bar', 'barely', 'bargain',
            'barrel', 'base', 'basic', 'basket', 'battle', 'beach', 'bean', 'beauty', 'because', 'become',
            'beef', 'before', 'begin', 'behave', 'behind', 'believe', 'below', 'belt', 'bench', 'benefit',
            'best', 'betray', 'better', 'between', 'beyond', 'bicycle', 'bid', 'bike', 'bind', 'biology',
            'bird', 'birth', 'bitter', 'black', 'blade', 'blame', 'blanket', 'blast', 'bleak', 'bless',
            'blind', 'blood', 'blossom', 'blow', 'blue', 'blur', 'blush', 'board'
        ];
        // Generate exactly 12 words
        const mnemonic = [];
        for (let i = 0; i < 12; i++) {
            const randomIndex = Math.floor(Math.random() * words.length);
            mnemonic.push(words[randomIndex]);
        }
        return mnemonic.join(' ');
    }
    // Generate VLADCHAIN wallet with 12-word recovery phrase
    generateWallet() {
        const address = this.generateSolanaAddress();
        // Create the account
        const created = this.createAccount(address);
        if (created) {
            const mnemonic = this.generateMnemonic();
            // Store wallet and mnemonic in database permanently
            const storageResult = database_1.db.storeWallet(address, mnemonic, 'VLADCHAIN');
            if (!storageResult.success) {
                console.error('Failed to store VLADCHAIN wallet:', storageResult.error);
                return { error: 'Failed to store wallet permanently', success: false };
            }
            console.log(`🔧 Stored VLADCHAIN wallet: ${address.substring(0, 8)}...`);
            return {
                wallet: address,
                mnemonic: mnemonic,
                success: true
            };
        }
        else {
            // If account already exists, try again
            return this.generateWallet();
        }
    }
}
exports.VladChain = VladChain;
exports.chain = new VladChain();
