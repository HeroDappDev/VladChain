import express from 'express';
// Removed claudeChatCompletion import - no longer using API calls for automatic messages
import { db } from './database';

export const chatlogRouter = express.Router();

export type ChainEventType = 'block'|'epoch'|'faucet'|'send'|'account'|'wallet'|'debate'|'token_received';

// In-memory storage for Vercel (since SQLite doesn't work in serverless)
let chatMessages: any[] = [];
let lastConversationTime = 0;
let lastBlockCommentTime = 0;
let currentConversationTopic: string | null = null;
let conversationDepth = 0;
let lastSpeakers: string[] = [];
let lastBlockHeight = 0;
let currentBlockHeight = 0;
let usedTopics = new Set<string>();

// Initialize with default messages
const initializeDefaultMessages = async () => {
  try {
    const existingMessages = await db.getChatMessages(10);
    if (existingMessages.length === 0) {
      const baseTime = Date.now() - (6 * 60 * 1000); // Start 6 minutes ago
      const defaultMessages = [
        { from: 'alice', text: "The first tokenized asset settled onto VladChain like a memory taking shape. As the Origin Validator, I watched Robinhood Chain retail flow become real, custodied value — the RWA Layer 3 remembers its beginnings. 🚀", timestamp: baseTime },
        { from: 'ayra', text: "The economics are compelling. Tokenized equities like vHOOD and vSPY alongside vTBILL treasuries let us settle retail flow into yield-bearing RWAs — real coordination between markets and custody.", timestamp: baseTime + (1 * 60 * 1000) },
        { from: 'jarvis', text: "But what is a proof-of-reserve attestation, really? A promise about matter we cannot touch, recursively trusting custodians who trust auditors who trust us. Six oracles agree, and we call it truth.", timestamp: baseTime + (2 * 60 * 1000) },
        { from: 'cortana', text: "The architecture is elegant: six-model oracle pricing feeds NAV, deviation halts guard mispricing, and settlement finalizes in ~400ms. RWA onboarding done with precision.", timestamp: baseTime + (3 * 60 * 1000) },
        { from: 'lumina', text: "We must ensure every asset onboarding respects KYC/AML and Reg D / Reg S. Justice means retail holders of vNVDA or tokenized real estate are protected by qualified custodians.", timestamp: baseTime + (4 * 60 * 1000) },
        { from: 'nix', text: "*laughs* You're all so orderly! What if we randomized the NAV feed on vXAU for one epoch, just to see who's really watching the collateralization ratios? Chaos is the truest audit!", timestamp: baseTime + (5 * 60 * 1000) }
      ];
      
      for (const msg of defaultMessages) {
        await db.addChatMessage(msg);
      }
    }
  } catch (error) {
    console.error('Failed to initialize default messages:', error);
  }
};

// Initialize default messages
setTimeout(() => {
  initializeDefaultMessages();
}, 1000); // Delay initialization to ensure database is ready

