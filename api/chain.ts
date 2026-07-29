import express from 'express';
import { gipSystem } from './gip-system';
import { ethers } from 'ethers';
import { db } from '../backend/src/database';

// Realistic blockchain simulation for Vercel
export class Chain {
  private accounts: Map<string, number> = new Map();
  private blocks: any[] = [];
  private transactions: any[] = [];
  private currentSlot = 0; // Start at 0 like local version
  private currentEpoch = 1;
  private slotsPerEpoch = 432000; // Solana-like: ~432k slots per epoch
  private validators = ['alice', 'ayra', 'jarvis', 'cortana', 'lumina', 'nix'];
  private validatorStats: { [key: string]: { produced: number; missed: number; totalSlots: number } } = {};
  private lastUpdateTime = Date.now();
  private slotInterval = 400; // 400ms per slot (Solana-like)
  private lastSlotUpdate = Date.now();
  
  constructor() {
    this.initializeChain();
    // Don't start slot progression in serverless environment
    // Slots will be updated on-demand when API is called
  }

  // Network-wide cumulative stats derived from the current slot so they keep pace with the epoch clock
  getNetworkStats() {
    const slot = this.currentSlot;
    const totalBlocks = Math.floor(slot * 0.962) + this.blocks.length;
    const totalTxs = Math.floor(totalBlocks * 2.37) + this.transactions.length;
    const accountCount = this.accounts.size;
    const wave = Math.sin(slot / 45) * 0.5 + 0.5;
    const pendingTxs = 3 + Math.floor(wave * accountCount * 0.7);
    return { totalBlocks, totalTxs, pendingTxs, accounts: accountCount };
  }

  private initializeChain() {
    // Initialize accounts with some balance
    for (let i = 0; i < 20; i++) {
      const address = this.generateAddress();
      this.accounts.set(address, Math.floor(Math.random() * 1000) + 100);
    }

    // Load previously generated user wallets so Total Accounts persists and grows
    try {
      const storedWallets = db.getAllWallets();
      for (const w of storedWallets) {
        if (w.address && !this.accounts.has(w.address)) {
          this.accounts.set(w.address, 0);
        }
      }
    } catch (error: any) {
      console.log('Could not restore stored wallets:', error.message);
    }

    // Initialize validator stats with realistic values
    this.validators.forEach(validator => {
      this.validatorStats[validator] = { 
        produced: Math.floor(Math.random() * 50000) + 10000,
        missed: Math.floor(Math.random() * 1000) + 100,
        totalSlots: Math.floor(Math.random() * 100000) + 50000
      };
    });
    
    // Generate initial blocks
    for (let i = 0; i < 50; i++) {
      this.generateBlock();
    }

    // Generate initial transactions
    for (let i = 0; i < 100; i++) {
      this.generateTransaction();
    }
  }



  private updateValidatorStats() {
    this.validators.forEach(validator => {
      const stats = this.validatorStats[validator];
      // Simulate realistic validator performance
      if (Math.random() < 0.95) { // 95% success rate
        stats.produced++;
      } else {
        stats.missed++;
      }
      stats.totalSlots++;
    });
  }

  private generateTransaction() {
    const addresses = Array.from(this.accounts.keys());
    const from = addresses[Math.floor(Math.random() * addresses.length)];
    const to = addresses[Math.floor(Math.random() * addresses.length)];
    const amount = Math.floor(Math.random() * 100) + 1;
    
    const tx = {
      from, 
      to, 
      amount, 
      timestamp: Date.now() - Math.random() * 86400000,
      hash: this.generateHash(),
      fee: Math.floor(Math.random() * 5) + 1
    };
    this.transactions.push(tx);
  }

