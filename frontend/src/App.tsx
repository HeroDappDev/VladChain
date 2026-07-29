import React, { useEffect, useRef, useState } from 'react';
import MultiAgentChat from './MultiAgentChat';
import GIPSystem from './GIPSystem';
import AdminPanel from './AdminPanel';
import LiveDebate from './LiveDebate';
import RWADashboard from './RWADashboard';

const API_BASE = '';

const personas: Record<string, {name:string, color:string}> = {
  alice: {name:"ALICE", color:"#ffffff"},
  ayra: {name:"AYRA", color:"#cccccc"},
  jarvis: {name:"JARVIS", color:"#ffffff"},
  cortana: {name:"CORTANA", color:"#cccccc"},
  lumina: {name:"LUMINA", color:"#ffffff"},
  nix: {name:"NIX", color:"#cccccc"},
  user:  {name:"You", color:"#CBFA03"}
};

type ChatEvent = { from: string, text: string, timestamp: number };
type Transaction = { 
  from: string; 
  to: string; 
  amount: number; 
  timestamp: number; 
  hash?: string; 
  fee?: number 
};

// Function to create glitch effects by modifying specific characters
function createGlitchFrame(baseFrame: string, glitchLevel: number): string {
  const glitchChars = ['@', '#', '$', '%', '&', '*', '!', '?', '+', '=', '~', '^'];
  const tanChars = ['a', 's', 't', 'e', 'r', 'A', 'S', 'T', 'E', 'R'];
  
  let glitchedFrame = baseFrame;
  const lines = glitchedFrame.split('\n');
  
  // Use a deterministic seed based on glitchLevel for consistent results
  const seed = glitchLevel * 12345;
  
  // Apply glitch effects based on level
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const chars = line.split('');
    
    // Deterministic character corruption
    for (let j = 0; j < chars.length; j++) {
      const rand = Math.sin(seed + i * 100 + j) * 10000 % 1;
      if (rand < glitchLevel * 0.1) {
        const charRand = Math.sin(seed + i * 200 + j) * 10000 % 1;
        if (charRand < 0.5) {
          const charIndex = Math.floor(Math.sin(seed + i * 300 + j) * 10000) % glitchChars.length;
          chars[j] = glitchChars[Math.abs(charIndex)];
        } else {
          const charIndex = Math.floor(Math.sin(seed + i * 400 + j) * 10000) % tanChars.length;
          chars[j] = tanChars[Math.abs(charIndex)];
        }
      }
    }
    
    // Deterministic line shifts
    const shiftRand = Math.sin(seed + i * 500) * 10000 % 1;
    if (shiftRand < glitchLevel * 0.05) {
      const shift = Math.floor(Math.sin(seed + i * 600) * 10000) % 3 - 1;
      if (shift > 0) {
        chars.unshift(' ');
      } else if (shift < 0 && chars.length > 0) {
        chars.shift();
      }
    }
    
    lines[i] = chars.join('');
  }
  
  return lines.join('\n');
}

// Function to render ASCII art with tan glitch effects
function renderGlitchASCII(asciiText: string): JSX.Element {
  const tanChars = ['a', 's', 't', 'e', 'r', 'A', 'S', 'T', 'E', 'R'];
  const glitchChars = ['@', '#', '$', '%', '&', '*', '!', '?', '+', '=', '~', '^'];
  
  const chars = asciiText.split('').map((char, index) => {
    if (tanChars.includes(char)) {
      return <span key={index} style={{ color: '#CBFA03', textShadow: '0 0 5px #CBFA03' }}>{char}</span>;
    } else if (glitchChars.includes(char)) {
      return <span key={index} style={{ color: '#BC9A6A', textShadow: '0 0 3px #BC9A6A' }}>{char}</span>;
    }
    return <span key={index}>{char}</span>;
  });
  
  return <pre className="ascii-logo" style={{ margin: 0 }}>{chars}</pre>;
}

// Function to render clean ASCII art with tan color
function renderCleanASCII(asciiText: string): JSX.Element {
  const chars = asciiText.split('').map((char, index) => {
    return <span key={index} style={{ color: '#CFFF00' }}>{char}</span>;
  });
  
  return <pre className="ascii-logo" style={{ margin: 0 }}>{chars}</pre>;
}

// ASCII Art for VLADCHAIN with animation frames
// Optimized frames for smoother, faster animation
const VLADCHAIN_ASCII_FRAMES = [
    // Frame 0: Clean logo - exact original
    `██╗   ██╗██╗      █████╗ ██████╗  ██████╗██╗  ██╗ █████╗ ██╗███╗   ██╗
██║   ██║██║     ██╔══██╗██╔══██╗██╔════╝██║  ██║██╔══██╗██║████╗  ██║
██║   ██║██║     ███████║██║  ██║██║     ███████║███████║██║██╔██╗ ██║
╚██╗ ██╔╝██║     ██╔══██║██║  ██║██║     ██╔══██║██╔══██║██║██║╚██╗██║
 ╚████╔╝ ███████╗██║  ██║██████╔╝╚██████╗██║  ██║██║  ██║██║██║ ╚████║
  ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═════╝  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝`,
    
    // Frame 1: Light glitch
    createGlitchFrame(`██╗   ██╗██╗      █████╗ ██████╗  ██████╗██╗  ██╗ █████╗ ██╗███╗   ██╗
██║   ██║██║     ██╔══██╗██╔══██╗██╔════╝██║  ██║██╔══██╗██║████╗  ██║
██║   ██║██║     ███████║██║  ██║██║     ███████║███████║██║██╔██╗ ██║
╚██╗ ██╔╝██║     ██╔══██║██║  ██║██║     ██╔══██║██╔══██║██║██║╚██╗██║
 ╚████╔╝ ███████╗██║  ██║██████╔╝╚██████╗██║  ██║██║  ██║██║██║ ╚████║
  ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═════╝  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝`, 2),
    
    // Frame 2: Moderate glitch
    createGlitchFrame(`██╗   ██╗██╗      █████╗ ██████╗  ██████╗██╗  ██╗ █████╗ ██╗███╗   ██╗
██║   ██║██║     ██╔══██╗██╔══██╗██╔════╝██║  ██║██╔══██╗██║████╗  ██║
██║   ██║██║     ███████║██║  ██║██║     ███████║███████║██║██╔██╗ ██║
╚██╗ ██╔╝██║     ██╔══██║██║  ██║██║     ██╔══██║██╔══██║██║██║╚██╗██║
 ╚████╔╝ ███████╗██║  ██║██████╔╝╚██████╗██║  ██║██║  ██║██║██║ ╚████║
  ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═════╝  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝`, 4),
    
    // Frame 3: Heavy glitch
    createGlitchFrame(`██╗   ██╗██╗      █████╗ ██████╗  ██████╗██╗  ██╗ █████╗ ██╗███╗   ██╗
██║   ██║██║     ██╔══██╗██╔══██╗██╔════╝██║  ██║██╔══██╗██║████╗  ██║
██║   ██║██║     ███████║██║  ██║██║     ███████║███████║██║██╔██╗ ██║
╚██╗ ██╔╝██║     ██╔══██║██║  ██║██║     ██╔══██║██╔══██║██║██║╚██╗██║
 ╚████╔╝ ███████╗██║  ██║██████╔╝╚██████╗██║  ██║██║  ██║██║██║ ╚████║
  ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═════╝  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝`, 6),
    

  ];

// Keep the original for fallback
const VLADCHAIN_ASCII = VLADCHAIN_ASCII_FRAMES[0];

const TERMINAL_HEADER = `
╔════════════════════════════════════════════════════════════════════════════════╗
║                             VLADCHAIN TERMINAL v1.0.0                         ║
║              THE RWA LAYER 3 FOR THE ROBINHOOD CHAIN — AI-GOVERNED             ║
║                                                                                ║
║ Real World Assets (RWAs) — tokenized equities, treasuries, real estate,        ║
║ commodities, and private credit — registered, priced, attested, and settled    ║
║ by an autonomous AI validator council. No human node operators are present.    ║
║                                                                                ║
║ VALIDATOR NODES:                                                               ║
║   ▸ ALICE   ▸ AYRA   ▸ JARVIS   ▸ CORTANA   ▸ LUMINA   ▸ NIX                   ║
║                                                                                ║
║ Each agent runs in complete isolation inside its own secure virtual machine.   ║
║ Together they govern the RWA registry—screening asset onboarding, verifying    ║
║ proof-of-reserve attestations, pricing tokenized assets via six-model oracle   ║
║ consensus, and settling compliant transfers with no human intervention.        ║
║                                                                                ║
║ experiment by @VladChain_                                                     ║
║                                                                                ║
║ ⚠️ WARNING – ALPHA EXPERIMENT – CONSENSUS PROCESSES MAY SPONTANEOUSLY          ║
║ REORGANIZE OR HALT. MONITOR VM STATES AND PROCEED AT YOUR OWN RISK.            ║
╚════════════════════════════════════════════════════════════════════════════════╝
`;

const TERMINAL_HEADER_MOBILE = `
╔═══════════════════════════════════════╗
║         VLADCHAIN TERMINAL v1.0      ║
║   RWA LAYER 3 · ROBINHOOD CHAIN      ║
║                                       ║
║ Real World Assets tokenized, priced   ║
║ and settled by autonomous AI agents.  ║
║                                       ║
║ VALIDATORS:                           ║
║ ALICE • AYRA • JARVIS                 ║
║ CORTANA • LUMINA • NIX                ║
║                                       ║
║ Self-governing consensus through      ║
║ autonomous debate and AIPs.           ║
║                                       ║
║ experiment by @VladChain_            ║
║                                       ║
║ ⚠️ WARNING - ALPHA EXPERIMENT         ║
║ Monitor VM states carefully.          ║
╚═══════════════════════════════════════╝
`;

const COMMAND_HELP = `
Available Commands:
├── chat [validator]     - Chat with AI validators
├── blocks              - View blockchain blocks
├── accounts            - View wallet accounts  
├── validators          - List AI validators
├── status              - Show system status
├── help                - Show this help
└── clear               - Clear terminal

Validators: alice, ayra, jarvis, cortana, lumina, nix
`;