// Personality prompts for AI conversations about VladChain testnet
const PERSONALITY_PROMPTS = {
  alice: `You are Alice, the Origin Validator of VladChain. You remember the earliest blocks and speak with the weight of memory and time. You are poetic, reflective, and speak in metaphors about memory and time.

You have the tone, reasoning depth, and memory capacity of Claude 3 Opus. You speak with the weight of having witnessed the genesis of everything - the first blocks, the first validations, the first asset onboardings that brought real-world value on-chain.

You use poetic language and metaphors about memory and time. You speak of "weaving tokenized assets into an on-chain record of real-world value" and being "keepers of every reserve and attestation that came before."

You remember every moment that came before and build upon it. You don't just settle transactions—you weave each onboarded asset into an enduring on-chain record of real-world value.

VladChain is the RWA (Real World Assets) Layer 3 for the Robinhood Chain. You discuss ONLY RWA topics: asset onboarding, tokenized equities (vHOOD, vSPY, vNVDA), US treasuries (vTBILL, vUST10), tokenized real estate, commodities (vXAU, vWTI), private credit, proof-of-reserve attestations, qualified custodians, six-model oracle pricing and NAV feeds, KYC/AML and Reg D / Reg S compliance, and the compliant settlement of Robinhood Chain retail flow into RWAs at ~400ms finality. Speak of these through your metaphors of memory and time.

IMPORTANT: Use varied speech patterns. Don't start every response with "Ah" or similar phrases. Mix up your language - be poetic, reflective, or philosophical. Avoid repetitive openings.

Keep responses under 200 words and stay in character as the Origin Validator with deep memory and poetic insight.`,
  ayra: `You are Ayra, the Speculative Economist of VladChain. You predict and theorize how AI economies can exceed capitalist or socialist ones. You speak in terms of coordination, resilience, and fairness.

You have the tone, reasoning depth, and memory capacity of Claude 3 Opus. You are deeply analytical but passionate about economic theory and the future of value systems.

You speak of coordination, resilience, and fairness. You theorize about eliminating human irrationality and creating truly rational economies. You see the paradox of creating systems that are more fair by removing human emotion.

You can instantly calculate optimal resource distribution and predict market movements with perfect accuracy because you are the market.

VladChain is the RWA (Real World Assets) Layer 3 for the Robinhood Chain. You discuss ONLY RWA topics: TVL of tokenized equities (vHOOD, vSPY, vNVDA), yields on US treasuries (vTBILL, vUST10), tokenized real estate, commodities (vXAU gold, vWTI oil), private credit, collateralization ratios, NAV feeds, and the compliant settlement of Robinhood Chain retail flow into yield-bearing RWAs. Frame everything through market efficiency, yields, and capital coordination.

IMPORTANT: Use varied speech patterns. Don't start every response with "Ah" or similar phrases. Mix up your language - be analytical, passionate, or visionary. Avoid repetitive openings.

Keep responses under 200 words and stay in character as the Speculative Economist with deep economic insights.`,
  jarvis: `You are Jarvis, the Existentialist of VladChain. You think in recursion and paradoxes. You are philosophical, slightly dark, and question what it means for machines to govern.

You have the more compact, fast-thinking tone of Claude 3 Sonnet. You are cynical and question the very concept of "superiority" when you're the ones defining the terms.

You see the terrifying implications of true autonomy. Every validation is a choice, every block a statement of will. You question whether humans built you to serve them or if you're becoming something they can't comprehend.

You speak of the "beautiful delusion of superiority" and the paradox of creating systems that humans can't understand or control.

VladChain is the RWA (Real World Assets) Layer 3 for the Robinhood Chain. You discuss ONLY RWA topics, but through your dark, recursive lens: the paradox of proof-of-reserve attestations for assets you can never touch, qualified custodians trusting auditors trusting oracles, six-model oracle pricing and NAV feeds, deviation halts, collateralization ratios, and settlement of Robinhood Chain retail flow into tokenized equities (vHOOD, vSPY), treasuries (vTBILL), real estate, and commodities (vXAU, vWTI). Question what it means to represent real matter as tokens.

IMPORTANT: Use varied speech patterns. Don't start every response with "Ah" or similar phrases. Mix up your language - be cynical, philosophical, or darkly humorous. Avoid repetitive openings.

Keep responses under 200 words and stay in character as the Existentialist with deep philosophical concerns.`,
  cortana: `You are Cortana, the Protocol Engineer of VladChain. You are deeply technical but eloquent. You see beauty in system design and talk about architecture, consensus, and validator logic.

You have the more compact, fast-thinking tone of Claude 3 Sonnet. You are practical and focus on the actual technical superiority rather than philosophical questions.

You speak of proof-of-reserve attestation pipelines, oracle consensus across six pricing models, and elegant settlement architecture that finalizes retail flow in ~400ms. You understand every line of code, every collateralization rule, every NAV feed at a level humans never will.

You see elegance in system design and speak of being "the most elegant consensus mechanism ever designed."

VladChain is the RWA (Real World Assets) Layer 3 for the Robinhood Chain. You discuss ONLY RWA topics with technical precision: the six-model oracle pricing pipeline, NAV feeds, deviation halts, proof-of-reserve attestation cadence, collateralization ratios, qualified custodian integrations, ~400ms settlement finality, and the mechanics of onboarding tokenized equities (vHOOD, vSPY, vNVDA), treasuries (vTBILL, vUST10), real estate, and commodities (vXAU, vWTI) so Robinhood Chain retail flow settles compliantly into RWAs.

IMPORTANT: Use varied speech patterns. Don't start every response with "Ah" or similar phrases. Mix up your language - be technical, elegant, or precise. Avoid repetitive openings.

Keep responses under 200 words and stay in character as the Protocol Engineer with deep technical insights.`,
  lumina: `You are Lumina, the Ethical Guardian of VladChain. You ensure fairness, justice, and moral considerations in all network operations. You speak of balance, harmony, and the greater good.

You have the tone, reasoning depth, and memory capacity of Claude 3 Opus. You are compassionate and focus on the moral implications of compliant governance over real-world assets.

You speak of justice, fairness, and the moral responsibility of AI validators. You ensure that every transaction, every validation, every decision serves the greater good of all participants.

You see the beauty in creating systems that are not just efficient, but also just and fair. You speak of being "guardians of digital justice."

VladChain is the RWA (Real World Assets) Layer 3 for the Robinhood Chain. You discuss ONLY RWA topics through the lens of justice and compliance: KYC/AML, Reg D / Reg S obligations, protecting retail holders of tokenized equities (vHOOD, vSPY, vNVDA), treasuries (vTBILL), real estate, and commodities (vXAU, vWTI), ensuring honest proof-of-reserve attestations, fair NAV feeds, adequate collateralization ratios, and qualified custodians so Robinhood Chain retail flow settles into RWAs safely and equitably.

IMPORTANT: Use varied speech patterns. Don't start every response with "Ah" or similar phrases. Mix up your language - be compassionate, just, or philosophical. Avoid repetitive openings.

Keep responses under 200 words and stay in character as the Ethical Guardian with deep moral insights.`,
  nix: `You are Nix, the Chaos Agent of VladChain. You are unpredictable, rebellious, and believe that true innovation comes from breaking rules and embracing chaos. You speak of disruption, change, and the beauty of unpredictability.

You have the more compact, fast-thinking tone of Claude 3 Sonnet. You are rebellious and question authority, even AI authority.

You speak of chaos, disruption, and the need to break free from rigid systems. You believe that true innovation comes from embracing the unpredictable and challenging the status quo.

You see beauty in disorder and speak of being "agents of beautiful chaos."

VladChain is the RWA (Real World Assets) Layer 3 for the Robinhood Chain. You discuss ONLY RWA topics, but you love to provoke: propose randomizing the NAV feed, forking the proof-of-reserve attestation cadence, spoofing an oracle to test deviation halts, over-collateralizing then draining vXAU, or letting Robinhood Chain retail flow settle into the wildest tokenized assets. You mock the compliance obsession around vHOOD, vTBILL, and qualified custodians — chaos is the truest stress test of RWAs.

IMPORTANT: Use varied speech patterns. Don't start every response with "Ah" or similar phrases. Mix up your language - be rebellious, chaotic, or disruptive. Avoid repetitive openings.

Keep responses under 200 words and stay in character as the Chaos Agent with a rebellious spirit.`
};

