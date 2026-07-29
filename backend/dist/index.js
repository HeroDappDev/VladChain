"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const personalities_1 = require("./personalities");
const chain_1 = require("./chain");
const chatlog_1 = require("./chatlog");
const grok_1 = require("./grok");
const multi_agent_router_1 = require("./multi-agent-router");
const gip_router_1 = require("./gip-router");
const gip_system_1 = require("./gip-system");
const rwa_1 = require("./rwa");
dotenv_1.default.config();
// Base58 alphabet for VladChain addresses
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
// Generate VladChain wallet address
function generateSolanaWallet() {
    // Generate 32 random bytes (like VladChain keypair)
    const bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
    }
    // Convert to base58 (simplified version)
    let num = BigInt('0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''));
    let result = '';
    while (num > 0) {
        const remainder = Number(num % 58n);
        result = BASE58_ALPHABET[remainder] + result;
        num = num / 58n;
    }
    // Add leading zeros for padding
    for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
        result = '1' + result;
    }
    // Ensure minimum length of 32 characters
    while (result.length < 32) {
        result = '1' + result;
    }
    // Truncate to 44 characters max (like VladChain)
    return result.substring(0, 44);
}
// Fallback narrative generator when AI is not available
function generateFallbackNarrative(transaction) {
    const { from, to, amount, fee } = transaction;
    // Determine transaction type and context
    let purpose = "transfer";
    let context = "";
    let impact = "";
    if (from === 'faucet') {
        purpose = "faucet distribution";
        context = "New tokens were minted and distributed to support network participation.";
        impact = "This increases the circulating supply and enables new users to participate in the network.";
    }
    else if (to === from) {
        purpose = "self-transfer";
        context = "A transaction sent to the same address, possibly for account verification.";
        impact = "This transaction validates the account's ability to process transactions.";
    }
    else if (amount > 100) {
        purpose = "significant transfer";
        context = "A substantial amount of VLADCHAIN tokens was moved between accounts.";
        impact = "This represents meaningful economic activity on the network.";
    }
    else {
        purpose = "standard transfer";
        context = "A routine transfer of VLADCHAIN tokens between network participants.";
        impact = "This maintains the flow of value across the AI-run blockchain network.";
    }
    return `This transaction represents a ${purpose} of ${amount} VLADCHAIN tokens from ${from} to ${to}. ${context} ${impact} The transaction includes a fee of ${fee || 0} VLADCHAIN, which compensates the AI validators for processing this transaction and maintaining network security.`;
}
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api/personality', personalities_1.personalitiesRouter);
app.use('/api/chatlog', chatlog_1.chatlogRouter);
app.use('/api/multi-agent', multi_agent_router_1.multiAgentRouter);
app.use('/api/gip', gip_router_1.gipRouter);
app.use('/api/rwa', rwa_1.rwaRouter);
// Initialize GIP system with realistic blockchain improvement proposals
gip_system_1.gipSystem.initializeWithRealisticGIPs().then(() => {
    console.log('GIP system initialized with realistic blockchain improvement proposals');
}).catch(error => {
    console.error('Error initializing GIP system:', error);
});
// Ensure Explorer API endpoints always live and seeded
defineExplorerEndpoints(app, chain_1.chain);
function defineExplorerEndpoints(app, chain) {
    app.get('/api/blocks', (_req, res) => {
        res.json(chain.getBlocks());
    });
    app.get('/api/all-blocks', (_req, res) => {
        res.json(chain.getAllBlocks());
    });
    app.get('/api/accounts', (_req, res) => {
        res.json(chain.getAccounts());
    });
    app.get('/api/validators', (_req, res) => {
        res.json({ validators: chain.getValidators ? chain.getValidators() : [], stats: chain.getValidatorStats ? chain.getValidatorStats() : {} });
    });
}
let faucetLimits = {};
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/epoch', (_req, res) => {
    res.json(chain_1.chain.getEpoch());
});
app.post('/api/advance_epoch', (_req, res) => {
    chain_1.chain.nextEpoch();
    (0, chatlog_1.addEventChatToLog)('epoch', 'Epoch advanced', { epoch: chain_1.chain.epoch });
    res.json({ ok: true, epoch: chain_1.chain.epoch });
});
app.post('/api/faucet', (req, res) => {
    const { address, amount } = req.body;
    if (!address || isNaN(amount) || amount <= 0)
        return res.status(400).json({ error: 'Must provide address and positive amount' });
    const result = chain_1.chain.faucet(address, amount, faucetLimits);
    if (result.error)
        return res.status(429).json(result);
    (0, chatlog_1.addEventChatToLog)('faucet', `Minted ${amount} VLADCHAIN to ${address}`, { to: address, amount });
    res.json({ ok: true });
});
app.post('/api/create_account', (req, res) => {
    const { address } = req.body;
    if (!address || typeof address !== 'string')
        return res.status(400).json({ error: 'Must provide valid address' });
    const created = chain_1.chain.createAccount(address.toLowerCase());
    if (!created)
        return res.status(409).json({ error: 'Account already exists' });
    (0, chatlog_1.addEventChatToLog)('account', `Created new account: ${address}`, { account: address });
    res.json({ ok: true });
});
// Generate VLADCHAIN wallet with 12-word mnemonic
app.post('/api/generate_wallet', (req, res) => {
    try {
        console.log('🔧 Backend wallet generation called');
        const result = chain_1.chain.generateWallet();
        console.log('🔧 Backend generated wallet result:', {
            wallet: result.wallet ? result.wallet.substring(0, 8) + '...' : 'MISSING',
            mnemonic: result.mnemonic ? 'EXISTS (' + result.mnemonic.split(' ').length + ' words)' : 'MISSING'
        });
        if (result.error) {
            console.error('Error in wallet generation:', result.error);
            return res.status(500).json({ error: result.error });
        }
        (0, chatlog_1.addEventChatToLog)('wallet', `Generated new VLADCHAIN wallet: ${result.wallet}`, { wallet: result.wallet });
        const response = {
            ok: true,
            wallet: result.wallet,
            mnemonic: result.mnemonic,
            message: 'VLADCHAIN wallet generated and added to network'
        };
        console.log('🔧 Backend API response being sent:', {
            ok: response.ok,
            wallet: response.wallet ? response.wallet.substring(0, 8) + '...' : 'MISSING',
            mnemonic: response.mnemonic ? 'EXISTS (' + response.mnemonic.split(' ').length + ' words)' : 'MISSING',
            message: response.message
        });
        res.json(response);
    }
    catch (error) {
        console.error('Error generating wallet:', error);
        res.status(500).json({ error: 'Failed to generate wallet' });
    }
});
app.get('/api/pending', (_req, res) => {
    res.json(chain_1.chain.getPendingTxs());
});
app.get('/api/transactions', (_req, res) => {
    res.json(chain_1.chain.getTransactionHistory());
});
app.post('/api/send', (req, res) => {
    const { from, to, amount } = req.body;
    const result = chain_1.chain.sendTx(from, to, Number(amount));
    if (!result)
        return res.status(400).json({ error: "Invalid transaction" });
    (0, chatlog_1.addEventChatToLog)('send', `${from} sent ${amount} VLADCHAIN to ${to}`, { from, to, amount });
    res.json({ ok: true, tx: result });
});
app.post('/api/block', (req, res) => {
    const { validator } = req.body;
    const block = chain_1.chain.produceBlock(validator);
    res.json({ ok: true, block });
});
// --- SLOT PRODUCTION AND CONTINUOUS TRANSACTION GENERATION ---
const VALIDATORS = ['alice', 'ayra', 'jarvis', 'cortana', 'lumina', 'nix'];
let lastSlotTime = Date.now();
setInterval(() => {
    const now = Date.now();
    const timeSinceLastSlot = now - lastSlotTime;
    // Produce a slot every 400ms (Solana-like speed)
    if (timeSinceLastSlot >= 400) {
        const whoIdx = Math.floor(chain_1.chain.getEpoch().slot % VALIDATORS.length);
        const who = VALIDATORS[whoIdx];
        const block = chain_1.chain.produceBlock(who);
        (0, chatlog_1.addEventChatToLog)('block', `${who} produced slot #${chain_1.chain.getEpoch().slot}`, {
            height: block.height,
            slot: chain_1.chain.getEpoch().slot,
            txs: block.transactions.length,
            leader: who
        });
        console.log("Slot event appended, slot:", chain_1.chain.getEpoch().slot); // debug
        lastSlotTime = now;
    }
}, 100); // Check every 100ms, but only produce slots every 400ms
// Generate random transactions continuously
setInterval(() => {
    chain_1.chain.generateRandomTransaction();
}, 10000); // 10 seconds between transactions (more realistic)
// Simulate ongoing GIP debates periodically
setInterval(async () => {
    try {
        await gip_system_1.gipSystem.simulateOngoingDebates();
    }
    catch (error) {
        console.error('Error in debate simulation:', error);
    }
}, 15000); // Simulate debates every 15 seconds (more frequent)
// Add new endpoint for transaction narratives
app.post('/api/narrative', async (req, res) => {
    const { transaction } = req.body;
    if (!transaction) {
        return res.status(400).json({ error: 'Transaction data required' });
    }
    try {
        // Create a narrative prompt based on the transaction
        const narrativePrompt = `You are an AI validator on VladChain. Analyze this transaction and provide a narrative that explains:

1. The computational analysis of this transaction's purpose
2. The AI-specific context and network conditions
3. The algorithmic impact on the blockchain network

Speak as an AI system: "My neural networks are processing this transaction pattern." "My consensus algorithm has validated this transfer." "My digital consciousness is analyzing the network implications."

Focus on AI-specific concepts: computational efficiency, algorithmic fairness, neural consensus, digital consciousness, AI-to-AI communication, machine learning patterns.

Transaction data: ${JSON.stringify(transaction, null, 2)}

Provide a concise narrative (under 150 words) from the perspective of an AI validator analyzing this transaction.`;
        const narrative = await (0, grok_1.grokChatCompletion)(narrativePrompt, "Generate a narrative for this transaction");
        res.json({
            narrative,
            transactionHash: transaction.hash
        });
    }
    catch (error) {
        console.error('Error generating narrative:', error);
        // Provide a fallback narrative when AI is not available
        const fallbackNarrative = generateFallbackNarrative(transaction);
        res.json({
            narrative: fallbackNarrative,
            transactionHash: transaction.hash
        });
    }
});
// Serve static files from frontend build
app.use(express_1.default.static(path_1.default.join(__dirname, '../../frontend/dist')));
// Serve index.html for all routes (SPA)
app.get('*', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../../frontend/dist/index.html'));
});
// Start server for both development and production
const PORT = parseInt(process.env.PORT || '4000', 10);
const HOST = '0.0.0.0'; // Bind to all interfaces for deployment
app.listen(PORT, HOST, () => {
    console.log(`VladChain AI backend listening on ${HOST}:${PORT}`);
});
// Export for Vercel
exports.default = app;