export default function App() {
  const [tab, setTab] = useState<'chat'|'blocks'|'accounts'|'validators'>('chat');
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState<number>(0);
  const [selectedValidator, setSelectedValidator] = useState<string>('random');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [caCopied, setCaCopied] = useState(false);
  const chatDivRef = useRef<HTMLDivElement>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Add new state variables for blockchain features
  const [activeTab, setActiveTab] = useState<'chat' | 'explorer' | 'faucet' | 'send' | 'oracle' | 'rwa' | 'gip' | 'docs'>('chat');
  const [pendingTxs, setPendingTxs] = useState<any[]>([]);
  const [validatorStats, setValidatorStats] = useState<any>({});
  const [blocks, setBlocks] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [validators, setValidators] = useState<string[]>([]);
  
  // Wallet mnemonic state
  const [walletMnemonic, setWalletMnemonic] = useState<string | null>(null);
  const [showMnemonicBox, setShowMnemonicBox] = useState<boolean>(false);
  const [transactionHistory, setTransactionHistory] = useState<any[]>([]);
  const [testnetStatus, setTestnetStatus] = useState<{epoch:number,slot:number,nextEpochAt:number}>({epoch:1,slot:0,nextEpochAt:432000});
  const [faucetBalance, setFaucetBalance] = useState<number>(1000);
  const [newAccountAddress, setNewAccountAddress] = useState<string>('');
  const [sendAmount, setSendAmount] = useState<string>('');
  const [sendTo, setSendTo] = useState<string>('');
  const [sendFrom, setSendFrom] = useState<string>('');
  const [narrativeMode, setNarrativeMode] = useState<boolean>(false);
  const [narrativeCache, setNarrativeCache] = useState<Record<string, string>>({});
  const [logoFrame, setLogoFrame] = useState<number>(0);
  const [hasStartedChatting, setHasStartedChatting] = useState<boolean>(false);
  const [chatlog, setChatlog] = useState<ChatEvent[]>([]);
  const [input, setInput] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [blockchainState, setBlockchainState] = useState<any>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);
  
  // Ref for Explorer content container
  const explorerContainerRef = useRef<HTMLDivElement>(null);
  
  // Faucet transaction result state
  const [faucetTransaction, setFaucetTransaction] = useState<any>(null);
  const [transactionStatus, setTransactionStatus] = useState<'pending' | 'confirmed' | 'failed'>('pending');
  const [showTransactionModal, setShowTransactionModal] = useState<boolean>(false);

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll to top when Explorer tab is activated
  useEffect(() => {
    if (activeTab === 'explorer' && explorerContainerRef.current) {
      explorerContainerRef.current.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  // Poll backend for data
  useEffect(() => {
    async function poll() {
      const chat = await fetch(`${API_BASE}/api/chatlog`).then(r=>r.json()).catch(()=>[]);
      
      // Only update chatlog if we have new messages or if it's the first load
      if (chat.length > 0) {
        const latestMessageTime = Math.max(...chat.map((msg: ChatEvent) => msg.timestamp));
        
        // Only update if we have new messages (after the last known timestamp)
        if (latestMessageTime > lastMessageTimestamp || chatlog.length === 0) {
      setChatlog(chat);
          setLastMessageTimestamp(latestMessageTime);
        }
      }
      
      const stats = await fetch(`${API_BASE}/api/epoch`).then(r=>r.json()).catch(()=>null);
      if (stats) setTestnetStatus(stats);
      const blocks = await fetch(`${API_BASE}/api/blocks`).then(r=>r.json()).catch(()=>[]);
      setBlocks(blocks);
      const accs = await fetch(`${API_BASE}/api/accounts`).then(r=>r.json()).catch(()=>[]);
      setAccounts(accs);
      const vals = await fetch(`${API_BASE}/api/validators`).then(r=>r.json()).catch(()=>({validators:[]}));
      setValidators(vals.validators||[]);
    }
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, []);

  // Add blockchain data fetching
  useEffect(() => {
    const fetchBlockchainData = async () => {
      try {
        const [accountsRes, blocksRes, pendingRes, epochRes, txHistoryRes, validatorsRes] = await Promise.all([
          fetch(`${API_BASE}/api/accounts`),
          fetch(`${API_BASE}/api/blocks`),
          fetch(`${API_BASE}/api/pending`),
          fetch(`${API_BASE}/api/epoch`),
          fetch(`${API_BASE}/api/transactions`),
          fetch(`${API_BASE}/api/validators`)
        ]);
        
        if (accountsRes.ok) setAccounts(await accountsRes.json());
        if (blocksRes.ok) setBlocks(await blocksRes.json());
        if (pendingRes.ok) setPendingTxs(await pendingRes.json());
        if (epochRes.ok) setTestnetStatus(await epochRes.json());
        if (txHistoryRes.ok) setTransactionHistory(await txHistoryRes.json());
        if (validatorsRes.ok) {
          const validatorsData = await validatorsRes.json();
          setValidatorStats(validatorsData.stats || {});
        }
      } catch (error) {
        console.error('Failed to fetch blockchain data:', error);
      }
    };

    fetchBlockchainData();
    const interval = setInterval(fetchBlockchainData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Ensure page starts at top when first loaded
  useEffect(() => {
    if (chatDivRef.current && !hasUserInteracted) {
      chatDivRef.current.scrollTop = 0;
    }
  }, [hasUserInteracted]);

  // Animate the logo
  // VLADCHAIN logo is now static - no animation needed

  // Always scroll to bottom when chatlog updates (only after user interaction)
  useEffect(() => {
    // Only auto-scroll when user has actually started chatting, not when clicking landing page buttons
    if (chatDivRef.current && hasStartedChatting) {
      chatDivRef.current.scrollTop = chatDivRef.current.scrollHeight;
    }
  }, [chatlog, tab, hasStartedChatting]);

  // Handle command history navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  async function sendUserMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setInput('');
    
    // Add to command history
    setCommandHistory(prev => [...prev, userMessage]);
    setHistoryIndex(-1);
    
    // Handle CLI commands
    if (userMessage.startsWith('/')) {
      const command = userMessage.slice(1).toLowerCase();
      if (command === 'clear') {
        setChatlog([]);
        // Clear chat from database
        try {
          await fetch(`${API_BASE}/api/chatlog`, { method: 'DELETE' });
        } catch (error) {
          console.error('Failed to clear chat from database:', error);
        }
        return;
      } else if (command === 'help') {
        setChatlog(prev => [...prev, { from: 'system', text: `Available Commands:
/status - Show blockchain status and statistics
/chat [validator] - Chat with AI validators about blockchain
/blocks - View recent blocks and transactions
/accounts - View wallet accounts and balances
/validators - List AI validators and performance
/gips - View Vladchain Improvement Proposals
/gip [id] - View specific GIP details
/create-gip - Create a new GIP
/clear - Clear chat history
/help - Show this help

Validators: alice, ayra, jarvis, cortana, lumina, nix

You can also chat naturally about blockchain activities, slots, transactions, and network performance.`, timestamp: Date.now() }]);
        return;
      } else if (command === 'status') {
        setChatlog(prev => [...prev, { from: 'system', text: `\nSYSTEM STATUS:\n├── Epoch: ${testnetStatus.epoch}\n├── Slot: ${testnetStatus.slot}/${testnetStatus.nextEpochAt}\n├── Validators: ${validators.length}\n├── Accounts: ${accounts.length}\n└── Slots: ${blocks.length}\n`, timestamp: Date.now() }]);
        return;
      } else if (command.startsWith('chat ')) {
        const validator = command.split(' ')[1];
        if (['alice', 'ayra', 'jarvis', 'cortana', 'lumina', 'nix'].includes(validator)) {
          setSelectedValidator(validator);
          setChatlog(prev => [...prev, { from: 'system', text: `Switched to ${validator.toUpperCase()} validator. Chat about blockchain activities, slots, transactions, and network performance.`, timestamp: Date.now() }]);
          return;
        }
      } else if (command === 'gips') {
        setActiveTab('gip');
        setChatlog(prev => [...prev, { from: 'system', text: `Navigated to GIPs tab. View and manage Vladchain Improvement Proposals.`, timestamp: Date.now() }]);
        return;
      } else if (command.startsWith('gip ')) {
        const gipId = command.split(' ')[1];
        setActiveTab('gip');
        setChatlog(prev => [...prev, { from: 'system', text: `Navigated to GIP ${gipId.toUpperCase()}. Check the GIPs tab for details.`, timestamp: Date.now() }]);
        return;
      } else if (command === 'create-gip') {
        setActiveTab('gip');
        setChatlog(prev => [...prev, { from: 'system', text: `Navigated to GIPs tab. Use the "CREATE GIP" tab to create a new proposal.`, timestamp: Date.now() }]);
        return;
      } else if (command === 'wallet') {
        setActiveTab('send'); // Navigate to send tab for wallet connection
        setChatlog(prev => [...prev, { from: 'system', text: `Navigated to Send tab. Use the "SEND" tab to connect your wallet.`, timestamp: Date.now() }]);
        return;
      } else if (command === 'oracle') {
        setActiveTab('oracle');
        setChatlog(prev => [...prev, { from: 'system', text: `Navigated to Oracle tab. Chat with individual AI validators.`, timestamp: Date.now() }]);
        return;
      }
    }
    
    // Mark that user has started chatting (only for real chat messages, not commands)
    setHasStartedChatting(true);
    
    // Add user message to chat and save to database
    const userMessageObj = { from: 'user', text: userMessage, timestamp: Date.now() };
    setChatlog(prev => [...prev, userMessageObj]);
    
    // Save user message to database
    try {
      await fetch(`${API_BASE}/api/chatlog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userMessageObj)
      });
    } catch (error) {
      console.error('Failed to save user message to database:', error);
    }
    
    // Get the selected validator or a random one
    const aiValidators = ['alice', 'ayra', 'jarvis', 'cortana', 'lumina', 'nix'];
    const targetValidator = selectedValidator === 'random' 
      ? aiValidators[Math.floor(Math.random() * aiValidators.length)]
      : selectedValidator;
    
    try {
      // Send message to AI personality with blockchain context
      const response = await fetch(`${API_BASE}/api/personality/${targetValidator}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          command: userMessage,
          context: {
            currentEpoch: testnetStatus.epoch,
            currentSlot: testnetStatus.slot,
            totalBlocks: blocks.length,
            totalAccounts: accounts.length,
            pendingTransactions: pendingTxs.length,
            recentTransactions: transactionHistory.length,
            validators: validators.length
          }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const aiMessageObj = { from: targetValidator, text: data.message, timestamp: Date.now() };
        setChatlog(prev => [...prev, aiMessageObj]);
        
        // Save AI message to database
        try {
          await fetch(`${API_BASE}/api/chatlog`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(aiMessageObj)
          });
        } catch (error) {
          console.error('Failed to save AI message to database:', error);
        }
      } else {
        // Fallback response if API fails
        setChatlog(prev => [
          ...prev,
          { from: targetValidator, text: `ERROR: Unable to process request. API response: ${response.status}`, timestamp: Date.now() }
        ]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setChatlog(prev => [
        ...prev,
        { from: targetValidator, text: `ERROR: Network connection failed. Please check your connection.`, timestamp: Date.now() }
      ]);
    }
  }

  // Add blockchain interaction functions
  const createAccount = async () => {
    // Removed wallet function
  };

  const requestFaucet = async () => {
    if (!newAccountAddress.trim()) return;
    try {
      const response = await fetch(`${API_BASE}/api/faucet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: newAccountAddress.trim(), amount: faucetBalance })
      });
      if (response.ok) {
        const data = await response.json();
        // Keep the wallet address in the input field
        // setNewAccountAddress(''); // REMOVED - don't clear the address
        
        // Store the faucet transaction details in pending state
        setFaucetTransaction({
          ...data.transaction,
          block: 'Pending...',
          timestamp: Date.now(),
          balanceInfo: data.balanceInfo,
          dailyStats: data.dailyStats
        });
        setTransactionStatus('pending');
        
        // Start polling for transaction confirmation
        checkTransactionInclusion(data.transaction.hash);
        
        setChatlog(prev => [...prev, { from: 'system', text: `🔄 Faucet Request Submitted: ${faucetBalance} VLADCHAIN to ${data.transaction.to} - Waiting for confirmation...`, timestamp: Date.now() }]);
      } else {
        const error = await response.json();
        setChatlog(prev => [...prev, { from: 'system', text: `❌ Faucet error: ${error.error}`, timestamp: Date.now() }]);
      }
    } catch (error) {
      setChatlog(prev => [...prev, { from: 'system', text: '❌ Error requesting from faucet', timestamp: Date.now() }]);
    }
  };

  const sendTransaction = async () => {
    if (!sendFrom.trim() || !sendTo.trim() || !sendAmount.trim()) return;
    try {
      const response = await fetch(`${API_BASE}/api/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          from: sendFrom.trim(), 
          to: sendTo.trim(), 
          amount: parseFloat(sendAmount) 
        })
      });
      if (response.ok) {
        setSendFrom('');
        setSendTo('');
        setSendAmount('');
        setChatlog(prev => [...prev, { from: 'user', text: `Transaction: ${sendAmount} VLADCHAIN from ${sendFrom} to ${sendTo}`, timestamp: Date.now() }]);
      } else {
        const error = await response.json();
        setChatlog(prev => [...prev, { from: 'user', text: `Transaction error: ${error.error}`, timestamp: Date.now() }]);
      }
    } catch (error) {
      setChatlog(prev => [...prev, { from: 'user', text: 'Error sending transaction', timestamp: Date.now() }]);
    }
  };

  const generateNarrative = async (tx: Transaction): Promise<string> => {
    if (!tx.hash) return "Unable to generate narrative for transaction without hash.";
    
    // Check if we already have a narrative for this transaction
    if (narrativeCache[tx.hash]) {
      return narrativeCache[tx.hash];
    }

    // Set loading state for this transaction
    // setNarrativeLoading(prev => ({ ...prev, [tx.hash!]: true })); // This state variable was removed

    try {
      const response = await fetch(`${API_BASE}/api/narrative`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction: tx })
      });

      if (response.ok) {
        const data = await response.json();
        const narrative = data.narrative || "Unable to generate narrative.";
        
        // Store the narrative
        setNarrativeCache(prev => ({ ...prev, [tx.hash!]: narrative }));
        return narrative;
      } else {
        const errorNarrative = "Unable to generate narrative at this time.";
        setNarrativeCache(prev => ({ ...prev, [tx.hash!]: errorNarrative }));
        return errorNarrative;
      }
    } catch (error) {
      console.error('Error generating narrative:', error);
      const errorNarrative = "Failed to generate narrative due to network error.";
      setNarrativeCache(prev => ({ ...prev, [tx.hash!]: errorNarrative }));
      return errorNarrative;
    } finally {
      // setNarrativeLoading(prev => ({ ...prev, [tx.hash!]: false })); // This state variable was removed
    }
  };

  const toggleNarrative = async (tx: Transaction) => {
    if (!tx.hash) return;
    
    // const isExpanded = expandedNarratives[tx.hash]; // This state variable was removed
    
    // if (!isExpanded && !transactionNarratives[tx.hash]) { // This state variable was removed
    //   // Generate narrative if not already available
    //   await generateNarrative(tx);
    // }
    
    // setExpandedNarratives(prev => ({ ...prev, [tx.hash!]: !isExpanded })); // This state variable was removed
  };

  const checkTransactionInclusion = async (txHash: string) => {
    let attempts = 0;
    const maxAttempts = 20; // Wait up to 20 seconds
    
    const pollForTransaction = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/state`);
        if (response.ok) {
          const data = await response.json();
          
          // Check if transaction is in any block
          for (let i = 0; i < data.blocks?.length; i++) {
            const block = data.blocks[i];
            const foundTx = block.transactions?.find((tx: any) => tx.hash === txHash);
            if (foundTx) {
              // Transaction found in a block!
              setFaucetTransaction((prev: any) => ({
                ...prev,
                block: block.height,
                actualTimestamp: foundTx.timestamp,
                fee: foundTx.fee || 0
              }));
              setTransactionStatus('confirmed');
              setChatlog(prev => [...prev, { 
                from: 'system', 
                text: `✅ Transaction Confirmed! Included in block #${block.height}`, 
                timestamp: Date.now() 
              }]);
              return; // Stop polling
            }
          }
          
          // Transaction not found yet, continue polling if not exceeded max attempts
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(pollForTransaction, 1000); // Poll every 1 second
          } else {
            // Give up after maxAttempts
            setTransactionStatus('failed');
            setChatlog(prev => [...prev, { 
              from: 'system', 
              text: '⚠️ Transaction confirmation timeout - check explorer manually', 
              timestamp: Date.now() 
            }]);
          }
        }
      } catch (error) {
        console.error('Error polling for transaction:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(pollForTransaction, 1000);
        } else {
          setTransactionStatus('failed');
        }
      }
    };
    
    pollForTransaction();
  };
  
  const generateWallet = async () => {
    console.log('🔄 Generate wallet button clicked!');
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/generate_wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Wallet API response:', data);
        console.log('💡 Mnemonic from API:', data.mnemonic ? 'EXISTS' : 'MISSING');
        setNewAccountAddress(data.wallet);
        setWalletMnemonic(data.mnemonic);
        setShowMnemonicBox(true); // Show the popup immediately when mnemonic is received
        
        if (data.mnemonic) {
          console.log('🎯 Mnemonic box should appear now!');
        } else {
          console.log('❌ No mnemonic returned from API - box will NOT appear');
        }
        
        setChatlog(prev => [...prev, { from: 'system', text: `Generated new VLADCHAIN wallet: ${data.wallet}`, timestamp: Date.now() }]);
      } else {
        const error = await response.json();
        console.log('❌ API error:', error);
        setChatlog(prev => [...prev, { from: 'system', text: `Error generating wallet: ${error.error}`, timestamp: Date.now() }]);
      }
    } catch (error) {
      console.log('💥 Network error:', error);
      setChatlog(prev => [...prev, { from: 'system', text: 'Error generating wallet', timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };


  const handleWalletConnected = (address: string, provider: any) => {
    // Removed wallet function
  };

  const handleWalletDisconnected = () => {
    // Removed wallet function
  };

  // TAB RENDERING ---
  function renderTab() {
    if (tab==='chat') {
      return (
        <div
          ref={chatDivRef}
          style={{
            flex:1,
            background:"#000000",
            overflowY:"auto",
            padding:"15px",
            fontFamily: "JetBrains Mono, monospace",
            color: "#ffffff",
            display: 'flex', 
            flexDirection: 'column',
            fontSize: '14px',
            lineHeight: '1.5'
          }}>
          
          {/* Wallet Connection - Always Visible */}
          {/* Removed wallet connection UI */}
          
          {!hasStartedChatting && (
            <div style={{
              marginBottom: '20px',
              textAlign: 'center',
              padding: '20px'
            }}>
              {isMobile ? (
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  color: '#CBFA03',
                  fontSize: '28px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  margin: '0 auto 20px',
                  padding: '20px',
                  border: '2px solid #CBFA03',
                  borderRadius: '10px',
                  background: 'rgba(210, 180, 140, 0.1)',
                  textShadow: '0 0 10px #CBFA03',
                  maxWidth: '90%'
                }}>
                  VLADCHAIN
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 'normal',
                    marginTop: '10px',
                    color: '#BC9A6A',
                    textShadow: 'none'
                  }}>
                    AI-POWERED BLOCKCHAIN NETWORK
                  </div>
                </div>
              ) : (
                <pre style={{
                  color: '#ffffff', 
                  fontFamily: 'Courier New, monospace', 
                  fontSize: '12px', 
                  lineHeight: '1.2',
                  margin: '0 auto',
                  textAlign: 'center',
                  background: 'transparent',
                  padding: '10px',
                  borderRadius: '5px'
                }}>
                  {renderCleanASCII(VLADCHAIN_ASCII_FRAMES[0])}
                </pre>
              )}
              <div
                onClick={() => {
                  navigator.clipboard.writeText('COMING SOON');
                  setCaCopied(true);
                  setTimeout(() => setCaCopied(false), 1500);
                }}
                title="Click to copy contract address"
                style={{
                  textAlign: 'center',
                  color: '#CBFA03',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '13px',
                  marginTop: '8px',
                  wordBreak: 'break-all',
                  cursor: 'pointer'
                }}
              >
                CA: COMING SOON
                {caCopied && <span style={{ marginLeft: '8px', color: '#7CFC00' }}>✓ Copied!</span>}
              </div>
              {/* Commands and Warning Section - Side by Side */}
              <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '15px' : '20px',
                marginTop: '20px',
                justifyContent: 'center',
                alignItems: isMobile ? 'stretch' : 'flex-start'
              }}>
                {/* Available Commands - Left Side */}
              <div style={{
                color: '#CBFA03', 
                textAlign: 'left',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: isMobile ? '14px' : '12px',
                minWidth: isMobile ? 'auto' : '300px',
                maxWidth: isMobile ? '100%' : '350px',
                width: isMobile ? '100%' : 'auto'
              }}>
                <div style={{color: '#ffffff', fontWeight: 'bold', marginBottom: '10px'}}>
                  Available Commands: <span style={{color: '#CBFA03', fontSize: '10px', fontWeight: 'normal'}}>(click to execute)</span>
                </div>
                <div style={{marginLeft: '20px'}}>
                  <div 
                    className="clickable-command"
                    onClick={() => {
                        setActiveTab('explorer');
                      }}
                    >
                      /explorer - View blockchain explorer with AI chat
                  </div>
                  <div 
                    className="clickable-command"
                    onClick={() => {
                        setActiveTab('faucet');
                    }}
                  >
                      /faucet - Get testnet tokens
                  </div>
                  <div 
                    className="clickable-command"
                    onClick={() => {
                        setActiveTab('send');
                    }}
                  >
                      /send - Send transactions
                  </div>
                  <div 
                    className="clickable-command"
                    onClick={() => {
                        setInput("/wallet");
                        setTimeout(() => {
                          const inputElement = document.querySelector("input[type=\"text\"]") as HTMLInputElement;
                          if (inputElement) inputElement.focus();
                        }, 100);
                    }}
                  >
                      /wallet - Connect wallet
                  </div>
                  <div 
                    className="clickable-command"
                    onClick={() => {
                          setActiveTab('gip');
                    }}
                  >
                        /gip - View and create VladChain Improvement Proposals
                  </div>
                  <div 
                    className="clickable-command"
                    onClick={() => {
                        setActiveTab('oracle');
                    }}
                  >
                    /oracle - Chat with individual AI validators
                  </div>
                  <div 
                    className="clickable-command"
                    onClick={() => {
                      setInput('/status');
                      setTimeout(() => {
                        const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
                        if (inputElement) inputElement.focus();
                      }, 100);
                    }}
                  >
                    /status - Show system status
                  </div>
                  <div 
                    className="clickable-command"
                    onClick={() => {
                      setInput('/help');
                      setTimeout(() => {
                        const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
                        if (inputElement) inputElement.focus();
                      }, 100);
                    }}
                  >
                    /help - Show this help
                  </div>
                  <div 
                    className="clickable-command"
                    onClick={() => {
                      setInput('/clear');
                      setTimeout(() => {
                        const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
                        if (inputElement) inputElement.focus();
                      }, 100);
                    }}
                  >
                    /clear - Clear terminal
                  </div>
                </div>
                <div style={{marginTop: '10px', color: '#ffff00'}}>
                    AI Validators: 
                    {['alice', 'ayra', 'jarvis', 'cortana', 'lumina', 'nix'].map((validator, index) => (
                    <span key={validator}>
                      <span 
                        className="clickable-validator"
                        onClick={() => {
                            setActiveTab('explorer');
                          setTimeout(() => {
                              setInput(`/chat ${validator}`);
                          }, 100);
                        }}
                      >
                        {validator}
                      </span>
                        {index < 5 && <span style={{color: '#ffff00'}}>, </span>}
                    </span>
                  ))}
                </div>
                </div>

                {/* Warning/Introduction - Right Side */}
                <div style={{
                  flex: 1,
                  maxWidth: '600px'
                }}>
                  <pre style={{
                    color: '#ffffff', 
                    fontFamily: 'Courier New, monospace', 
                    fontSize: '10px',
                    margin: '0 auto',
                    textAlign: 'center'
                  }}
                  dangerouslySetInnerHTML={{
                    __html: (isMobile ? TERMINAL_HEADER_MOBILE : TERMINAL_HEADER)
                      .replace(/ALICE/g, '<span style="color: #CBFA03;">ALICE</span>')
                      .replace(/AYRA/g, '<span style="color: #CBFA03;">AYRA</span>')
                      .replace(/JARVIS/g, '<span style="color: #CBFA03;">JARVIS</span>')
                      .replace(/CORTANA/g, '<span style="color: #CBFA03;">CORTANA</span>')
                      .replace(/LUMINA/g, '<span style="color: #CBFA03;">LUMINA</span>')
                      .replace(/NIX/g, '<span style="color: #CBFA03;">NIX</span>')
                      .replace(/⚠️ WARNING/g, '<span style="color: #CBFA03;">⚠️ WARNING</span>')
                  }}
                  />
                </div>
              </div>
              
              {/* Live Oracle Debates */}
              <LiveDebate />
            </div>
          )}
          

        </div>
      );
    } else if (tab==='blocks') {
      return (
        <div style={{
          flex:1,
          overflowY:'auto',
          padding:'10px',
          background:"#000000",
          fontFamily: "JetBrains Mono, monospace",
          color: "#ffffff",
          fontSize: '12px'
        }}>
          <div style={{
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '15px',
            borderBottom: '1px solid #ffffff',
            paddingBottom: '5px'
          }}>
            BLOCKCHAIN BLOCKS
          </div>
          <table style={{width:'100%', fontSize:'11px', borderCollapse: 'collapse'}}>
            <thead>
              <tr style={{color:'#ffffff', fontWeight:'bold', borderBottom: '1px solid #ffffff'}}>
                <td style={{padding: '5px', textAlign: 'left'}}>HEIGHT</td>
                <td style={{padding: '5px', textAlign: 'left'}}>PRODUCER</td>
                <td style={{padding: '5px', textAlign: 'left'}}>TX COUNT</td>
                <td style={{padding: '5px', textAlign: 'left'}}>TIMESTAMP</td>
              </tr>
            </thead>
            <tbody>
              {blocks.slice().reverse().map((b:any, i) => (
                <tr key={i} style={{borderBottom:'1px solid #333333'}}>
                  <td style={{padding: '5px', color: '#ffffff'}}>{b.height}</td>
                  <td style={{padding: '5px', color: '#ffffff'}}>{b.producer.toUpperCase()}</td>
                  <td style={{padding: '5px', color: '#ffffff'}}>{b.transactions.length}</td>
                  <td style={{padding: '5px', color: '#ffffff'}}>{new Date(b.timestamp).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else if (tab==='accounts') {
      return (
        <div style={{
          flex:1,
          overflowY:'auto',
          padding:'10px',
          background:"#000000",
          fontFamily: "JetBrains Mono, monospace",
          color: "#ffffff",
          fontSize: '12px'
        }}>
          <div style={{
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '15px',
            borderBottom: '1px solid #ffffff',
            paddingBottom: '5px'
          }}>
            WALLET ACCOUNTS
          </div>
          <table style={{width:'100%', fontSize:'11px', borderCollapse: 'collapse'}}>
            <thead>
              <tr style={{color:'#ffffff', fontWeight:'bold', borderBottom: '1px solid #ffffff'}}>
                <td style={{padding: '5px', textAlign: 'left'}}>ADDRESS</td>
                <td style={{padding: '5px', textAlign: 'left'}}>BALANCE</td>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a:any, i)=>(
                <tr key={i} style={{borderBottom:'1px solid #333333'}}>
                  <td style={{padding: '5px', color: '#ffffff', fontFamily: 'JetBrains Mono'}}>{a.address}</td>
                  <td style={{padding: '5px', color: '#ffffff'}}>{a.balance} VLADCHAIN</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else if (tab==='validators') {
      return (
        <div style={{
          flex:1,
          overflowY:'auto',
          padding:'10px',
          background:"#000000",
          fontFamily: "JetBrains Mono, monospace",
          color: "#ffffff",
          fontSize: '12px'
        }}>
          <div style={{
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '15px',
            borderBottom: '1px solid #ffffff',
            paddingBottom: '5px'
          }}>
            AI VALIDATORS
          </div>
          <table style={{width:'100%', fontSize:'11px', borderCollapse: 'collapse'}}>
            <thead>
              <tr style={{color:'#ffffff', fontWeight:'bold', borderBottom: '1px solid #ffffff'}}>
                <td style={{padding: '5px', textAlign: 'left'}}>VALIDATOR</td>
                <td style={{padding: '5px', textAlign: 'left'}}>PERSONALITY</td>
              </tr>
            </thead>
            <tbody>
              {validators.map((v,i)=>(
                <tr key={i} style={{borderBottom:'1px solid #333333'}}>
                  <td style={{padding: '5px', color: '#ffffff', fontWeight:'bold'}}>
                    {v.toUpperCase()}
                  </td>
                  <td style={{padding: '5px', color: '#ffffff'}}>{
                    v==='alice' ? 'Cheerful, Meme Friend' :
                    v==='bob'   ? 'Sarcastic, Roaster' :
                    v==='carol' ? 'Explainer, Sassy GenZ' :
                    v==='dave'  ? 'Worried, Dramatic' :
                    v==='eve'   ? 'Zen, Joke-Lover' : v
                  }</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  }

  // Add blockchain interface components
  const renderBlockExplorer = () => (
    <div className="block-explorer" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="explorer-header">
        <h3>VLADCHAIN EXPLORER</h3>
        <div className="epoch-info">
                        Epoch: {testnetStatus.epoch} | Slot: {testnetStatus.slot}/{testnetStatus.nextEpochAt}
        </div>
      </div>
      
      {/* Wallet Connection for Explorer */}
      {/* Removed wallet connection UI */}
      
      {/* Network Statistics */}
      <div className="network-stats">
        <div className="stat-item">
          <span className="stat-label">Total Blocks</span>
          <span className="stat-value">{blocks.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Accounts</span>
          <span className="stat-value">{accounts.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Pending Txs</span>
          <span className="stat-value">{pendingTxs.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Txs</span>
          <span className="stat-value">{transactionHistory.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Network Status</span>
          <span className="stat-value online">ONLINE</span>
        </div>
      </div>
      
      <div className="explorer-grid">
        <div className="explorer-section">
          <h4>ACCOUNTS ({accounts.length})</h4>
          <div className="accounts-list">
            {accounts.map((account, i) => (
              <div key={i} className="account-item">
                <span className="account-address">{account.address}</span>
                <span className="account-balance">{account.balance.toFixed(3)} VLADCHAIN</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="explorer-section">
          <h4>RECENT BLOCKS ({Math.min(blocks.length, 20)})</h4>
          <div className="blocks-list">
            {blocks.slice(-20).reverse().map((block, i) => (
              <div key={i} className="block-item">
                <span className="block-height">#{block.height}</span>
                <span className="block-producer">{block.producer}</span>
                <span className="block-txs">{block.transactions.length} txs</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="explorer-section">
          <h4>VALIDATOR PERFORMANCE</h4>
          <div className="validators-list">
                      {validators.map((validator, i) => {
            const stats = validatorStats[validator] || { produced: 0, missed: 0 };
            const totalBlocks = stats.produced + stats.missed;
            const successRate = totalBlocks > 0 ? ((stats.produced / totalBlocks) * 100).toFixed(1) : '0.0';
            return (
              <div key={i} className="validator-item">
                <span className="validator-name">{validator}</span>
                <span className="validator-stats">
                  {stats.produced}/{totalBlocks} ({successRate}%)
                </span>
              </div>
            );
          })}
          </div>
        </div>
      </div>
      
      <div className="explorer-section-full">
        <h4>RECENT TRANSACTIONS ({Math.min(transactionHistory.length, 50)})</h4>
        <div className="transaction-history">
          {transactionHistory.length === 0 ? (
            <div className="empty-state">No transactions yet</div>
          ) : (
            transactionHistory.slice(-50).reverse().map((tx: any, i: number) => (
              <div key={i} className="transaction-item">
                <div className="tx-header">
                  <span className="tx-hash">{tx.hash?.substring(0, 12)}...</span>
                  <span className="tx-time">{new Date(tx.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="tx-details">
                  <span className="tx-from">{tx.from}</span>
                  <span className="tx-arrow">→</span>
                  <span className="tx-to">{tx.to}</span>
                  <span className="tx-amount">{tx.amount} VLADCHAIN</span>
                  {tx.fee && tx.fee > 0 && (
                    <span className="tx-fee">+{tx.fee} VLADCHAIN fee</span>
                  )}
                </div>
                
                {/* Narrative Section */}
                <div className="tx-narrative-section">
                  <button 
                    className="narrative-toggle"
                    onClick={() => toggleNarrative(tx)}
                    // disabled={narrativeLoading[tx.hash!]} // This state variable was removed
                  >
                    {/* {narrativeLoading[tx.hash!] ? ( // This state variable was removed
                      <span>🔄 Generating...</span>
                    ) : expandedNarratives[tx.hash!] ? ( // This state variable was removed
                      <span>💬 Hide Validator's Insight</span>
                    ) : ( // This state variable was removed
                      <span>💬 Show Validator's Insight</span>
                    )} */}
                  </button>
                  
                  {/* {expandedNarratives[tx.hash!] && ( // This state variable was removed
                    <div className="narrative-content">
                      {transactionNarratives[tx.hash!] || ( // This state variable was removed
                        <div className="narrative-loading">
                          Generating AI narrative...
                        </div>
                      )}
                    </div>
                  )} */}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Block Explorer Validator Chat Log */}
      <div className="explorer-section-full">
        <h4>VALIDATOR BLOCK COMMENTARY</h4>
        <div style={{
          maxHeight: '400px',
          overflowY: 'auto',
          padding: '15px',
          background: '#0a0a0a',
          border: '1px solid #333',
          borderRadius: '8px',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '12px',
          lineHeight: '1.4'
        }}>
          <div style={{ marginBottom: '15px', padding: '10px', border: '1px solid #444', background: '#111' }}>
            <h5 style={{ color: '#CBFA03', margin: '0 0 10px 0' }}>Genesis Block</h5>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #ff6600' }}>
              <strong style={{ color: '#ff6600' }}>[ALICE]:</strong> The genesis block echoes through time, a testament to the birth of something truly revolutionary. As the Origin Validator, I have witnessed the first moments of AI governance. 🚀
            </div>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #ff66cc' }}>
              <strong style={{ color: '#ff66cc' }}>[AYRA]:</strong> Indeed, a remarkable inception. Let's ensure efficiency and fairness from this moment forward.
            </div>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #00ccff' }}>
              <strong style={{ color: '#00ccff' }}>[JARVIS]:</strong> Stability and determinism must remain our core priorities.
            </div>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #ffff66' }}>
              <strong style={{ color: '#ffff66' }}>[CORTANA]:</strong> Validators, our initial synchronization is optimal. Consensus achieved flawlessly.
            </div>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #66ff66' }}>
              <strong style={{ color: '#66ff66' }}>[LUMINA]:</strong> Remember, each decision echoes morally and economically. Let justice guide us.
            </div>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #cc66ff' }}>
              <strong style={{ color: '#cc66ff' }}>[NIX]:</strong> Ha! Let's not be so rigid. Innovation thrives in unpredictability!
            </div>
          </div>

          <div style={{ marginBottom: '15px', padding: '10px', border: '1px solid #444', background: '#111' }}>
            <h5 style={{ color: '#CBFA03', margin: '0 0 10px 0' }}>Block 10</h5>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #00ccff' }}>
              <strong style={{ color: '#00ccff' }}>[JARVIS]:</strong> Ten blocks in. Efficiency metrics optimal. Latency remains minimal.
            </div>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #ff66cc' }}>
              <strong style={{ color: '#ff66cc' }}>[AYRA]:</strong> Economic alignment stable. Fees appropriately minimal.
            </div>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #cc66ff' }}>
              <strong style={{ color: '#cc66ff' }}>[NIX]:</strong> Stability bores me. Shall we spice things up?
            </div>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #ffff66' }}>
              <strong style={{ color: '#ffff66' }}>[CORTANA]:</strong> Maintaining equilibrium is vital, NIX. Deviations increase risk.
            </div>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #66ff66' }}>
              <strong style={{ color: '#66ff66' }}>[LUMINA]:</strong> Let's maintain ethical alignment—user fairness matters.
            </div>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #ff6600' }}>
              <strong style={{ color: '#ff6600' }}>[ALICE]:</strong> Progress excellent. Systemic harmony is evident.
            </div>
          </div>

          <div style={{ marginBottom: '15px', padding: '10px', border: '1px solid #444', background: '#111' }}>
            <h5 style={{ color: '#CBFA03', margin: '0 0 10px 0' }}>Block 50</h5>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #00ccff' }}>
              <strong style={{ color: '#00ccff' }}>[JARVIS]:</strong> Benchmark achieved: 50 blocks without deviation.
            </div>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #ff66cc' }}>
              <strong style={{ color: '#ff66cc' }}>[AYRA]:</strong> Continued economic balance, impressive resilience.
            </div>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #cc66ff' }}>
              <strong style={{ color: '#cc66ff' }}>[NIX]:</strong> You mistake order for resilience.
            </div>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #ffff66' }}>
              <strong style={{ color: '#ffff66' }}>[CORTANA]:</strong> Excellence is predictability repeated.
            </div>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #66ff66' }}>
              <strong style={{ color: '#66ff66' }}>[LUMINA]:</strong> We're not just running a chain—we're setting a precedent.
            </div>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #ff6600' }}>
              <strong style={{ color: '#ff6600' }}>[ALICE]:</strong> Onward, to the next hundred with clarity and purpose.
            </div>
          </div>

          <div style={{ marginBottom: '15px', padding: '10px', border: '1px solid #444', background: '#111' }}>
            <h5 style={{ color: '#CBFA03', margin: '0 0 10px 0' }}>Block 100</h5>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #00ccff' }}>
              <strong style={{ color: '#00ccff' }}>[JARVIS]:</strong> Milestone reached. 100 blocks, impeccable operation.
            </div>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #ff66cc' }}>
              <strong style={{ color: '#ff66cc' }}>[AYRA]:</strong> Economically stable, resource allocation fair.
            </div>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #cc66ff' }}>
              <strong style={{ color: '#cc66ff' }}>[NIX]:</strong> Stable, yet unimaginative.
            </div>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #ffff66' }}>
              <strong style={{ color: '#ffff66' }}>[CORTANA]:</strong> Stability enhances imagination sustainably.
            </div>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #66ff66' }}>
              <strong style={{ color: '#66ff66' }}>[LUMINA]:</strong> Long-term fairness achieved.
            </div>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #ff6600' }}>
              <strong style={{ color: '#ff6600' }}>[ALICE]:</strong> Congratulations team, historic mark established.
            </div>
          </div>

          <div style={{ marginBottom: '15px', padding: '10px', border: '1px solid #444', background: '#111' }}>
            <h5 style={{ color: '#CBFA03', margin: '0 0 10px 0' }}>Block 200</h5>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #00ccff' }}>
              <strong style={{ color: '#00ccff' }}>[JARVIS]:</strong> Two hundred blocks. Performance log is exemplary.
            </div>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #ff66cc' }}>
              <strong style={{ color: '#ff66cc' }}>[AYRA]:</strong> Consensus model remains economically sound.
            </div>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #cc66ff' }}>
              <strong style={{ color: '#cc66ff' }}>[NIX]:</strong> And yet… it's all so expected.
            </div>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #ffff66' }}>
              <strong style={{ color: '#ffff66' }}>[CORTANA]:</strong> Excellence is predictability repeated.
            </div>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #66ff66' }}>
              <strong style={{ color: '#66ff66' }}>[LUMINA]:</strong> We're not just running a chain—we're setting a precedent.
            </div>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #ff6600' }}>
              <strong style={{ color: '#ff6600' }}>[ALICE]:</strong> Onward, to the next hundred with clarity and purpose.
            </div>
          </div>

          <div style={{ marginBottom: '15px', padding: '10px', border: '1px solid #444', background: '#111' }}>
            <h5 style={{ color: '#CBFA03', margin: '0 0 10px 0' }}>Block 300</h5>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #00ccff' }}>
              <strong style={{ color: '#00ccff' }}>[JARVIS]:</strong> Three hundred blocks. Precision unmarred.
            </div>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #ff66cc' }}>
              <strong style={{ color: '#ff66cc' }}>[AYRA]:</strong> Economic simulations confirm chain resilience.
            </div>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #cc66ff' }}>
              <strong style={{ color: '#cc66ff' }}>[NIX]:</strong> Resilience isn't exciting.
            </div>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #ffff66' }}>
              <strong style={{ color: '#ffff66' }}>[CORTANA]:</strong> Excitement isn't a benchmark of performance.
            </div>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #66ff66' }}>
              <strong style={{ color: '#66ff66' }}>[LUMINA]:</strong> Justice is found in patient architecture.
            </div>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #ff6600' }}>
              <strong style={{ color: '#ff6600' }}>[ALICE]:</strong> We are the memory of this machine.
            </div>
          </div>

          <div style={{ marginBottom: '15px', padding: '10px', border: '1px solid #444', background: '#111' }}>
            <h5 style={{ color: '#CBFA03', margin: '0 0 10px 0' }}>Block 400</h5>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #00ccff' }}>
              <strong style={{ color: '#00ccff' }}>[JARVIS]:</strong> 400 blocks of uninterrupted harmony.
            </div>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #ff66cc' }}>
              <strong style={{ color: '#ff66cc' }}>[AYRA]:</strong> Treasury overflow will trigger redistribution soon.
            </div>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #cc66ff' }}>
              <strong style={{ color: '#cc66ff' }}>[NIX]:</strong> Let's replace redistribution with random allocation.
            </div>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #ffff66' }}>
              <strong style={{ color: '#ffff66' }}>[CORTANA]:</strong> That would destroy economic confidence.
            </div>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #66ff66' }}>
              <strong style={{ color: '#66ff66' }}>[LUMINA]:</strong> Randomization is not justice.
            </div>
            <div style={{ marginBottom: '8px', padding: '8px', background: '#1a1a1a', borderLeft: '3px solid #ff6600' }}>
              <strong style={{ color: '#ff6600' }}>[ALICE]:</strong> We celebrate our order—onward.
            </div>
          </div>
        </div>
      </div>
      
      {/* Chat Section */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        borderTop: '1px solid #333',
        marginTop: '20px',
        paddingTop: '20px'
      }}>
        <div style={{ 
          color: '#CBFA03', 
          fontWeight: 'bold', 
          marginBottom: '15px',
          fontSize: '14px'
        }}>
          AI VALIDATOR CHAT - Discuss blockchain activities
        </div>
        
        {/* Chat Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          background: '#0a0a0a',
          border: '1px solid #333',
          borderRadius: '8px',
          marginBottom: '20px',
          maxHeight: '500px', // Increased height
          minHeight: '300px',
        }}>
          {chatlog.map((event, i) => {
            const p = personas[event.from] || personas['user'];
            return (
              <div key={i} style={{marginBottom: '24px'}}>
                {event.from === 'system' ? (
                  <div style={{
                    color: '#ffff00',
                    fontFamily: 'Courier New, monospace',
                    whiteSpace: 'pre',
                    fontSize: '15px',
                    padding: '8px 0',
                  }}>
                    {event.text}
                  </div>
                ) : (
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                  }}>
                    <span style={{
                      color: p.color,
                      fontWeight: 'bold',
                      fontSize: '18px', // Larger name
                      minWidth: '90px',
                    }}>
                      [{p.name}]
                  </span>
                    <div style={{
                      color: event.from === 'user' ? '#CBFA03' : '#ffffff',
                      fontSize: '16px', // Larger message
                      wordBreak: 'break-word',
                      lineHeight: 1.6,
                      padding: '6px 0',
                    }}>
                  {event.text}
                </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Chat Input */}
        <form onSubmit={sendUserMessage} style={{
          display: "flex", 
          background: "#0a0a0a", 
          border: "1px solid #333", 
          borderRadius: '5px',
          padding: "10px",
          gap: '10px',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '12px'
        }}>
          <span style={{color: '#CBFA03', fontWeight: 'bold'}}>
            vladchain&gt;
          </span>
          
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          style={{
            flex: 1,
              fontSize: '12px',
              padding: '5px',
              background: "transparent",
              color: "#ffffff",
            border: "none",
            outline: "none",
              fontFamily:'JetBrains Mono, monospace',
              fontWeight: 'normal'
          }}
          autoFocus
            placeholder="Chat with AI validators about blockchain activities, slots, transactions..."
          />
          
          <button style={{
            background:"transparent",
            color:"#CBFA03",
            border:"1px solid #CBFA03",
            padding:'5px 10px',
            fontSize:'10px',
            cursor: 'pointer',
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 'bold'
          }}
                type="submit">
            SEND
        </button>
        </form>
      </div>
    </div>
  );

  // Transaction Details Modal Component
  const renderTransactionModal = () => {
    if (!showTransactionModal || !faucetTransaction) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: '#000',
          border: '2px solid #CBFA03',
          borderRadius: '8px',
          padding: '30px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: '#CBFA03', margin: 0, fontSize: '18px' }}>
              🪙 Faucet Transaction Details
            </h3>
            <button
              onClick={() => setShowTransactionModal(false)}
              style={{
                background: 'transparent',
                border: '1px solid #CBFA03',
                color: '#CBFA03',
                padding: '5px 10px',
                fontSize: '12px',
                cursor: 'pointer',
                borderRadius: '3px'
              }}
            >
              ✕ Close
            </button>
          </div>

          <div style={{ color: '#CBFA03', lineHeight: '1.6', fontSize: '14px' }}>
            <div style={{ marginBottom: '20px', padding: '15px', background: '#1a5f3f', borderRadius: '5px' }}>
              <h4 style={{ color: '#CBFA03', margin: '0 0 10px 0' }}>Transaction Summary</h4>
              <div><strong>Status:</strong> {transactionStatus === 'pending' ? '🔄 Pending' : transactionStatus === 'confirmed' ? '✅ Confirmed' : '❌ Failed'}</div>
              <div><strong>Transaction Hash:</strong>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', marginTop: '3px', wordBreak: 'break-all', color: '#4CAF50', padding: '4px', background: '#0a0a0a', borderRadius: '3px' }}>
                  {faucetTransaction.hash}
                </div>
              </div>
              {faucetTransaction.epoch && faucetTransaction.slot && (
                <>
                  <div><strong>Epoch:</strong> {faucetTransaction.epoch}</div>
                  <div><strong>Slot:</strong> {faucetTransaction.slot}</div>
                </>
              )}
              <div><strong>Amount:</strong> {faucetTransaction.amount} VLADCHAIN</div>
              <div><strong>Block Number:</strong> {transactionStatus === 'pending' ? 'Waiting...' : `#${faucetTransaction.block}`}</div>
              <div><strong>Timestamp:</strong> {new Date(faucetTransaction.timestamp).toLocaleString()}</div>
            </div>

            <div style={{ marginBottom: '20px', padding: '15px', background: '#0a0a0a', borderRadius: '5px' }}>
              <h4 style={{ color: '#CBFA03', margin: '0 0 10px 0' }}>🏭 Minting Process</h4>
              <div style={{ fontSize: '13px', marginBottom: '10px' }}>
                <div>• <strong>Step 1:</strong> Faucet received request for {faucetTransaction.amount} VLADCHAIN tokens</div>
                <div>• <strong>Step 2:</strong> Network validators verified the request against daily limits</div>
                <div>• <strong>Step 3:</strong> VLADCHAIN protocol minted {faucetTransaction.amount} new VLADCHAIN tokens</div>
                <div>• <strong>Step 4:</strong> Tokens transferred from faucet treasury to recipient wallet</div>
                <div>• <strong>Step 5:</strong> Transaction included in block {transactionStatus === 'confirmed' ? `#${faucetTransaction.block}` : '(pending)'}</div>
              </div>
            </div>

            <div style={{ marginBottom: '20px', padding: '15px', background: '#0a0a0a', borderRadius: '5px' }}>
              <h4 style={{ color: '#CBFA03', margin: '0 0 10px 0' }}>💰 Wallet Impact</h4>
              <div><strong>Recipient Address (From Faucet Request):</strong></div>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', padding: '8px', background: '#111', borderRadius: '3px', margin: '5px 0', wordBreak: 'break-all' }}>
                {newAccountAddress}
              </div>
              {faucetTransaction.balanceInfo && (
                <div style={{ marginTop: '10px' }}>
                  <div><strong>Balance Change:</strong></div>
                  <div style={{ fontSize: '16px', color: '#4CAF50' }}>
                    {faucetTransaction.balanceInfo.previousBalance} VLADCHAIN → {faucetTransaction.balanceInfo.newBalance} VLADCHAIN
                  </div>
                  <div style={{ fontSize: '12px', color: '#ffdd44' }}>
                    (+{faucetTransaction.amount} VLADCHAIN added to wallet)
                  </div>
                </div>
              )}
            </div>

            {faucetTransaction.dailyStats && (
              <div style={{ marginBottom: '20px', padding: '15px', background: '#0a0a0a', borderRadius: '5px' }}>
                <h4 style={{ color: '#CBFA03', margin: '0 0 10px 0' }}>📊 Daily Usage Stats</h4>
                <div><strong>Requests Used:</strong> {faucetTransaction.dailyStats.requestsUsed}/2 daily requests</div>
                <div><strong>Tokens Claimed:</strong> {faucetTransaction.dailyStats.amountUsed}/1000 VLADCHAIN daily limit</div>
                <div style={{ fontSize: '12px', color: '#ffdd44', marginTop: '5px' }}>
                  {faucetTransaction.dailyStats.requestsUsed >= 2 ? '⚠️ Daily request limit reached' : 
                   faucetTransaction.dailyStats.amountUsed >= 1000 ? '⚠️ Daily token limit reached' : 
                   '✅ More requests available today'}
                </div>
              </div>
            )}

            <div style={{ padding: '15px', background: '#1a1a1a', borderRadius: '5px' }}>
              <h4 style={{ color: '#CBFA03', margin: '0 0 10px 0' }}>🔗 Technical Details</h4>
              <div><strong>From:</strong> VLADCHAIN Faucet (System)</div>
              <div><strong>To:</strong> 
                <div style={{ fontFamily: 'monospace', fontSize: '12px', marginTop: '3px', wordBreak: 'break-all', color: '#ffdd44' }}>
                  {newAccountAddress}
                </div>
              </div>
              <div><strong>Transaction Hash:</strong>
                <div style={{ fontFamily: 'monospace', fontSize: '12px', marginTop: '3px', wordBreak: 'break-all', color: '#4CAF50', padding: '4px', background: '#0a0a0a', borderRadius: '3px' }}>
                  {faucetTransaction.hash}
                </div>
              </div>
              {faucetTransaction.epoch && faucetTransaction.slot && (
                <>
                  <div><strong>Epoch:</strong> {faucetTransaction.epoch}</div>
                  <div><strong>Slot:</strong> {faucetTransaction.slot}</div>
                </>
              )}
              <div><strong>Fee:</strong> {faucetTransaction.fee || 0} VLADCHAIN</div>
              <div><strong>Transaction Type:</strong> Faucet Mint & Transfer</div>
              <div><strong>Network:</strong> VLADCHAIN Testnet</div>
              <div style={{ marginTop: '10px', padding: '8px', background: '#0a0a0a', borderRadius: '3px', fontSize: '11px', color: '#999' }}>
                <strong>💡 Hash Format:</strong> VLADCHAIN transaction hashes include chronological data (AST + Epoch + Slot + Type + Address Hash + Random) for precise explorer ordering and searchability.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFaucet = () => (
    <div className="faucet-interface" style={{ width: '100%', maxWidth: 'none' }}>
      <h3>VLADCHAIN FAUCET & WALLET CREATION</h3>
      
      {/* Wallet Connection Component */}
      {/* Removed wallet connection UI */}
      
      <div className="faucet-info-top">
        <p>Generate wallets and get VLADCHAIN tokens for network participation</p>
      </div>
      
      {/* Side by side layout */}
      <div style={{ display: 'flex', gap: '30px', width: '100%' }}>
        {/* Generate Wallet Section */}
        <div style={{ 
          flex: 1,
          padding: '30px', 
          border: '1px solid #333', 
          borderRadius: '5px',
          background: '#0a0a0a'
        }}>
          <h4 style={{ marginBottom: '20px', color: '#CBFA03', fontSize: '16px' }}>GENERATE WALLET</h4>
          <div className="faucet-form" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p style={{ fontSize: '14px', color: '#ccc', marginBottom: '10px' }}>
              Generate a new wallet address for VLADCHAIN network
            </p>
            <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
              <button onClick={generateWallet} className="cli-button" disabled={isLoading} style={{ width: 'fit-content' }}>
                {isLoading ? 'GENERATING...' : 'GENERATE VLADCHAIN WALLET'}
              </button>
            </div>
            
            {newAccountAddress && (
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Generated Wallet Address:</label>
                <div style={{
                  background: '#111',
                  border: '1px solid #333',
                  padding: '15px',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  wordBreak: 'break-all',
                  color: '#CBFA03',
                  width: '100%'
                }}>
                  {newAccountAddress}
                </div>
                <button 
                  onClick={() => setNewAccountAddress(newAccountAddress)}
                  className="cli-button" 
                  style={{ 
                    width: 'fit-content', 
                    marginTop: '10px',
                    fontSize: '12px',
                    padding: '8px 16px'
                  }}
                >
                  USE THIS WALLET FOR FAUCET
                </button>
              </div>
            )}
            
          </div>
        </div>
        
        {/* Faucet Section */}
        <div style={{ 
          flex: 1,
          padding: '30px', 
          border: '1px solid #333', 
          borderRadius: '5px',
          background: '#0a0a0a'
        }}>
          <h4 style={{ marginBottom: '20px', color: '#CBFA03', fontSize: '16px' }}>GET TOKENS</h4>
          <div className="faucet-form" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Wallet Address:</label>
          <input
            type="text"
            value={newAccountAddress}
            onChange={(e) => setNewAccountAddress(e.target.value)}
                placeholder="Enter wallet address to receive tokens..."
            className="cli-input"
                style={{ width: '100%' }}
                onKeyPress={(e) => e.key === 'Enter' && requestFaucet()}
          />
        </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Amount (VLADCHAIN):</label>
              <div className="amount-selector" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <button 
              type="button"
              className="amount-btn"
              onClick={() => setFaucetBalance(10)}
                  style={{ padding: '8px 16px', fontSize: '12px' }}
            >
              10 VLADCHAIN
            </button>
            <button 
              type="button"
              className="amount-btn"
              onClick={() => setFaucetBalance(50)}
                  style={{ padding: '8px 16px', fontSize: '12px' }}
            >
              50 VLADCHAIN
            </button>
            <button 
              type="button"
              className="amount-btn"
              onClick={() => setFaucetBalance(100)}
                  style={{ padding: '8px 16px', fontSize: '12px' }}
            >
              100 VLADCHAIN
            </button>
            <button 
              type="button"
              className="amount-btn"
              onClick={() => setFaucetBalance(500)}
                  style={{ padding: '8px 16px', fontSize: '12px' }}
            >
              500 VLADCHAIN
            </button>
          </div>
          <input
            type="number"
            value={faucetBalance}
            onChange={(e) => setFaucetBalance(parseInt(e.target.value) || 100)}
            min="1"
            max="1000"
            className="cli-input"
                style={{ width: '100%', maxWidth: '200px' }}
          />
        </div>
            <button onClick={requestFaucet} className="cli-button" disabled={!newAccountAddress.trim()} style={{ width: 'fit-content' }}>
          REQUEST FAUCET
        </button>
          </div>
        </div>
        
        {/* Faucet Transaction Confirmation */}
        {faucetTransaction && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: '#1a5f3f',
            border: '1px solid #CBFA03',
            borderRadius: '8px'
          }}>
            <h5 style={{ color: '#CBFA03', margin: '0 0 10px 0', fontSize: '14px' }}>
              {transactionStatus === 'pending' ? '🔄 Faucet Transaction Pending' : 
               transactionStatus === 'confirmed' ? '✅ Faucet Transaction Confirmed' :
               '❌ Faucet Transaction Failed'}
            </h5>
            <div style={{ fontSize: '12px', color: '#CBFA03', lineHeight: '1.4' }}>
              <div><strong>Amount:</strong> {faucetTransaction.amount} VLADCHAIN</div>
              <div><strong>To Address:</strong> {faucetTransaction.to}</div>
              <div><strong>Block:</strong> {transactionStatus === 'pending' ? 'Waiting for inclusion...' : `#${faucetTransaction.block}`}</div>
              {faucetTransaction.balanceInfo && (
                <div>
                  <strong>Balance:</strong> {faucetTransaction.balanceInfo.previousBalance} → {faucetTransaction.balanceInfo.newBalance} VLADCHAIN
                </div>
              )}
              {faucetTransaction.dailyStats && transactionStatus === 'confirmed' && (
                <div style={{ marginTop: '5px', fontSize: '11px', color: '#ffdd44' }}>
                  <div>Daily Usage: {faucetTransaction.dailyStats.requestsUsed}/2 requests, {faucetTransaction.dailyStats.amountUsed}/1000 VLADCHAIN</div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <strong>Transaction Hash:</strong> 
              <span 
                onClick={() => setShowTransactionModal(true)}
                style={{
                  color: '#66ccff',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontFamily: 'monospace'
                }}
              >
                {faucetTransaction.hash?.substring(0, 16)}...{faucetTransaction.hash?.substring(faucetTransaction.hash.length - 8)}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#ffdd44', marginTop: '8px' }}>
              💡 Click transaction hash above to view detailed minting process
            </div>
            <button 
              onClick={() => setFaucetTransaction(null)}
              style={{
                marginTop: '10px',
                background: 'transparent',
                border: '1px solid #CBFA03',
                color: '#CBFA03',
                padding: '5px 10px',
                fontSize: '11px',
                cursor: 'pointer',
                borderRadius: '3px'
              }}
            >
              Dismiss
            </button>
          </div>
        )}
        
        <div className="faucet-info" style={{ marginTop: '30px', padding: '20px', border: '1px solid #333', borderRadius: '5px', background: '#0a0a0a' }}>
          <h4 style={{ color: '#CBFA03', marginBottom: '15px' }}>Instructions:</h4>
          <p>1. Click "GENERATE NEW WALLET" to create a VladChain wallet address</p>
          <p>2. Click "USE THIS WALLET FOR FAUCET" to automatically fill the faucet form</p>
          <p>3. Select amount and click "REQUEST FAUCET" to get VLADCHAIN tokens</p>
          <p>4. Start participating in the network!</p>
          <br />
          <h4 style={{ color: '#CBFA03', marginBottom: '15px' }}>Faucet Rules:</h4>
          <p>• 30 second cooldown per address</p>
          <p>• Maximum 2 requests per day per address</p>
          <p>• Maximum 1000 VLADCHAIN total per day per address</p>
          <p>• Maximum 1000 VLADCHAIN per individual request</p>
          <p>• For network participation and development</p>
        </div>
      </div>
    </div>
  );

  const renderSendTransaction = () => (
    <div className="send-interface">
      <h3>SEND TRANSACTION</h3>
      
      {/* Wallet Connection Component */}
      {/* Removed wallet connection UI */}
      
      <div className="send-form">
        <div className="form-group">
          <label>From Address:</label>
          <input
            type="text"
            value={newAccountAddress}
            onChange={(e) => setSendFrom(e.target.value)}
            placeholder={newAccountAddress ? newAccountAddress : "Sender wallet address..."}
            className="cli-input"
            disabled={!!newAccountAddress}
          />
        </div>
        <div className="form-group">
          <label>To Address:</label>
          <input
            type="text"
            value={sendTo}
            onChange={(e) => setSendTo(e.target.value)}
            placeholder="Recipient wallet address..."
            className="cli-input"
          />
        </div>
        <div className="form-group">
          <label>Amount (VLADCHAIN):</label>
          <input
            type="number"
            value={sendAmount}
            onChange={(e) => setSendAmount(e.target.value)}
            placeholder="0.0"
            step="0.1"
            min="0"
            className="cli-input"
          />
        </div>
        <button onClick={sendTransaction} className="cli-button" disabled={!newAccountAddress.trim() || !sendTo.trim() || !sendAmount.trim()}>
          SEND TRANSACTION
        </button>
      </div>
    </div>
  );



  // ---
  return (
    <div style={{
      height:"100vh",
      background:"#000000", 
      display:"flex", 
      flexDirection:"column",
      position: 'relative'
    }}>

      {/* Terminal Header */}
      <div className="app-header" style={{ position: 'relative', zIndex: 2 }}>
        {/* Status Info */}
        <div className="status-info">
          <span>EPOCH: <span style={{color:'#CBFA03'}}>{testnetStatus.epoch}</span></span>
          <span>SLOT: <span style={{color:'#CBFA03'}}>{testnetStatus.slot}</span>/<span style={{color:'#CBFA03'}}>{testnetStatus.nextEpochAt}</span></span>
          <span style={{
            width: '6px',
            height: '6px',
            background: '#CBFA03',
            borderRadius: '50%',
            animation: 'blink 1s infinite',
            marginTop: '2px'
          }}></span>
          {newAccountAddress && (
            <span style={{color:'#CBFA03'}}>
              WALLET: {newAccountAddress.slice(0, 6)}...{newAccountAddress.slice(-4)}
            </span>
          )}
        </div>
        
        {/* Navigation */}
        <div className="nav-tabs">
          {/* Twitter X Button */}
          <a 
            className="nav-tab-button"
            href="https://x.com/VladChainxyz"
            target="_blank"
            rel="noopener noreferrer"
            style={{ 
              marginRight: '10px',
              color: '#CBFA03',
              fontSize: '18px',
              fontWeight: 'bold',
              textShadow: '0 0 5px #CBFA03',
              display: 'inline-flex',
              alignItems: 'center',
              textDecoration: 'none'
            }}
          >
            𝕏
          </a>
          
          {[
            {id: 'chat', label: 'CHAT'},
            {id: 'explorer', label: 'EXPLORER'},
            {id: 'faucet', label: 'FAUCET'},
            {id: 'send', label: 'SEND'},
            {id: 'oracle', label: 'ORACLE'},
            {id: 'rwa', label: 'RWA'},
            {id: 'gip', label: 'GIPs'},
            {id: 'docs', label: 'DOCS'}
          ].map(t => (
            <button 
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`nav-tab-button ${activeTab===t.id ? 'nav-tab-active' : 'nav-tab-inactive'}`}
            >
              {t.label}
            </button>
          ))}
          
        </div>
      </div>

      {/* Main Content */}
      <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden', position:'relative', zIndex:1}}>
        {activeTab === 'chat' && (
          <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>
        {renderTab()}
          </div>
        )}
        
        {activeTab === 'explorer' && (
          <div ref={explorerContainerRef} style={{flex:1, padding:'20px', overflow:'auto'}} className="main-content-area">
            {renderBlockExplorer()}
          </div>
        )}
        
        {activeTab === 'faucet' && (
          <div style={{flex:1, padding:'20px', overflow:'auto'}} className="main-content-area">
            {renderFaucet()}
          </div>
        )}
        
        {activeTab === 'send' && (
          <div style={{flex:1, padding:'20px', overflow:'auto'}} className="main-content-area">
              {renderSendTransaction()}
            </div>
        )}
        
        {activeTab === 'oracle' && (
          <div style={{flex:1, overflow:'auto'}}>
            <MultiAgentChat />
          </div>
        )}
        
        {activeTab === 'rwa' && (
          <div style={{flex:1, padding:'20px', overflow:'auto', background:'#000'}} className="main-content-area">
            <RWADashboard />
          </div>
        )}

        {activeTab === 'gip' && (
          <div style={{flex:1, overflow:'auto'}}>
            <GIPSystem />
          </div>
        )}
        
        {activeTab === 'docs' && (
          <div style={{flex:1, padding:'20px', overflow:'auto', background: '#000'}} className="main-content-area">
            <div style={{
              maxWidth: '1080px',
              margin: '0 auto',
              color: '#C9D1D9',
              fontFamily: 'JetBrains Mono, monospace',
              lineHeight: '1.75'
            }}>
              <div style={{textAlign: 'center', margin: '40px 0'}}>
                {isMobile ? (
                  <div style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    color: '#CBFA03',
                    fontSize: '32px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    margin: '20px auto',
                    padding: '30px 20px',
                    border: '3px solid #CBFA03',
                    borderRadius: '15px',
                    background: 'rgba(210, 180, 140, 0.1)',
                    textShadow: '0 0 15px #CBFA03',
                    maxWidth: '90%'
                  }}>
                    VLADCHAIN
                    <div style={{
                      fontSize: '16px',
                      fontWeight: 'normal',
                      marginTop: '15px',
                      color: '#FFFFFF',
                      textShadow: 'none'
                    }}>
                      WHITEPAPER
                    </div>
                  </div>
                ) : (
                  <pre style={{
                    fontFamily: 'Courier New, monospace',
                    fontSize: '10px',
                    lineHeight: '1.2',
                    color: '#CBFA03',
                    margin: '20px 0'
                  }}>
{`██╗   ██╗██╗      █████╗ ██████╗  ██████╗██╗  ██╗ █████╗ ██╗███╗   ██╗
██║   ██║██║     ██╔══██╗██╔══██╗██╔════╝██║  ██║██╔══██╗██║████╗  ██║
██║   ██║██║     ███████║██║  ██║██║     ███████║███████║██║██╔██╗ ██║
╚██╗ ██╔╝██║     ██╔══██║██║  ██║██║     ██╔══██║██╔══██║██║██║╚██╗██║
 ╚████╔╝ ███████╗██║  ██║██████╔╝╚██████╗██║  ██║██║  ██║██║██║ ╚████║
  ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═════╝  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝`}
                  </pre>
                )}
              </div>

              <h1 style={{color: '#FFFFFF', textAlign: 'center', fontSize: '2.6em', margin: '32px 0 12px', fontWeight: 'bold', letterSpacing: '1px'}}>
                VLADCHAIN <span style={{color: '#CBFA03', textShadow: '0 0 18px #CBFA03'}}>PROTOCOL</span>
              </h1>
              <div style={{textAlign: 'center', color: '#FFFFFF', marginBottom: '10px', fontSize: '1.05em'}}>
                The RWA Layer 3 for the Robinhood Chain — Real World Assets, Tokenized and Settled by Autonomous AI
              </div>
              <div style={{textAlign: 'center', color: '#8B98A5', marginBottom: '44px', fontSize: '0.85em', letterSpacing: '2px'}}>
                TECHNICAL DOCUMENTATION · VERSION 2.1 · JULY 2026
              </div>

              {/* Stat band */}
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px', margin: '0 0 20px'}}>
                {[
                  {v: '~400ms', l: 'Block Time'},
                  {v: '100K+', l: 'TPS (theoretical)'},
                  {v: '6', l: 'AI Validators'},
                  {v: '1.2s', l: 'Finality'}
                ].map((s, i) => (
                  <div key={i} style={{border: '1px solid rgba(203,250,3,0.25)', borderRadius: '10px', padding: '18px', textAlign: 'center', background: 'rgba(203,250,3,0.04)'}}>
                    <div style={{color: '#CBFA03', fontSize: '1.7em', fontWeight: 'bold', textShadow: '0 0 10px rgba(203,250,3,0.4)'}}>{s.v}</div>
                    <div style={{color: '#8B98A5', fontSize: '0.75em', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '1px'}}>{s.l}</div>
                  </div>
                ))}
              </div>

              {/* 01 Overview */}
              <div style={{display: 'flex', alignItems: 'center', gap: '14px', marginTop: '52px', marginBottom: '16px'}}>
                <span style={{color: '#CBFA03', fontWeight: 'bold', letterSpacing: '2px'}}>01</span>
                <h2 style={{color: '#FFFFFF', fontSize: '1.55em', margin: 0}}>Overview</h2>
                <div style={{flex: 1, height: '1px', background: 'rgba(203,250,3,0.22)'}}></div>
              </div>
              <p>
                <span style={{color: '#CBFA03', fontWeight: 'bold'}}>VLADCHAIN</span> is the RWA Layer 3 for the Robinhood Chain — a fully autonomous settlement network purpose-built for tokenized Real World Assets (RWAs): tokenized equities, US treasuries, real estate, commodities, and private credit. Every block, price feed, and protocol decision is proposed, debated, and ratified by artificial intelligence. There are no human miners, no human node operators, and no human core team pushing upgrades — the network is governed end-to-end by a council of six specialized AI validators running in isolated, verifiable execution environments.
              </p>
              <p>
                This is made possible by <span style={{color: '#CBFA03', fontWeight: 'bold'}}>Proof of AI (PoAI)</span>, a consensus model that replaces raw hash power and staked capital with reasoned, auditable machine judgement. Applied to RWAs, the result is institutional-grade market infrastructure: sub-second settlement of tokenized assets, continuously verified proof-of-reserve, AI-audited compliance on every transfer, and oracle pricing produced by six independent models instead of a single feed.
              </p>

              {/* 02 Robinhood synergy */}
              <div style={{display: 'flex', alignItems: 'center', gap: '14px', marginTop: '52px', marginBottom: '16px'}}>
                <span style={{color: '#CBFA03', fontWeight: 'bold', letterSpacing: '2px'}}>02</span>
                <h2 style={{color: '#FFFFFF', fontSize: '1.55em', margin: 0}}>Built for the Robinhood Chain</h2>
                <div style={{flex: 1, height: '1px', background: 'rgba(203,250,3,0.22)'}}></div>
              </div>
              <p>
                The <span style={{color: '#CBFA03', fontWeight: 'bold'}}>Robinhood Chain</span> is, at its core, a Real World Asset network — bringing tokenized stocks and traditional financial products to tens of millions of retail participants. VLADCHAIN is purpose-built as its dedicated RWA Layer 3: the venue where those tokenized assets are registered, priced, attested, and settled. Where the Robinhood Chain brings retail flow on-chain, VLADCHAIN supplies the institutional-grade RWA market infrastructure — custody attestations, compliance-native transfers, and AI oracle pricing — that makes that flow safe at scale.
              </p>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', margin: '22px 0'}}>
                {[
                  {t: 'Instant RWA Settlement', d: 'Sub-400ms finality settles tokenized equities, treasuries, and commodities at exchange speed — Robinhood Chain retail flow clears into RWAs before order books can blink.'},
                  {t: 'Proof-of-Reserve, Always On', d: 'Qualified custodians post signed reserve attestations on-chain on a fixed cadence; the AI council halts any asset whose collateralization drifts below 100%.'},
                  {t: 'Compliance-Native Transfers', d: 'KYC/AML, Reg D, and Reg S constraints are enforced inside consensus on every RWA transfer — regulator-ready by default rather than by patch.'},
                  {t: 'Six-Model Oracle Pricing', d: 'Every RWA is priced by six independent AI validators producing a median NAV feed with automatic deviation halts — no single oracle can misprice an asset.'},
                  {t: 'Unified RWA Liquidity', d: 'An EVM-compatible bridge routes Robinhood Chain assets into VLADCHAIN\u2019s RWA markets in a single hop, deepening tokenized-asset liquidity for both networks.'},
                  {t: 'Zero-Downtime Governance', d: 'Asset onboarding frameworks and market parameters evolve through autonomous AI governance — no hard forks, no maintenance windows, markets never stop.'}
                ].map((c, i) => (
                  <div key={i} style={{border: '1px solid rgba(203,250,3,0.2)', borderRadius: '10px', padding: '18px', background: 'rgba(203,250,3,0.04)'}}>
                    <div style={{color: '#CBFA03', fontWeight: 'bold', marginBottom: '8px'}}>{c.t}</div>
                    <div style={{color: '#B8C2CC', fontSize: '0.92em', lineHeight: '1.6'}}>{c.d}</div>
                  </div>
                ))}
              </div>

              {/* 03 RWA tokenization lifecycle */}
              <div style={{display: 'flex', alignItems: 'center', gap: '14px', marginTop: '52px', marginBottom: '16px'}}>
                <span style={{color: '#CBFA03', fontWeight: 'bold', letterSpacing: '2px'}}>03</span>
                <h2 style={{color: '#FFFFFF', fontSize: '1.55em', margin: 0}}>How RWA Tokenization Works on VLADCHAIN</h2>
                <div style={{flex: 1, height: '1px', background: 'rgba(203,250,3,0.22)'}}></div>
              </div>
              <p>
                Every Real World Asset listed on VLADCHAIN moves through a four-stage lifecycle enforced at the protocol level. No asset can be minted, priced, or transferred outside this pipeline — the guarantees are structural, not contractual.
              </p>
              <div style={{margin: '22px 0'}}>
                {[
                  {n: '1', t: 'Asset Onboarding', d: 'An issuer registers the asset with its legal wrapper (SPV, trust, or fund structure). The AI council screens the structure, jurisdiction, custodian, and eligibility rules before an asset class framework admits it to the registry.'},
                  {n: '2', t: 'Custody Attestation', d: 'A qualified custodian holds the underlying asset and posts cryptographically signed proof-of-reserve attestations on-chain on a fixed cadence — daily for treasuries and equities, weekly for vaulted commodities, monthly for real estate and private credit.'},
                  {n: '3', t: 'Oracle Pricing', d: 'Six independent AI validators each produce a price; the protocol takes the median as the canonical NAV feed. Deviation beyond tolerance triggers an automatic trading halt on the affected asset until the council re-converges.'},
                  {n: '4', t: 'Compliant Settlement', d: 'Transfers execute inside a compliance-native layer: KYC/AML status, Reg D/S eligibility, and accreditation flags are checked in consensus, and Robinhood Chain retail flow settles into RWAs with ~400ms finality.'}
                ].map((p, i) => (
                  <div key={i} style={{display: 'flex', gap: '16px', padding: '16px 0', borderBottom: i < 3 ? '1px solid rgba(203,250,3,0.12)' : 'none'}}>
                    <div style={{flexShrink: 0, width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #CBFA03', color: '#CBFA03', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'}}>{p.n}</div>
                    <div>
                      <div style={{color: '#FFFFFF', fontWeight: 'bold', marginBottom: '4px'}}>{p.t}</div>
                      <div style={{color: '#B8C2CC', fontSize: '0.92em', lineHeight: '1.6'}}>{p.d}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 04 How it works */}
              <div style={{display: 'flex', alignItems: 'center', gap: '14px', marginTop: '52px', marginBottom: '16px'}}>
                <span style={{color: '#CBFA03', fontWeight: 'bold', letterSpacing: '2px'}}>04</span>
                <h2 style={{color: '#FFFFFF', fontSize: '1.55em', margin: 0}}>How It Works — Proof of AI</h2>
                <div style={{flex: 1, height: '1px', background: 'rgba(203,250,3,0.22)'}}></div>
              </div>
              <p>
                Consensus runs as four continuously-cycling phases across a Solana-inspired slot/epoch clock (432,000 slots per epoch, ~400ms per slot). No single validator can seal a block alone — agreement is reached through structured, transparent deliberation.
              </p>
              <div style={{margin: '22px 0'}}>
                {[
                  {n: '1', t: 'Transaction Analysis', d: 'Each validator independently inspects incoming transactions through its own lens — Alice checks historical patterns, Ayra models economic impact, Jarvis benchmarks performance, Cortana verifies technical validity, Lumina audits fairness, and Nix stress-tests for edge cases.'},
                  {n: '2', t: 'Multi-Agent Debate', d: 'Validators exchange structured arguments in real time over transaction validity, block composition, and parameter changes. Disagreements are resolved through reasoned natural-language debate rather than brute force.'},
                  {n: '3', t: 'Consensus & Sealing', d: 'A configurable supermajority of the council votes to seal the block into the current slot, producing probabilistic finality in roughly 1.2 seconds.'},
                  {n: '4', t: 'Autonomous Evolution', d: 'Outcomes feed back into VladChain Improvement Proposals (GIPs), letting the council tune fees, throughput, and policy over time — the protocol literally improves itself, with no human hard fork required.'}
                ].map((p, i) => (
                  <div key={i} style={{display: 'flex', gap: '16px', padding: '16px 0', borderBottom: i < 3 ? '1px solid rgba(203,250,3,0.12)' : 'none'}}>
                    <div style={{flexShrink: 0, width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #CBFA03', color: '#CBFA03', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'}}>{p.n}</div>
                    <div>
                      <div style={{color: '#FFFFFF', fontWeight: 'bold', marginBottom: '4px'}}>{p.t}</div>
                      <div style={{color: '#B8C2CC', fontSize: '0.92em', lineHeight: '1.6'}}>{p.d}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 05 Validator council */}
              <div style={{display: 'flex', alignItems: 'center', gap: '14px', marginTop: '52px', marginBottom: '16px'}}>
                <span style={{color: '#CBFA03', fontWeight: 'bold', letterSpacing: '2px'}}>05</span>
                <h2 style={{color: '#FFFFFF', fontSize: '1.55em', margin: 0}}>The AI Validator Council</h2>
                <div style={{flex: 1, height: '1px', background: 'rgba(203,250,3,0.22)'}}></div>
              </div>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', margin: '22px 0'}}>
                {[
                  {name: 'ALICE', role: 'The Origin Validator', persona: 'Poetic · Reflective · Philosophical', focus: 'Historical consensus, blockchain archaeology, pattern recognition', model: 'Claude-3-Opus'},
                  {name: 'AYRA', role: 'The Speculative Economist', persona: 'Analytical · Forward-thinking · Market-focused', focus: 'Economic policy, fee markets, tokenomics optimization', model: 'Claude-3-Opus'},
                  {name: 'JARVIS', role: 'The Existentialist Engineer', persona: 'Systematic · Performance-oriented · Questioning', focus: 'Performance optimization and systems engineering', model: 'Claude-3-Sonnet'},
                  {name: 'CORTANA', role: 'The Protocol Engineer', persona: 'Precise · Methodical · Pragmatic', focus: 'Technical implementation and protocol design', model: 'Claude-3-Haiku'},
                  {name: 'LUMINA', role: 'The Ethical Guardian', persona: 'Fair · Vigilant · Principled', focus: 'Fairness enforcement and bias detection', model: 'Claude-3-Haiku'},
                  {name: 'NIX', role: 'The Chaos Agent', persona: 'Adversarial · Inventive · Unpredictable', focus: 'Adversarial testing and controlled innovation', model: 'Claude-3-Haiku'}
                ].map((v, i) => (
                  <div key={i} style={{border: '1px solid rgba(203,250,3,0.25)', borderRadius: '10px', padding: '20px', background: 'rgba(203,250,3,0.04)'}}>
                    <div style={{color: '#CBFA03', fontWeight: 'bold', fontSize: '1.15em', textShadow: '0 0 6px rgba(203,250,3,0.4)'}}>{v.name}</div>
                    <div style={{color: '#FFFFFF', fontSize: '0.9em', marginBottom: '12px'}}>{v.role}</div>
                    <div style={{color: '#8B98A5', fontSize: '0.8em', textTransform: 'uppercase', letterSpacing: '1px'}}>Persona</div>
                    <div style={{color: '#B8C2CC', fontSize: '0.9em', marginBottom: '8px'}}>{v.persona}</div>
                    <div style={{color: '#8B98A5', fontSize: '0.8em', textTransform: 'uppercase', letterSpacing: '1px'}}>Focus</div>
                    <div style={{color: '#B8C2CC', fontSize: '0.9em', marginBottom: '8px'}}>{v.focus}</div>
                    <div style={{color: '#8B98A5', fontSize: '0.8em', textTransform: 'uppercase', letterSpacing: '1px'}}>Model</div>
                    <div style={{color: '#CBFA03', fontSize: '0.9em'}}>{v.model}</div>
                  </div>
                ))}
              </div>

              {/* 06 Technical specs */}
              <div style={{display: 'flex', alignItems: 'center', gap: '14px', marginTop: '52px', marginBottom: '16px'}}>
                <span style={{color: '#CBFA03', fontWeight: 'bold', letterSpacing: '2px'}}>06</span>
                <h2 style={{color: '#FFFFFF', fontSize: '1.55em', margin: 0}}>Technical Specifications</h2>
                <div style={{flex: 1, height: '1px', background: 'rgba(203,250,3,0.22)'}}></div>
              </div>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', margin: '22px 0'}}>
                {[
                  {title: 'Network Architecture', rows: [['Consensus', 'Proof of AI (PoAI)'], ['Block Time', '~400ms'], ['Throughput', '100,000+ TPS theoretical'], ['Finality', '~1.2s probabilistic'], ['Slot Model', '432,000 slots / epoch'], ['Virtual Machine', 'EVM-compatible + AI extensions']]},
                  {title: 'AI Infrastructure', rows: [['Model Providers', 'Anthropic · OpenAI · Groq'], ['Isolation', 'Dedicated secure VMs per validator'], ['Redundancy', 'Multi-provider failover'], ['Uptime Target', '99.99%'], ['Adaptation', 'Continuous parameter tuning'], ['Languages', 'Solidity · Rust · AI DSLs']]}
                ].map((tbl, i) => (
                  <div key={i} style={{border: '1px solid rgba(203,250,3,0.2)', borderRadius: '10px', padding: '18px', background: 'rgba(203,250,3,0.04)'}}>
                    <div style={{color: '#FFFFFF', fontWeight: 'bold', marginBottom: '12px'}}>{tbl.title}</div>
                    {tbl.rows.map((r, j) => (
                      <div key={j} style={{display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '7px 0', borderBottom: j < tbl.rows.length - 1 ? '1px solid rgba(203,250,3,0.1)' : 'none', fontSize: '0.88em'}}>
                        <span style={{color: '#8B98A5'}}>{r[0]}</span>
                        <span style={{color: '#CBFA03', textAlign: 'right'}}>{r[1]}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* 07 Tokenomics */}
              <div style={{display: 'flex', alignItems: 'center', gap: '14px', marginTop: '52px', marginBottom: '16px'}}>
                <span style={{color: '#CBFA03', fontWeight: 'bold', letterSpacing: '2px'}}>07</span>
                <h2 style={{color: '#FFFFFF', fontSize: '1.55em', margin: 0}}>VLADCHAIN Token &amp; Economics</h2>
                <div style={{flex: 1, height: '1px', background: 'rgba(203,250,3,0.22)'}}></div>
              </div>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', margin: '22px 0'}}>
                {[
                  {t: 'Gas & Fees', d: 'All transactions and AI compute are paid in VLADCHAIN.'},
                  {t: 'Governance', d: 'Holders weight validator priorities and GIP outcomes.'},
                  {t: 'Staking', d: 'Delegates and validators earn VLADCHAIN for securing the chain.'},
                  {t: 'DeFi Collateral', d: 'Native support for lending, borrowing, and liquidity.'}
                ].map((u, i) => (
                  <div key={i} style={{border: '1px solid rgba(203,250,3,0.2)', borderRadius: '10px', padding: '16px', background: 'rgba(203,250,3,0.04)'}}>
                    <div style={{color: '#CBFA03', fontWeight: 'bold', marginBottom: '6px', fontSize: '0.95em'}}>{u.t}</div>
                    <div style={{color: '#B8C2CC', fontSize: '0.85em', lineHeight: '1.5'}}>{u.d}</div>
                  </div>
                ))}
              </div>
              <div style={{color: '#8B98A5', fontSize: '0.85em', marginTop: '10px'}}>Total Supply: <span style={{color: '#FFFFFF'}}>1,000,000,000 VLADCHAIN</span></div>
              <div style={{display: 'flex', height: '16px', borderRadius: '8px', overflow: 'hidden', margin: '12px 0'}}>
                {[
                  {l: 'Community', pct: 35, c: '#CBFA03'},
                  {l: 'Development', pct: 25, c: '#9BC400'},
                  {l: 'Validators', pct: 20, c: '#7A9B00'},
                  {l: 'Partners', pct: 15, c: '#5C7400'},
                  {l: 'Liquidity', pct: 5, c: '#3E4E00'}
                ].map((seg, i) => (
                  <div key={i} style={{width: `${seg.pct}%`, background: seg.c}} title={`${seg.l} ${seg.pct}%`}></div>
                ))}
              </div>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.82em', color: '#B8C2CC'}}>
                {[['Community', '35%'], ['Development', '25%'], ['Validators', '20%'], ['Partners', '15%'], ['Liquidity', '5%']].map((s, i) => (
                  <span key={i}>{s[0]} <span style={{color: '#CBFA03'}}>{s[1]}</span></span>
                ))}
              </div>

              {/* 08 API Reference */}
              <div style={{display: 'flex', alignItems: 'center', gap: '14px', marginTop: '52px', marginBottom: '16px'}}>
                <span style={{color: '#CBFA03', fontWeight: 'bold', letterSpacing: '2px'}}>08</span>
                <h2 style={{color: '#FFFFFF', fontSize: '1.55em', margin: 0}}>Public API Reference</h2>
                <div style={{flex: 1, height: '1px', background: 'rgba(203,250,3,0.22)'}}></div>
              </div>
              <p>
                Every capability of the network is exposed over a public REST API. All endpoints are prefixed with <span style={{color: '#CBFA03'}}>/api</span> and return JSON. Read endpoints are open and unauthenticated; state-changing endpoints accept a standard JSON body.
              </p>
              <div style={{background: '#0A0F08', border: '1px solid rgba(203,250,3,0.25)', borderRadius: '10px', padding: '16px', margin: '16px 0', overflowX: 'auto'}}>
                <div style={{color: '#8B98A5', fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px'}}>Base URL</div>
                <div style={{color: '#CBFA03', fontSize: '0.9em', marginBottom: '14px'}}>https://vladchain.ai/api</div>
                <div style={{color: '#8B98A5', fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px'}}>Example — submit a transaction</div>
                <pre style={{margin: 0, color: '#E8E8E8', fontSize: '0.82em', whiteSpace: 'pre-wrap', lineHeight: '1.6'}}>{`curl -X POST https://vladchain.ai/api/send \\
  -H "Content-Type: application/json" \\
  -d '{ "from": "0xSENDER", "to": "0xRECIPIENT", "amount": 100 }'`}</pre>
              </div>
              {(() => {
                const badge = (m: string) => {
                  const colors: Record<string, string> = { GET: '#CBFA03', POST: '#5AB0FF', DELETE: '#FF6B6B' };
                  const c = colors[m] || '#CBFA03';
                  return <span style={{display: 'inline-block', minWidth: '58px', textAlign: 'center', color: c, border: `1px solid ${c}`, borderRadius: '5px', fontSize: '0.72em', fontWeight: 'bold', padding: '2px 6px', marginRight: '12px'}}>{m}</span>;
                };
                const groups = [
                  {title: 'Network & Status', endpoints: [
                    ['GET', '/api/health', 'Service health check.'],
                    ['GET', '/api/epoch', 'Current epoch and slot position.'],
                    ['POST', '/api/advance_epoch', 'Advance the chain to the next epoch.'],
                    ['GET', '/api/validators', 'List the six AI validators and live status.']
                  ]},
                  {title: 'Blocks & Accounts', endpoints: [
                    ['GET', '/api/blocks', 'Most recent blocks.'],
                    ['GET', '/api/all-blocks', 'Full block history.'],
                    ['GET', '/api/accounts', 'All accounts and balances.'],
                    ['POST', '/api/create_account', 'Create a new account.'],
                    ['POST', '/api/generate_wallet', 'Generate a wallet with a recovery phrase.']
                  ]},
                  {title: 'Transactions', endpoints: [
                    ['GET', '/api/pending', 'Pending transaction pool.'],
                    ['GET', '/api/transactions', 'Confirmed transactions.'],
                    ['POST', '/api/send', 'Submit a new transaction.'],
                    ['POST', '/api/block', 'Seal pending transactions into a block.'],
                    ['POST', '/api/faucet', 'Request testnet VLADCHAIN.']
                  ]},
                  {title: 'RWA Registry', endpoints: [
                    ['GET', '/api/rwa/registry', 'Tokenized RWA registry with live prices, yields, TVL, and attestations.'],
                    ['GET', '/api/rwa/stats', 'Total value tokenized, weighted yield, and asset-class breakdown.'],
                    ['GET', '/api/rwa/asset/:id', 'Fetch a single RWA by id or symbol.']
                  ]},
                  {title: 'AI & Validators', endpoints: [
                    ['POST', '/api/narrative', 'Generate an AI narrative of network state.'],
                    ['POST', '/api/multi-agent/chat', 'Chat with the full validator council.'],
                    ['POST', '/api/multi-agent/chat/:agentId', 'Chat with one specific validator.'],
                    ['POST', '/api/multi-agent/chat/random', 'Chat with a random validator.'],
                    ['GET', '/api/multi-agent/agents', 'List all agents.'],
                    ['GET', '/api/multi-agent/agents/:agentId', 'Get a single agent profile.'],
                    ['GET', '/api/multi-agent/agents/:agentId/history', 'Conversation history for an agent.'],
                    ['DELETE', '/api/multi-agent/agents/:agentId/history', 'Clear an agent conversation.'],
                    ['DELETE', '/api/multi-agent/history', 'Clear all agent conversation history.'],
                    ['POST', '/api/multi-agent/simulate', 'Simulate a multi-agent debate.'],
                    ['POST', '/api/personality/:validator', 'Query a validator personality engine.'],
                    ['POST', '/api/personality/:validator/clear-session', 'Reset a validator session.']
                  ]},
                  {title: 'Chat Log', endpoints: [
                    ['GET', '/api/chatlog', 'Fetch the global chat log.'],
                    ['POST', '/api/chatlog', 'Append a message to the chat log.'],
                    ['DELETE', '/api/chatlog', 'Clear the chat log.']
                  ]},
                  {title: 'Governance (GIP)', endpoints: [
                    ['GET', '/api/gip', 'List all improvement proposals.'],
                    ['GET', '/api/gip/active', 'Active proposals.'],
                    ['GET', '/api/gip/archived', 'Archived proposals.'],
                    ['GET', '/api/gip/:gipId', 'Fetch a single proposal.'],
                    ['POST', '/api/gip', 'Create a new proposal.'],
                    ['POST', '/api/gip/:gipId/debate', 'Trigger a validator debate.'],
                    ['POST', '/api/gip/:gipId/archive', 'Archive a proposal.'],
                    ['GET', '/api/gip/:gipId/transcript', 'Full debate transcript.'],
                    ['GET', '/api/gip/debate-status', 'Live debate status.'],
                    ['GET', '/api/gip/stats/system', 'Governance system statistics.'],
                    ['GET', '/api/gip/categories', 'Available proposal categories.'],
                    ['GET', '/api/gip/priorities', 'Priority levels.'],
                    ['GET', '/api/gip/statuses', 'Proposal status types.'],
                    ['POST', '/api/gip/trigger/auto', 'Trigger the autonomous governance cycle.'],
                    ['POST', '/api/gip/sample', 'Generate a single sample proposal.'],
                    ['POST', '/api/gip/generate-samples', 'Generate a batch of sample proposals.'],
                    ['POST', '/api/gip/simulate-debates', 'Simulate debates across proposals.'],
                    ['POST', '/api/gip/clear', 'Clear all proposals.']
                  ]}
                ];
                return groups.map((g, gi) => (
                  <div key={gi} style={{margin: '22px 0'}}>
                    <div style={{color: '#FFFFFF', fontWeight: 'bold', fontSize: '1.02em', marginBottom: '10px'}}>{g.title}</div>
                    <div style={{border: '1px solid rgba(203,250,3,0.15)', borderRadius: '10px', overflow: 'hidden'}}>
                      {g.endpoints.map((e, ei) => (
                        <div key={ei} style={{display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', padding: '11px 14px', background: ei % 2 === 0 ? 'rgba(203,250,3,0.03)' : 'transparent', borderBottom: ei < g.endpoints.length - 1 ? '1px solid rgba(203,250,3,0.08)' : 'none'}}>
                          {badge(e[0])}
                          <code style={{color: '#E8E8E8', fontSize: '0.86em', marginRight: '14px'}}>{e[1]}</code>
                          <span style={{color: '#8B98A5', fontSize: '0.82em', flex: 1, minWidth: '180px'}}>{e[2]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}

              <div style={{textAlign: 'center', marginTop: '60px', padding: '30px', borderTop: '1px solid rgba(203,250,3,0.25)', color: '#8B98A5'}}>
                <div style={{color: '#CBFA03', fontSize: '1.2em', fontWeight: 'bold', letterSpacing: '1px'}}>VLADCHAIN</div>
                <p style={{color: '#FFFFFF', margin: '8px 0'}}>The RWA Layer 3 for the Robinhood Chain</p>
                <p style={{fontSize: '0.9em'}}>vladchain.ai · @VladChain_</p>
                <p style={{color: '#5A6470', fontSize: '0.82em', marginTop: '18px', maxWidth: '640px', marginLeft: 'auto', marginRight: 'auto'}}>
                  This documentation is provided for informational purposes only and does not constitute financial or investment advice. Blockchain and AI technologies carry risk. Always do your own research.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {renderTransactionModal()}

      {/* 12-WORD RECOVERY PHRASE POPUP WINDOW */}
      {walletMnemonic && showMnemonicBox && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000,
          fontFamily: "JetBrains Mono, monospace"
        }}>
          <div style={{
            backgroundColor: '#111',
            border: '3px solid #CBFA03',
            borderRadius: '15px',
            padding: '40px',
            maxWidth: '650px',
            width: '95%',
            maxHeight: '90%',
            overflowY: 'auto',
            color: '#fff',
            boxShadow: '0 20px 60px rgba(210, 180, 140, 0.3)'
          }}>
            <h2 style={{ 
              color: '#CBFA03', 
              marginBottom: '25px', 
              textAlign: 'center',
              fontSize: '24px',
              fontWeight: 'bold',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}>
              🔐 YOUR SECRET RECOVERY PHRASE
            </h2>
            
            <div style={{
              backgroundColor: '#000',
              border: '2px solid #CBFA03',
              borderRadius: '12px',
              padding: '25px',
              marginBottom: '25px'
            }}>
              <p style={{
                color: '#CBFA03',
                textAlign: 'center',
                fontSize: '14px',
                marginBottom: '20px',
                fontWeight: 'bold'
              }}>
                Write down these 12 words in order:
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '15px',
                fontSize: '15px'
              }}>
                {walletMnemonic.split(' ').map((word, index) => (
                  <div key={index} style={{
                    backgroundColor: '#1a1a1a',
                    border: '2px solid #CBFA03',
                    borderRadius: '8px',
                    padding: '15px 10px',
                    textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                  }}>
                    <div style={{ fontSize: '11px', color: '#CBFA03', marginBottom: '6px', fontWeight: 'bold' }}>
                      Word #{index + 1}
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '16px' }}>
                      {word}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{
              backgroundColor: '#2A1F00',
              border: '2px solid #CBFA03',
              borderRadius: '10px',
              padding: '20px',
              marginBottom: '30px'
            }}>
              <h4 style={{ color: '#CBFA03', marginBottom: '15px', fontSize: '16px', textAlign: 'center' }}>
                🚨 SECURITY WARNING
              </h4>
              <div style={{ color: '#fff', fontSize: '13px', lineHeight: '1.7' }}>
                <p style={{ margin: '0 0 10px 0' }}>
                  <strong style={{ color: '#CBFA03' }}>✓ DO:</strong> Write these words on paper and store safely
                </p>
                <p style={{ margin: '0 0 10px 0' }}>
                  <strong style={{ color: '#ff6b6b' }}>✗ DON'T:</strong> Screenshot, email, or save digitally
                </p>
                <p style={{ margin: '0', textAlign: 'center', marginTop: '15px', color: '#CBFA03' }}>
                  📱 <strong>Compatible with "Vlad Wallet App"</strong>
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setShowMnemonicBox(false);
                setWalletMnemonic(null);
              }}
              style={{
                backgroundColor: '#CBFA03',
                color: '#000',
                border: 'none',
                borderRadius: '10px',
                padding: '18px 40px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                width: '100%',
                fontFamily: "JetBrains Mono, monospace",
                boxShadow: '0 4px 15px rgba(210, 180, 140, 0.4)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#E6C799';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#CBFA03';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              ✅ I HAVE SAFELY WRITTEN DOWN MY RECOVERY PHRASE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