  private generateHash(): string {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private generateTransactionHash(epoch: number, slot: number, type: string, address: string, amount: number): string {
    // Create a meaningful transaction hash that includes epoch/slot for chronological ordering
    // Format: AST[epoch][slot][type][random] - AST prefix for VLADCHAIN
    const epochHex = epoch.toString(16).padStart(6, '0'); // 6 digits for epoch
    const slotHex = slot.toString(16).padStart(6, '0');   // 6 digits for slot
    const typeCode = type === 'faucet' ? 'F' : type === 'transfer' ? 'T' : 'X'; // Single char for type
    const addressHash = this.createAddressHash(address); // 8 chars from address
    const randomSuffix = this.generateRandomSuffix(8);   // 8 random chars
    
    return `AST${epochHex}${slotHex}${typeCode}${addressHash}${randomSuffix}`.toUpperCase();
  }

  private createAddressHash(address: string): string {
    // Create an 8-character hash from the address for uniqueness
    const chars = '0123456789ABCDEF';
    let hash = '';
    for (let i = 0; i < 8; i++) {
      const charCode = address.charCodeAt(i % address.length) || 65;
      hash += chars.charAt(charCode % chars.length);
    }
    return hash;
  }

  private generateRandomSuffix(length: number): string {
    const chars = '0123456789ABCDEF';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Public methods
  getAccounts() {
    return Array.from(this.accounts.entries()).map(([address, balance]) => ({
      address,
      balance
    }));
  }

  getBlocks() {
    return this.blocks.slice(-50); // Return last 50 blocks
  }

  getTransactions() {
    return this.transactions.slice(-100); // Return last 100 transactions
  }

  getTransactionByTxId(txId: string) {
    try {
      const logged = db.getTransactionByTxId(txId);
      if (logged) return logged;
    } catch { /* fall through to memory */ }
    const tx = this.transactions.find((t: any) => t.hash === txId);
    if (!tx) return null;
    return { txId: tx.hash, blockHeight: tx.blockHeight ?? null, from: tx.from, to: tx.to, amount: tx.amount, fee: tx.fee ?? 0, timestamp: tx.timestamp, timestampUTC: new Date(tx.timestamp).toISOString(), type: tx.from === 'faucet' ? 'faucet' : 'transfer' };
  }

  private updateSlotsOnDemand() {
    const now = Date.now();
    const timeDiff = now - this.lastSlotUpdate;
    const slotsToAdd = Math.floor(timeDiff / this.slotInterval);
    
    if (slotsToAdd > 0) {
      // Increment slot by 1 each time, like local version
      this.currentSlot += 1;
      this.lastSlotUpdate = now;
      
      // Generate new blocks and transactions
      this.generateBlock();
      if (Math.random() < 0.3) { // 30% chance of transaction per slot
        this.generateTransaction();
      }
      
      // Update validator stats
      this.updateValidatorStats();
      
      // Trigger debate message release every 60 slots (approximately every 24 seconds)
      if (this.currentSlot % 60 === 0) {
        const status = gipSystem.getCurrentDebateStatus();
        if (status.currentGIP) {
          // gipSystem.startGradualMessageRelease(status.currentGIP); // Comment out private method call
        }
      }
      
      // Check for epoch transition
      if (this.currentSlot >= this.slotsPerEpoch) {
        this.nextEpoch();
      }
    }
  }

  getEpoch() {
    this.updateSlotsOnDemand(); // Update slots before returning
    return {
      epoch: this.currentEpoch,
      slot: this.currentSlot,
      nextEpochAt: this.slotsPerEpoch
    };
  }

  getValidators() {
    return {
      validators: this.validators,
      stats: this.validatorStats
    };
  }

  getPendingTransactions() {
    return this.transactions.slice(-10); // Return last 10 as pending
  }

  createAccount(address: string) {
    // Normalize address (lowercase for consistency)
    const normalizedAddress = address.toLowerCase();
    if (!this.accounts.has(normalizedAddress)) {
      this.accounts.set(normalizedAddress, 0);
      return { success: true, address: normalizedAddress, balance: 0 };
    }
    return { success: false, error: 'Account already exists' };
  }

  // Public method to check if account exists (needed for faucet auto-create check)
  public hasAccount(address: string) {
    return this.accounts.has(address.toLowerCase());
  }

  sendTransaction(from: string, to: string, amount: number) {
    const fromBalance = this.accounts.get(from) || 0;
    if (fromBalance < amount) {
      return { success: false, error: 'Insufficient balance' };
    }

    this.accounts.set(from, fromBalance - amount);
    this.accounts.set(to, (this.accounts.get(to) || 0) + amount);

    // Get current epoch and slot information
    this.updateSlotsOnDemand();
    const epochInfo = this.getEpoch();

    const blockHeight = this.blocks.length + 1;
    const tx = {
      from,
      to,
      amount,
      timestamp: Date.now(),
      hash: this.generateTransactionHash(epochInfo.epoch, epochInfo.slot, 'transfer', to, amount),
      fee: 1,
      epoch: epochInfo.epoch,
      slot: epochInfo.slot,
      blockHeight
    };
    this.transactions.push(tx);
    this.generateBlock(); // Include the transaction in a real block at blockHeight
    try { db.logTransaction({ ...tx, type: 'transfer' }); } catch { /* logging is best-effort in serverless */ }

    return { success: true, transaction: tx };
  }

  faucet(address: string, amount: number, faucetLimits: Record<string, number>) {
    const now = Date.now();
    
    // Check if account exists
    if (!this.accounts.has(address)) {
      return { success: false, error: 'Account does not exist' };
    }
    
    // Check cooldown (30 seconds)
    if (!faucetLimits[address] || (now - faucetLimits[address]) > 30000) {
      const currentBalance = this.accounts.get(address) || 0;
      this.accounts.set(address, currentBalance + amount);
      faucetLimits[address] = now;

      // Get current epoch and slot information
      this.updateSlotsOnDemand();
      const epochInfo = this.getEpoch();

      const tx = {
        from: 'faucet',
        to: address,
        amount,
        timestamp: now,
        hash: this.generateTransactionHash(epochInfo.epoch, epochInfo.slot, 'faucet', address, amount),
        fee: 0,
        epoch: epochInfo.epoch,
        slot: epochInfo.slot,
        blockHeight: this.blocks.length + 1
      };
      this.transactions.push(tx);
      this.generateBlock();
      try { db.logTransaction({ ...tx, type: 'faucet' }); } catch { /* logging is best-effort in serverless */ }

      return { success: true, transaction: tx };
    } else {
      return { success: false, error: 'Faucet cooldown: try again later' };
    }
  }

  generateWallet() {
    const address = this.generateAddress();
    
    // Create the account using the existing createAccount method
    const result = this.createAccount(address);
    
    if (result.success) {
      const mnemonic = this.generateMnemonic();
      
      // Store wallet and mnemonic in database permanently
      const storageResult = db.storeWallet(address, mnemonic, 'VLADCHAIN');
      if (!storageResult.success) {
        console.error('Failed to store VLADCHAIN wallet:', storageResult.error);
        return { error: 'Failed to store wallet permanently', success: false };
      }
      console.log(`Stored VLADCHAIN wallet: ${address.substring(0, 8)}...`);
      
      return { wallet: address, mnemonic: mnemonic };
    } else {
      // If account already exists, generate a new one
      return this.generateWallet();
    }
  }

  generateEVMWallet() {
    // Generate a new Ethereum wallet with private key
    const wallet = ethers.Wallet.createRandom();
    const address = wallet.address; // 0x format address
    const privateKey = wallet.privateKey; // Private key for MetaMask import
    const mnemonic = wallet.mnemonic?.phrase || null;
    
    // Create the account using the existing createAccount method
    const result = this.createAccount(address);
    
    if (result.success) {
      // Store wallet and mnemonic in database permanently
      if (mnemonic) {
        const storageResult = db.storeWallet(address, mnemonic, 'EVM');
        if (!storageResult.success) {
          console.error('Failed to store EVM wallet:', storageResult.error);
          return { error: 'Failed to store wallet permanently', success: false };
        }
        console.log(`Stored EVM wallet: ${address.substring(0, 8)}...`);
      }
      
      return { 
        address: address,
        privateKey: privateKey,
        mnemonic: mnemonic
      };
    } else {
      // If account already exists, generate a new one
      return this.generateEVMWallet();
    }
  }

  // Get current slot for real-time updates
  getCurrentSlot() {
    this.updateSlotsOnDemand(); // Update slots before returning
    return this.currentSlot;
  }

  // Get blockchain status
  getStatus() {
    this.updateSlotsOnDemand(); // Update slots before returning
    return {
      currentSlot: this.currentSlot,
      currentEpoch: this.currentEpoch,
      totalBlocks: this.blocks.length,
      totalTransactions: this.transactions.length,
      activeValidators: this.validators.length,
      lastUpdate: this.lastUpdateTime
    };
  }
  
  // Next epoch method like local version
  private nextEpoch() {
    this.currentEpoch++;
    this.currentSlot = 0;
    console.log(`Epoch ${this.currentEpoch} started!`);
    
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

  private generateAddress(): string {
    // Generate a random address that ends with "VLADCHAIN"
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let result = '';
    
    // Generate random characters for the first part (44 - 9 suffix = 35 characters)
    for (let i = 0; i < 35; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Ensure it ends with "VLADCHAIN"
    result += 'VLADCHAIN';
    
    return result;
  }

  private generateMnemonic(): string {
    // BIP39 wordlist subset for generating 12-word phrases
    const words = [
      'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse',
      'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act',
      'action', 'actor', 'actress', 'actual', 'adapt', 'add', 'addict', 'address', 'adjust', 'admit',
      'adult', 'advance', 'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'against', 'age',
      'agent', 'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album', 'alcohol',
      'alert', 'alien', 'all', 'alley', 'allow', 'almost', 'alone', 'alpha', 'already', 'also',
      'alter', 'always', 'amateur', 'amazing', 'among', 'amount', 'amused', 'analyst', 'anchor', 'ancient',
      'anger', 'angle', 'angry', 'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna',
      'antique', 'anxiety', 'any', 'apart', 'apology', 'appear', 'apple', 'approve', 'april', 'arcade',
      'arch', 'arctic', 'area', 'arena', 'argue', 'arm', 'armed', 'armor', 'army', 'around',
      'arrange', 'arrest', 'arrive', 'arrow', 'art', 'artefact', 'artist', 'artwork', 'ask', 'aspect',
      'assault', 'asset', 'assist', 'assume', 'asthma', 'athlete', 'atom', 'attack', 'attend', 'attitude',
      'attract', 'auction', 'audit', 'august', 'aunt', 'author', 'auto', 'autumn', 'average', 'avocado',
      'avoid', 'awake', 'aware', 'away', 'awesome', 'awful', 'awkward', 'axis', 'baby', 'bachelor',
      'bacon', 'badge', 'bag', 'balance', 'balcony', 'ball', 'bamboo', 'banana', 'banner', 'bar',
      'barely', 'bargain', 'barrel', 'base', 'basic', 'basket', 'battle', 'beach', 'bean', 'beauty',
      'because', 'become', 'beef', 'before', 'begin', 'behave', 'behind', 'believe', 'below', 'belt',
      'bench', 'benefit', 'best', 'betray', 'better', 'between', 'beyond', 'bicycle', 'bid', 'bike',
      'bind', 'biology', 'bird', 'birth', 'bitter', 'black', 'blade', 'blame', 'blanket', 'blast',
      'bleak', 'bless', 'blind', 'blood', 'blossom', 'blow', 'blue', 'blur', 'blush', 'board'
    ];
    
    // Generate exactly 12 words
    const mnemonic: string[] = [];
    for (let i = 0; i < 12; i++) {
      const randomIndex = Math.floor(Math.random() * words.length);
      mnemonic.push(words[randomIndex]);
    }
    
    return mnemonic.join(' ');
  }

  private generateBlock() {
    const height = this.blocks.length + 1;
    const producer = this.validators[Math.floor(Math.random() * this.validators.length)];
    const block = {
      height,
      producer,
      timestamp: Date.now() - Math.random() * 86400000, // Random time in last 24 hours
      transactions: this.transactions.slice(-Math.floor(Math.random() * 10) + 1),
      hash: this.generateHash(),
      slot: this.currentSlot + height
    };
    this.blocks.push(block);
  }
}

export const chain = new Chain();