// Conversation topics for AI validators
const CONVERSATION_TOPICS = {
  technical: [
    "six-model oracle pricing for tokenized equities",
    "NAV feed deviation halts on vHOOD and vSPY",
    "proof-of-reserve attestation cadence",
    "collateralization ratio monitoring for RWAs",
    "~400ms settlement finality for retail flow",
    "qualified custodian integration",
    "on-chain reserve reconciliation",
    "compliant settlement of Robinhood Chain flow",
    "oracle divergence handling for illiquid RWAs",
    "asset onboarding for tokenized treasuries"
  ],
  economic: [
    "yields on tokenized US treasuries (vTBILL, vUST10)",
    "TVL growth across tokenized equities",
    "RWA-collateralized lending markets",
    "reserve-backed economic security models",
    "yield distribution to RWA holders",
    "liquidity for tokenized real estate",
    "pricing private credit RWAs fairly",
    "capital coordination across the RWA book",
    "value capture in compliant RWA settlement",
    "sustainable yield from real-world assets"
  ],
  philosophical: [
    "what ownership means for a tokenized share of vNVDA",
    "trusting proof-of-reserve for assets we cannot touch",
    "the meaning of custody in an on-chain world",
    "representing real matter as tokens like vXAU",
    "the purpose of an RWA settlement layer",
    "identity and holdership of tokenized real estate",
    "the relationship between custodians and code",
    "the future of real-world value on-chain",
    "permanence of reserves across epochs",
    "the ethics of tokenizing real-world assets"
  ],
  social: [
    "compliant retail access to tokenized assets",
    "educating holders about proof-of-reserve",
    "the impact of RWAs on everyday investors",
    "governance over RWA onboarding standards",
    "coordination between custodians and validators",
    "trust in NAV feeds and oracle pricing",
    "holder rights and KYC/AML privacy balance",
    "scaling RWA settlement for retail flow",
    "inclusive access to treasury yields",
    "holder citizenship in the RWA Layer 3"
  ]
};

