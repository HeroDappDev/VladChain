import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { personalitiesRouter } from './personalities';
import { chain } from './chain';
import { chatlogRouter, addEventChatToLog } from './chatlog';
import { grokChatCompletion } from './grok';
import { gipRouter } from './gip-router';
import { gipSystem } from './gip-system';
import { adminRouter } from './admin';
import { rwaRouter } from './rwa';
dotenv.config();

// Base58 alphabet for VladChain addresses
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

// Generate VladChain wallet address
function generateSolanaWallet(): string {
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
function generateFallbackNarrative(transaction: any): string {
  const { from, to, amount, fee } = transaction;
  
  // Determine transaction type and context
  let purpose = "transfer";
  let context = "";
  let impact = "";
  
  if (from === 'faucet') {
    purpose = "faucet distribution";
    context = "New tokens were minted and distributed to support network participation.";
    impact = "This increases the circulating supply and enables new users to participate in the network.";
  } else if (to === from) {
    purpose = "self-transfer";
    context = "A transaction sent to the same address, possibly for account verification.";
    impact = "This transaction validates the account's ability to process transactions.";
  } else if (amount > 100) {
    purpose = "significant transfer";
    context = "A substantial amount of VLADCHAIN tokens was moved between accounts.";
    impact = "This represents meaningful economic activity on the network.";
  } else {
    purpose = "standard transfer";
    context = "A routine transfer of VLADCHAIN tokens between network participants.";
    impact = "This maintains the flow of value across the AI-run blockchain network.";
  }
  
  return `This transaction represents a ${purpose} of ${amount} VLADCHAIN tokens from ${from} to ${to}. ${context} ${impact} The transaction includes a fee of ${fee || 0} VLADCHAIN, which compensates the AI validators for processing this transaction and maintaining network security.`;
}

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/personality', personalitiesRouter);
app.use('/api/chatlog', chatlogRouter);
app.use('/api/gip', gipRouter);
app.use('/api/admin', adminRouter);
app.use('/api/rwa', rwaRouter);

// Initialize GIP system with realistic blockchain improvement proposals
gipSystem.initializeWithRealisticGIPs().then(() => {
  console.log('GIP system initialized with realistic blockchain improvement proposals');
}).catch(error => {
  console.error('Error initializing GIP system:', error);
});

// Ensure Explorer API endpoints always live and seeded
defineExplorerEndpoints(app, chain);

// Version endpoint for deployment verification
app.get('/api/version', (_req, res) => {
  const version = process.env.RAILWAY_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || process.env.COMMIT_SHA || 'dev-local';
  res.json({ version });
});





function defineExplorerEndpoints(app: any, chain: any) {
  app.get('/api/blocks', (_req: any, res: any) => {
    res.json(chain.getBlocks());
  });
  app.get('/api/all-blocks', (_req: any, res: any) => {
    res.json(chain.getAllBlocks());
  });
  app.get('/api/accounts', (_req: any, res: any) => {
    res.json(chain.getAccounts());
});
  app.get('/api/validators', (_req: any, res: any) => {
    res.json({ validators: chain.getValidators ? chain.getValidators() : [], stats: chain.getValidatorStats ? chain.getValidatorStats() : {} });
  });
}

let faucetLimits: Record<string, number> = {};

// Daily faucet limits tracking
interface DailyFaucetData {
  date: string; // YYYY-MM-DD format
  requests: number;
  totalAmount: number;
}

let dailyFaucetLimits: Record<string, DailyFaucetData> = {};

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/stats', (_req, res) => res.json(chain.getNetworkStats()));

app.get('/api/debug/slot', (_req, res) => {
  try {
    const currentSlot = chain.getCurrentSlot();
    const status = chain.getStatus();
    res.json({ currentSlot, status });
  } catch (error) {
    console.error('Error getting debug slot:', error);
    res.status(500).json({ error: 'Failed to get debug slot data' });
  }
});
app.get('/api/epoch', (_req, res) => {
  try {
    const epochData = chain.getEpoch();
    console.log('Epoch data:', epochData);
    res.json(epochData);
  } catch (error) {
    console.error('Error getting epoch:', error);
    res.status(500).json({ error: 'Failed to get epoch data' });
  }
});

app.post('/api/advance_epoch', (_req, res) => {
  // Static epoch data for Vercel
  res.json({ ok: true, epoch: 32 });
});

app.post('/api/faucet', async (req, res) => {
  const { address, amount } = req.body;
  if (!address || isNaN(amount) || amount <= 0) return res.status(400).json({ error: 'Must provide address and positive amount' });
  
  // Normalize address and auto-create if it doesn't exist (especially for EVM 0x addresses)
  const normalizedAddress = address.toLowerCase();
  
  // Check daily faucet limits
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const dailyData = dailyFaucetLimits[normalizedAddress];
  
  // Initialize daily data if it doesn't exist or if it's a new day
  if (!dailyData || dailyData.date !== today) {
    dailyFaucetLimits[normalizedAddress] = {
      date: today,
      requests: 0,
      totalAmount: 0
    };
  }
  
  const currentDailyData = dailyFaucetLimits[normalizedAddress];
  
  // Check daily request limit (2 requests per day)
  if (currentDailyData.requests >= 2) {
    return res.status(429).json({ error: 'Daily faucet limit reached: Maximum 2 requests per day' });
  }
  
  // Check daily amount limit (1000 VLADCHAIN per day)
  if (currentDailyData.totalAmount + amount > 1000) {
    const remainingAmount = 1000 - currentDailyData.totalAmount;
    if (remainingAmount <= 0) {
      return res.status(429).json({ error: 'Daily faucet amount limit reached: Maximum 1000 VLADCHAIN per day' });
    }
    return res.status(429).json({ 
      error: `Daily faucet amount limit exceeded: You can only request ${remainingAmount} more VLADCHAIN today (1000 VLADCHAIN daily limit)` 
    });
  }
  
  // Check if account exists, if not create it automatically
  if (!chain.hasAccount(normalizedAddress)) {
    const createResult = chain.createAccount(normalizedAddress);
    if (!createResult.success) {
      return res.status(400).json({ error: `Failed to create account: ${createResult.error}` });
    }
    await addEventChatToLog('account', `Auto-created account for faucet: ${normalizedAddress}`, { address: normalizedAddress });
  }
  
  // Check current wallet balance
  const accounts = chain.getAccounts();
  const currentAccount = accounts.find(acc => acc.address === normalizedAddress);
  const currentBalance = currentAccount ? currentAccount.balance : 0;
  
  const result = chain.faucet(normalizedAddress, amount, faucetLimits);
  
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  
  // Update daily limits after successful faucet
  currentDailyData.requests += 1;
  currentDailyData.totalAmount += amount;
  
  await addEventChatToLog('faucet', `Minted ${amount} VLADCHAIN to ${normalizedAddress}`, { address: normalizedAddress, amount });
  await addEventChatToLog('token_received', `User received ${amount} VLADCHAIN tokens`, { amount });
  res.json({ 
    ok: true, 
    transaction: result.transaction,
    balanceInfo: {
      previousBalance: currentBalance,
      newBalance: currentBalance + amount
    },
    dailyStats: {
      requestsUsed: currentDailyData.requests,
      requestsRemaining: 2 - currentDailyData.requests,
      amountUsed: currentDailyData.totalAmount,
      amountRemaining: 1000 - currentDailyData.totalAmount
    }
  });
});

app.post('/api/create_account', async (req, res) => {
  const { address } = req.body;
  if (!address || typeof address !== 'string') return res.status(400).json({ error: 'Must provide valid address' });
  const result = chain.createAccount(address.toLowerCase());
  if (!result.success) return res.status(409).json({ error: result.error });
  await addEventChatToLog('account', `Created new account: ${address}`, { address });
  res.json({ ok: true });
});

  // Generate VladChain wallet
app.post('/api/generate_wallet', async (req, res) => {
  try {
    const result = chain.generateWallet();
    console.log('🔧 Backend generateWallet result:', result);
    
    if (!result || !result.wallet) {
      console.error('❌ Invalid result from generateWallet:', result);
      return res.status(500).json({ error: 'Failed to generate wallet - invalid result' });
    }
    
    await addEventChatToLog('wallet', `Generated new VLADCHAIN wallet: ${result.wallet}`, { wallet: result.wallet });
    
    const response = { 
      ok: true, 
      wallet: result.wallet,
      mnemonic: result.mnemonic,
      message: 'VLADCHAIN wallet generated and added to network'
    };
    
    console.log('🔧 API response being sent:', { ...response, mnemonic: response.mnemonic ? 'EXISTS' : 'MISSING' });
    
    res.json(response);
  } catch (error) {
    console.error('Error generating wallet:', error);
    res.status(500).json({ error: 'Failed to generate wallet' });
  }
});

// Generate EVM wallet with private key for MetaMask
app.post('/api/generate_evm_wallet', async (req, res) => {
  try {
    const result = chain.generateEVMWallet();
    await addEventChatToLog('wallet', `Generated new EVM wallet: ${result.address}`, { address: result.address });
    res.json({ 
      ok: true, 
      address: result.address,
      privateKey: result.privateKey,
      mnemonic: result.mnemonic,
      message: 'EVM wallet generated successfully! Import the private key into MetaMask to use with VladChain.'
    });
  } catch (error) {
    console.error('Error generating EVM wallet:', error);
    res.status(500).json({ error: 'Failed to generate EVM wallet' });
  }
});









app.get('/api/pending', (_req, res) => {
  res.json(chain.getPendingTransactions());
});

app.get('/api/transactions', (_req, res) => {
  res.json(chain.getTransactions());
});

app.post('/api/send', async (req, res) => {
  const { from, to, amount } = req.body;
  const result = chain.sendTransaction(from, to, Number(amount));
  if (!result.success) return res.status(400).json({ error: result.error });
  await addEventChatToLog('send', `${from} sent ${amount} VLADCHAIN to ${to}`, { from, to, amount });
  await addEventChatToLog('token_received', `User received ${amount} VLADCHAIN tokens`, { amount });
  const tx: any = result.transaction;
  const receipt = {
    txId: tx.hash,
    blockHeight: tx.blockHeight ?? null,
    timestampUTC: new Date(tx.timestamp).toISOString(),
    from: tx.from,
    to: tx.to,
    amount: tx.amount,
    fee: tx.fee ?? 0
  };
  res.json({ ok: true, tx, receipt });
});

app.get('/api/tx/:txId', (req, res) => {
  const tx = chain.getTransactionByTxId(req.params.txId);
  if (!tx) return res.status(404).json({ error: 'Transaction not found' });
  res.json(tx);
});

app.post('/api/block', (req, res) => {
  // Static block data for Vercel
  res.json({ ok: true, block: { height: 1, producer: 'alice', transactions: [] } });
});

// --- REALISTIC BLOCKCHAIN SIMULATION FOR VERCEL ---
// Continuous slot progression and transaction generation

// Simulate ongoing GIP debates periodically
setInterval(async () => {
  try {
    await gipSystem.simulateOngoingDebates();
  } catch (error) {
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

    const narrative = await grokChatCompletion(narrativePrompt, "Generate a narrative for this transaction");
    
    res.json({ 
      narrative,
      transactionHash: transaction.hash 
    });
  } catch (error) {
    console.error('Error generating narrative:', error);
    
    // Provide a fallback narrative when AI is not available
    const fallbackNarrative = generateFallbackNarrative(transaction);
    
    res.json({ 
      narrative: fallbackNarrative,
      transactionHash: transaction.hash 
    });
  }
});

// For Vercel deployment
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`VladChain AI backend listening on port ${PORT}`);
  });
}

// Export for Vercel
export default app;