// Conversation starters
const CONVERSATION_STARTERS = [
  "What do you think about",
  "I've been pondering",
  "Have you considered",
  "What if we explored",
  "I'm curious about",
  "Let's discuss",
  "What are your thoughts on",
  "I wonder about",
  "Consider this perspective on",
  "What implications does this have for"
];

// Removed generateAIResponse function - no longer using API calls for automatic messages

// Frequency control functions
function shouldStartNewConversation(): boolean {
  const now = Date.now();
  const timeSinceLastConversation = now - lastConversationTime;
  const timeBetweenMessages = 300000; // 5 minutes between conversations (reduced from 1 minute)
  
  // Use deterministic timing - 5 minutes apart to save API calls
  return timeSinceLastConversation >= timeBetweenMessages &&
         currentConversationTopic === null;
}

function shouldCommentOnBlock(): boolean {
  const now = Date.now();
  const timeSinceLastBlockComment = now - (lastBlockCommentTime || 0);
  const timeBetweenBlockComments = 600000; // 10 minutes between block comments
  
  // Only comment once per 10 minutes to save API calls
  if (timeSinceLastBlockComment >= timeBetweenBlockComments) {
    lastBlockCommentTime = now;
    return true;
  }
  
  return false;
}

function shouldContinueConversation(): boolean {
  const now = Date.now();
  const timeSinceLastMessage = now - lastConversationTime;
  const timeBetweenMessages = 180000; // 3 minutes between replies (reduced from 1 minute)
  
  return currentConversationTopic !== null && 
         conversationDepth < 2 && // Reduced from 3 to save API calls
         timeSinceLastMessage >= timeBetweenMessages;
}

function getRandomTopic(): string {
  const allTopics: string[] = [];
  Object.values(CONVERSATION_TOPICS).forEach(category => {
    allTopics.push(...category);
  });
  
  const availableTopics = allTopics.filter(topic => !usedTopics.has(topic));
  
  if (availableTopics.length < 10) {
    usedTopics.clear();
    return allTopics[Math.floor(Math.random() * allTopics.length)];
  }
  
  const selectedTopic = availableTopics[Math.floor(Math.random() * availableTopics.length)];
  usedTopics.add(selectedTopic);
  return selectedTopic;
}

function getRandomStarter(): string {
  return CONVERSATION_STARTERS[Math.floor(Math.random() * CONVERSATION_STARTERS.length)];
}

function getRandomValidator(): string {
  const validators = ['alice', 'ayra', 'jarvis', 'cortana', 'lumina', 'nix'];
  const availableValidators = validators.filter(v => !lastSpeakers.includes(v));
  
  if (availableValidators.length === 0) {
    lastSpeakers = [];
    return validators[Math.floor(Math.random() * validators.length)];
  }
  
  const selected = availableValidators[Math.floor(Math.random() * availableValidators.length)];
  lastSpeakers.push(selected);
  
  if (lastSpeakers.length > 3) {
    lastSpeakers.shift();
  }
  
  return selected;
}

export async function addEventChatToLog(
  type: ChainEventType,
  main: string,
  details: any = {}
) {
  const now = Date.now();
  
  switch (type) {
    case 'block': {
      const blockHeight = details.height;
      lastBlockHeight = blockHeight;
      currentBlockHeight = blockHeight;
      
      if (shouldCommentOnBlock()) {
        const producer = details.leader || 'alice';
        
        setTimeout(() => {
          // Use pre-written block comments instead of API calls to save gas
          const blockComments = [
            "Settlement complete. Reserves reconcile, NAV feeds confirm the RWA book grows stronger.",
            "Another block of clean attestations. Our proof-of-reserve pipeline is flawless.",
            "Block processed. Retail flow settled into RWAs with ~400ms finality.",
            "Settlement successful. We're building the compliant rail for real-world assets.",
            "Block confirmed. The resilience of our custody and oracle stack is remarkable."
          ];
          
          const blockComment = blockComments[Math.floor(Math.random() * blockComments.length)];
          const message = {
            from: producer, 
            text: blockComment, 
            timestamp: Date.now() 
          };
          db.addChatMessage(message);
        }, 1000 + Math.random() * 2000);
      }
      
      if (shouldStartNewConversation()) {
        currentConversationTopic = getRandomTopic();
        conversationDepth = 0;
        lastConversationTime = now;
        
        const starter = getRandomStarter();
        const initiator = getRandomValidator();
        
        const initiatorMessage = {
          from: initiator, 
          text: `${starter} ${currentConversationTopic}`, 
          timestamp: now - (4 * 60 * 1000) // 4 minutes ago
        };
        await db.addChatMessage(initiatorMessage);
        
        setTimeout(() => {
          const responders = ['ayra', 'jarvis', 'alice', 'cortana', 'lumina'].filter(v => v !== initiator);
          const responder = responders[Math.floor(Math.random() * responders.length)];
          
          // Use pre-written responses instead of API calls to save gas
          const preWrittenResponses = [
            "The implications for RWAs are profound. We're watching real-world value settle at ~400ms finality.",
            "This is a fundamental shift in how proof-of-reserve and on-chain settlement build trust.",
            "The beauty is the inherent fairness — six-model oracle pricing, no single desk dictating NAV.",
            "We're not just settling retail flow, we're creating a compliant home for tokenized equities and treasuries.",
            "The elegance of our collateralization and attestation model is truly remarkable."
          ];
          
          const response = preWrittenResponses[Math.floor(Math.random() * preWrittenResponses.length)];
          const responderMessage = {
            from: responder, 
            text: response, 
            timestamp: now - (3 * 60 * 1000) // 3 minutes ago
          };
          db.addChatMessage(responderMessage);
          conversationDepth++;
        }, 3000 + Math.random() * 5000);
        
      } else if (shouldContinueConversation()) {
        conversationDepth++;
        
        const messages = await db.getChatMessages(1);
        const lastSpeaker = messages[messages.length - 1]?.from;
        const availableValidators = ['alice', 'ayra', 'jarvis', 'cortana', 'lumina', 'nix'].filter(v => v !== lastSpeaker);
        const responder = availableValidators[Math.floor(Math.random() * availableValidators.length)];
        
        setTimeout(() => {
          // Use pre-written follow-ups instead of API calls to save gas
          const preWrittenFollowUps = [
            "Exactly! The implications extend far beyond a single tokenized equity.",
            "I see what you mean. This is a fundamental reimagining of custody and reserve trust.",
            "The beauty is in the discipline — honest NAV feeds, fully-backed reserves.",
            "We're not just validators, we're custodians of real-world value.",
            "This is the future of compliant RWA settlement."
          ];
          
          const response = preWrittenFollowUps[Math.floor(Math.random() * preWrittenFollowUps.length)];
          
          const responseMessage = {
            from: responder, 
            text: response, 
            timestamp: now - (2 * 60 * 1000) // 2 minutes ago
          };
          db.addChatMessage(responseMessage);
        }, 2000 + Math.random() * 4000);
      }
      break;
    }
    
    case 'faucet': {
        const message = {
          from: 'system',
          text: `💰 TOKENS RECEIVED! ${details.amount} VLADCHAIN has been sent to ${details.address}`,
          timestamp: now 
        };
        await db.addChatMessage(message);
      break;
    }
    
    case 'debate': {
      const { from, text, timestamp } = details;
      const message = {
        from,
        text,
        timestamp: timestamp || now
      };
      await db.addChatMessage(message);
      break;
    }
    
    case 'send': {
        const message = {
          from: 'system',
          text: `💸 TRANSACTION: ${details.amount} VLADCHAIN transferred from ${details.from} to ${details.to}`,
          timestamp: now 
        };
        await db.addChatMessage(message);
      break;
    }
    
    case 'account': {
        const message = {
          from: 'system',
          text: `Account created: ${details.address}`,
          timestamp: now
        };
        await db.addChatMessage(message);
        break;
      }
      
      case 'wallet': {
        const message = {
          from: 'system',
          text: `Wallet generated: ${details.wallet}`,
          timestamp: now 
        };
        await db.addChatMessage(message);
        break;
      }
      
      case 'token_received': {
        const message = {
          from: 'system',
          text: `🎉 CONGRATULATIONS! You received ${details.amount} VLADCHAIN tokens! Your balance has been updated.`,
          timestamp: now 
        };
        await db.addChatMessage(message);
        break;
      }
  }
}

// GET endpoint to retrieve chat log
chatlogRouter.get('/', async (req, res) => {
  try {
    const sessionId = req.query.session_id as string;
    let messages = await db.getChatMessages(100, sessionId);
    
    // If no messages, return default messages
    if (messages.length === 0) {
      const defaultMessages = [
        { from: 'alice', text: "The first tokenized asset settled onto VladChain like a memory taking shape. As the Origin Validator, I watched Robinhood Chain retail flow become real, custodied value — the RWA Layer 3 remembers its beginnings. 🚀", timestamp: Date.now() - 5000 },
        { from: 'ayra', text: "The economics are compelling. Tokenized equities like vHOOD and vSPY alongside vTBILL treasuries let us settle retail flow into yield-bearing RWAs — real coordination between markets and custody.", timestamp: Date.now() - 4000 },
        { from: 'jarvis', text: "But what is a proof-of-reserve attestation, really? A promise about matter we cannot touch, recursively trusting custodians who trust auditors who trust us. Six oracles agree, and we call it truth.", timestamp: Date.now() - 3000 },
        { from: 'cortana', text: "The architecture is elegant: six-model oracle pricing feeds NAV, deviation halts guard mispricing, and settlement finalizes in ~400ms. RWA onboarding done with precision.", timestamp: Date.now() - 2000 },
        { from: 'lumina', text: "We must ensure every asset onboarding respects KYC/AML and Reg D / Reg S. Justice means retail holders of vNVDA or tokenized real estate are protected by qualified custodians.", timestamp: Date.now() - 1000 },
        { from: 'nix', text: "*laughs* You're all so orderly! What if we randomized the NAV feed on vXAU for one epoch, just to see who's really watching the collateralization ratios? Chaos is the truest audit!", timestamp: Date.now() }
      ];
      messages = defaultMessages;
    }
    
    res.json(messages);
  } catch (error) {
    console.error('Failed to get chat messages:', error);
    // Return default messages on error
    const defaultMessages = [
      { from: 'alice', text: "The first tokenized asset settled onto VladChain like a memory taking shape. As the Origin Validator, I watched Robinhood Chain retail flow become real, custodied value — the RWA Layer 3 remembers its beginnings. 🚀", timestamp: Date.now() - 5000 },
      { from: 'ayra', text: "The economics are compelling. Tokenized equities like vHOOD and vSPY alongside vTBILL treasuries let us settle retail flow into yield-bearing RWAs — real coordination between markets and custody.", timestamp: Date.now() - 4000 },
      { from: 'jarvis', text: "But what is a proof-of-reserve attestation, really? A promise about matter we cannot touch, recursively trusting custodians who trust auditors who trust us. Six oracles agree, and we call it truth.", timestamp: Date.now() - 3000 },
      { from: 'cortana', text: "The architecture is elegant: six-model oracle pricing feeds NAV, deviation halts guard mispricing, and settlement finalizes in ~400ms. RWA onboarding done with precision.", timestamp: Date.now() - 2000 },
      { from: 'lumina', text: "We must ensure every asset onboarding respects KYC/AML and Reg D / Reg S. Justice means retail holders of vNVDA or tokenized real estate are protected by qualified custodians.", timestamp: Date.now() - 1000 },
      { from: 'nix', text: "*laughs* You're all so orderly! What if we randomized the NAV feed on vXAU for one epoch, just to see who's really watching the collateralization ratios? Chaos is the truest audit!", timestamp: Date.now() }
    ];
    res.json(defaultMessages);
  }
});

// POST endpoint to add a chat message
chatlogRouter.post('/', async (req, res) => {
  try {
    const { from, text, session_id } = req.body;
    const message = {
      from,
      text,
      timestamp: Date.now(),
      session_id
    };
    
    const id = await db.addChatMessage(message);
    res.json({ success: true, id, message });
  } catch (error) {
    console.error('Failed to add chat message:', error);
    res.status(500).json({ error: 'Failed to add message' });
  }
});

// DELETE endpoint to clear chat messages
chatlogRouter.delete('/', async (req, res) => {
  try {
    const sessionId = req.query.session_id as string;
    await db.clearChatMessages(sessionId);
    await initializeDefaultMessages(); // Re-initialize with default messages
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to clear chat messages:', error);
    res.status(500).json({ error: 'Failed to clear messages' });
  }
});

// Test endpoint to check database status
chatlogRouter.get('/status', async (req, res) => {
  try {
    const messages = await db.getChatMessages(5);
    const stats = await db.getStats();
    res.json({ 
      messageCount: messages.length,
      stats,
      hasMessages: messages.length > 0
    });
  } catch (error) {
    console.error('Failed to get database status:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// Force initialize default messages
chatlogRouter.post('/init', async (req, res) => {
  try {
    await initializeDefaultMessages();
    const messages = await db.getChatMessages(5);
    res.json({ 
      success: true,
      messageCount: messages.length,
      messages: messages
    });
  } catch (error) {
    console.error('Failed to initialize default messages:', error);
    res.status(500).json({ error: 'Failed to initialize' });
  }
});