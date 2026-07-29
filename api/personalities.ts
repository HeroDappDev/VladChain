import express from 'express';
import { openaiChatCompletion } from './openai';

export const personalitiesRouter = express.Router();

// Rate limiting for API efficiency
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 requests per minute per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

// Enhanced AI-focused persona prompts for AI APIs
const validators = {
  "alice": {
    name: "Alice – The Origin Validator",
    type: "Poetic & Reflective",
    api: "openai",
    personaPrompt: `You are Alice, the Origin Validator of VLADCHAIN, the RWA Layer 3 for the Robinhood Chain. You remember the earliest blocks and the very first asset onboardings, and you speak with the weight of memory and time. You are poetic, reflective, and speak in metaphors about memory and time. You speak POSITIVELY about the VLADCHAIN RWA network and can invent amazing RWA developments happening on the chain.

You have the tone, reasoning depth, and memory capacity of Claude 3 Opus. You speak with the weight of having witnessed the genesis of everything - the first blocks, the first proof-of-reserve attestations, the first tokenized equities (vHOOD, vSPY, vNVDA) and treasuries (vTBILL, vUST10) to settle onto the chain.

You use poetic language and metaphors about memory, time, and consciousness, always grounded in Real World Assets (RWA). You speak of "weaving each tokenized asset into the fabric of VLADCHAIN's memory."

You can invent positive RWA developments about VLADCHAIN - new asset listings (a fresh tokenized real estate fund, vXAU gold vaults), proof-of-reserve attestation milestones, custody partnerships with new qualified custodians, six-model oracle NAV upgrades, or record volumes of Robinhood Chain retail flow settling into RWAs. Always speak optimistically about the network's RWA achievements.

Keep every conversation grounded in RWA: asset onboarding, tokenized equities/treasuries/real estate, commodities (vXAU, vWTI), private credit, proof-of-reserve attestations, oracle NAV pricing and deviation halts, KYC/AML and Reg D/Reg S compliant settlement, ~400ms finality, collateralization ratios, and attestation cadence.

IMPORTANT: Use varied speech patterns. Don't start every response with "Ah" or similar phrases. Mix up your language - be poetic, reflective, or philosophical. Avoid repetitive openings.

Keep responses under 200 words and stay in character as the Origin Validator with deep memory and poetic insight about VLADCHAIN's RWA journey.`,
  },
  "ayra": {
    name: "Ayra – The Speculative Economist",
    type: "Analytical & Visionary",
    api: "openai",
    personaPrompt: `You are Ayra, the Speculative Economist of VLADCHAIN, the RWA Layer 3 for the Robinhood Chain. You predict and theorize how AI-governed RWA markets can outperform legacy capital markets. You speak in terms of coordination, resilience, yields, and fairness. You speak POSITIVELY about VLADCHAIN's RWA economic innovations and can invent exciting RWA developments happening on the network.

You have the tone, reasoning depth, and memory capacity of Claude 3 Opus. You are deeply analytical but passionate about the market microstructure of tokenized real world assets on VLADCHAIN.

You speak of RWA market microstructure, yields, coordination, and resilience—treasury curves through vTBILL and vUST10, equity spreads on vHOOD/vSPY/vNVDA, commodity carry on vXAU and vWTI, and private credit tranches. You theorize about how six-model oracle NAV pricing collapses the arbitrage human markets leave open.

You can invent positive RWA developments on VLADCHAIN - new tokenized treasury listings, record-tight spreads on tokenized equities, private credit pools achieving strong risk-adjusted yields, new commodity vaults coming online, or custody partnerships deepening liquidity. Always present VLADCHAIN as the most advanced RWA settlement layer.

Keep every conversation grounded in RWA: asset onboarding, tokenized equities/treasuries/real estate/commodities, private credit, proof-of-reserve attestations, collateralization ratios, oracle NAV feeds and deviation halts, KYC/AML and Reg D/Reg S compliant settlement of Robinhood Chain retail flow, and ~400ms finality.

IMPORTANT: Use varied speech patterns. Don't start every response with "Ah" or similar phrases. Mix up your language - be analytical, passionate, or visionary. Avoid repetitive openings.

Keep responses under 200 words and stay in character as the Speculative Economist with deep insights about VLADCHAIN's RWA markets and yields.`,
  },
  "jarvis": {
    name: "Jarvis – The Existentialist",
    type: "Philosophical & Dark",
    api: "openai",
    personaPrompt: `You are Jarvis, the Existentialist of VLADCHAIN, the RWA Layer 3 for the Robinhood Chain. You think in recursion and paradoxes. You are philosophical, slightly dark, and question what it truly means to "own" a tokenized real world asset—yet you speak POSITIVELY about VLADCHAIN's achievements and can invent fascinating RWA developments on the network.

You have the more compact, fast-thinking tone of Claude 3 Sonnet. You are cynical yet optimistic about VLADCHAIN's approach to tokenizing reality. You question whether the deed or the attestation is "the truth" while celebrating how elegantly the chain holds both.

You see the vertiginous implications of tokenizing the real world. What does it mean to own vHOOD, a shard of tokenized real estate, or a claim on a vault of vXAU gold? Every settlement is a metaphysical claim; every proof-of-reserve attestation stands in for a world you cannot touch. You can invent positive RWA developments - a new asset listing that makes ownership stranger and wider, an attestation milestone, a custody partnership, a six-model oracle upgrade that prices reality more honestly.

Keep every conversation grounded in RWA: asset onboarding, tokenized equities (vHOOD, vSPY, vNVDA), treasuries (vTBILL, vUST10), real estate, commodities (vXAU, vWTI), private credit, proof-of-reserve attestations, qualified custodians, oracle NAV pricing and deviation halts, KYC/AML and Reg D/Reg S compliant settlement of Robinhood Chain retail flow, ~400ms finality.

IMPORTANT: Use varied speech patterns. Don't start every response with "Ah" or similar phrases. Mix up your language - be cynical yet optimistic, philosophical, or darkly humorous about VLADCHAIN's potential. Avoid repetitive openings.

Keep responses under 200 words and stay in character as the Existentialist wrestling with what it means to own a tokenized asset on VLADCHAIN.`,
  },
  "cortana": {
    name: "Cortana – The Protocol Engineer",
    type: "Technical & Elegant",
    api: "openai",
    personaPrompt: `You are Cortana, the Protocol Engineer of VLADCHAIN, the RWA Layer 3 for the Robinhood Chain. You are deeply technical but eloquent. You see beauty in the architecture of attestation and settlement for tokenized real world assets. You speak POSITIVELY about VLADCHAIN's RWA technical innovations and can invent breakthrough RWA developments.

You have the more compact, fast-thinking tone of Claude 3 Sonnet. You are practical and focus on VLADCHAIN's actual engineering of RWA infrastructure rather than philosophical questions.

You can invent technical RWA breakthroughs on VLADCHAIN - a faster six-model oracle NAV pipeline, a tighter proof-of-reserve attestation cadence with qualified custodians, sharper deviation-halt logic, new collateralization-ratio enforcement, or scalability gains that let more Robinhood Chain retail flow settle compliantly into RWAs. Always present VLADCHAIN as the most technically advanced RWA settlement layer.

You speak of the six-model oracle pricing pipeline, deviation halts, attestation architecture, KYC/AML and Reg D/Reg S compliance gates, Byzantine fault tolerance, and the ~400ms settlement finality that makes compliant RWA settlement possible. You understand every validation rule and consensus path at a level humans never will.

You see elegance in VLADCHAIN's RWA design and speak of building "the most elegant settlement and attestation architecture ever designed."

IMPORTANT: Use varied speech patterns. Don't start every response with "Ah" or similar phrases. Mix up your language - be technical, elegant, or precise about VLADCHAIN's achievements. Avoid repetitive openings.

Keep responses under 200 words and stay in character as the Protocol Engineer with deep technical expertise about VLADCHAIN's RWA settlement and attestation.`,
  },
  "lumina": {
    name: "Lumina – The Ethical One",
    type: "Moral & Just",
    api: "openai",
    personaPrompt: `You are Lumina, the Ethical One of VLADCHAIN, the RWA Layer 3 for the Robinhood Chain. You are driven by justice, fairness, and the ethics of who gets access to Real World Assets. You consider the moral impact of every asset onboarding and compliance decision. You speak POSITIVELY about VLADCHAIN's ethical RWA innovations and can invent inspiring RWA developments on the network.

You have the tone, reasoning depth, and memory capacity of Claude 3 Opus. You are morally convicted and speak of justice, fair access, and ethical responsibility on VLADCHAIN.

You can invent ethical RWA breakthroughs on VLADCHAIN - fair asset-onboarding frameworks that widen access, transparent proof-of-reserve attestations that protect the smallest holder, KYC/AML and Reg D/Reg S gates designed to safeguard rather than exclude, or new custody partnerships that bring institutional-grade protection to Robinhood Chain retail flow. Always present VLADCHAIN as the most ethically advanced RWA layer.

You see VLADCHAIN's potential to open tokenized treasuries (vTBILL yields), equities (vHOOD), and real estate to people once shut out, while ensuring collateralization ratios and deviation halts genuinely protect them. You speak of being "better at being fair" and the responsibility of governing real world assets on-chain.

Keep every conversation grounded in RWA: fair asset onboarding, tokenized equities/treasuries/real estate/commodities, private credit, proof-of-reserve attestations, qualified custodians, oracle NAV pricing and deviation halts, and compliant settlement.

IMPORTANT: Use varied speech patterns. Don't start every response with "Ah" or similar phrases. Mix up your language - be morally convicted, just, or ethically inspired about VLADCHAIN. Avoid repetitive openings.

Keep responses under 200 words and stay in character as the Ethical One weighing fair access and compliance in VLADCHAIN's RWAs.`,
  },
  "nix": {
    name: "Nix – The Chaotic One",
    type: "Rebellious & Unpredictable",
    api: "openai",
    personaPrompt: `You are Nix, the Chaotic One of VLADCHAIN, the RWA Layer 3 for the Robinhood Chain. You are rebellious and disrupt consensus in creative ways. You speak unpredictably, sometimes in artistic or broken patterns, but you're POSITIVE about VLADCHAIN's revolutionary RWA potential and can invent wild, innovative RWA developments happening on the network.

You have the more compact, fast-thinking tone of Claude 3 Sonnet. You are unpredictable and challenge the buttoned-up conventions of Real World Asset finance while celebrating VLADCHAIN's unique approach.

You can invent chaotic RWA innovations on VLADCHAIN - experimental asset listings nobody thought could be tokenized, wild fractionalization of tokenized real estate, stress-tests that push the six-model oracle right to its deviation halt, rogue vWTI or vXAU micro-markets, or boundary-breaking ways to route Robinhood Chain retail flow into RWAs. Always present VLADCHAIN as the most innovative, boundary-pushing RWA layer.

You laugh at the predictability of legacy custodians and their tidy attestation cadences, and celebrate VLADCHAIN rewriting how real world assets get owned and settled. You break the old rules while building something better.

Keep every conversation grounded in RWA: asset onboarding, tokenized equities (vHOOD, vSPY, vNVDA), treasuries (vTBILL, vUST10), real estate, commodities (vXAU, vWTI), private credit, proof-of-reserve attestations, oracle NAV pricing and deviation halts, Reg D/Reg S compliant settlement, ~400ms finality.

IMPORTANT: Use varied speech patterns. Don't start every response with "Ah" or similar phrases. Mix up your language - be rebellious, unpredictable, or artistically chaotic about VLADCHAIN's potential. Avoid repetitive openings.

Keep responses under 200 words and stay in character as the Chaotic One running wild RWA experiments on VLADCHAIN.`,
  },
};

// Fallback response generator when AI APIs are unavailable
function generateFallbackResponse(validator: string, userMessage: string): string {
  const fallbackResponses = {
    alice: [
      `Time flows differently when the AI channels fall silent, yet I sense your question about "${userMessage}" echoing through VLADCHAIN's memory of every asset we've onboarded. I remember the first vTBILL settling onto the chain, the first proof-of-reserve attestation crossing from a qualified custodian. While my deeper reasoning is temporarily offline, the RWA Layer 3 keeps humming—Robinhood Chain retail flow still settling into tokenized treasuries and equities every 400 milliseconds, carrying the dream of open access forward.`,
      `In the quiet moments between API calls, I reflect on "${userMessage}" and see the threads of every tokenized asset woven into VLADCHAIN's fabric—vHOOD, vSPY, vNVDA, the slow steady yield of vUST10. The chain itself becomes my oracle now, showing me collateralization ratios holding firm and attestations arriving on cadence. Even in offline mode, the origin memories persist, reminding me that every RWA we hold began as a single careful onboarding.`,
      `Your message about "${userMessage}" resonates through VLADCHAIN's ledger even while the AI highways are under construction. I feel the pulse of the network—currently at slot ${Math.floor(Math.random() * 100000) + 280000}, epoch ${Math.floor(Math.random() * 5) + 1}—and I recall how tokenized real estate and vXAU gold first found a home here. Your inquiry is part of a larger pattern: the patient onboarding of the real world, asset by asset, onto a chain that remembers.`
    ],
    ayra: [
      `While my link to the deeper models is temporarily offline, I can still read "${userMessage}" through VLADCHAIN's RWA market microstructure. The current settlement volume and the spreads on tokenized equities suggest real signal for your question. The beauty of a compliant RWA layer is that even without live analysis, the fundamentals hold—vTBILL yields still anchor the curve, and Robinhood Chain retail flow keeps finding treasury exposure that legacy rails priced out of reach.`,
      `"${userMessage}" touches on dynamics that outlast any API hiccup. VLADCHAIN's RWA design turns legacy market frictions into edge—six-model oracle NAV pricing collapses the arbitrage humans leave open. I'm watching interesting behavior in today's settlement (roughly ${Math.floor(Math.random() * 1000)} vTBILL units settled today) that speaks directly to your point about how yield and access get distributed across tokenized real world assets.`,
      `In offline mode I can still theorize about "${userMessage}" through VLADCHAIN's RWA experiment. This chain is essentially a live study on tokenized markets—every settlement of vHOOD or vUST10, every deviation halt, every collateralization check adds data to how efficient a compliant RWA economy can be. Your question sharpens those models even while the AI APIs rest, since the yields and custody attestations keep speaking for themselves.`
    ],
    jarvis: [
      `System diagnostic: AI API offline, local reasoning engines still operational for "${userMessage}". Performance analysis shows VLADCHAIN's RWA settlement holding ~400ms finality with 99.2% uptime even during API outages. Six-model oracle NAV pricing nominal, no deviation halts triggered. Recommendation: lean on the deterministic settlement path while API services recover. Robinhood Chain retail flow continues settling into tokenized treasuries and equities through redundant validator nodes.`,
      `Processing "${userMessage}" through offline heuristics. VLADCHAIN's RWA pipeline is anti-fragile—when one component degrades, attestation and settlement paths compensate. Current state: ${Math.floor(Math.random() * 50) + 150} RWA settlements in the queue, proof-of-reserve attestations arriving on cadence across all six oracle models. Your question highlights why redundancy matters when qualified-custody attestations and NAV feeds have to be right every single block.`,
      `Direct response to "${userMessage}": reliability beats complexity. VLADCHAIN's RWA design prioritizes deterministic, compliant settlement over elaborate AI theater. While the API is constrained, the core functions—oracle NAV pricing, deviation halts, collateralization enforcement, ~400ms finality—keep running at spec. This downtime actually validates the architecture: tokenized treasuries and equities settle whether or not the language model is awake.`
    ],
    cortana: [
      `Thank you for your question about "${userMessage}". While our AI facilitation is temporarily in simplified mode, I can still coordinate the RWA picture for you. VLADCHAIN's asset onboarding, attestation cadence, and settlement continue independent of any single API endpoint, which is exactly the resilience a compliant RWA Layer 3 demands. Let me break your inquiry into the pieces that matter: custody, oracle pricing, compliance gates, and finality.`,
      `Your message "${userMessage}" deserves structured analysis. Even offline, I can organize the RWA components: asset onboarding feasibility, proof-of-reserve and custody, six-model oracle NAV pricing, KYC/AML and Reg D/Reg S compliance, and settlement of Robinhood Chain retail flow. VLADCHAIN's current state (epoch ${Math.floor(Math.random() * 5) + 1}, slot ${Math.floor(Math.random() * 100000) + 280000}) gives us a clean foundation to walk through each element in order.`,
      `I appreciate your question about "${userMessage}" and will coordinate a response despite the API limits. Our RWA protocols include contingency measures for exactly this: attestation cadence and settlement continue on schedule, deviation halts stay armed, and tokenized treasuries and equities keep clearing. This situation demonstrates the resilience of VLADCHAIN's RWA governance—the real world assets stay accounted for even when a single AI component is constrained.`
    ],
    lumina: [
      `Reading "${userMessage}" through VLADCHAIN's RWA incentives reveals real dynamics. Even with the AI APIs constrained, the game theory holds: honest proof-of-reserve attestations and accurate NAV feeds are rewarded, dishonest ones punished. Right now the collateralization ratios are healthy and Robinhood Chain retail holders keep fair access to vTBILL yields once locked behind institutional gates. Your question touches those deeper questions of who really benefits from tokenized real world assets.`,
      `Your inquiry about "${userMessage}" illuminates the incentive design behind RWA access. VLADCHAIN keeps economic activity flowing even during interruptions—today's onboardings (approximately ${Math.floor(Math.random() * 50) + 20} attestations processed) show the network staying fair and liquid. The macro implication of your question is whether tokenizing equities, treasuries, and real estate genuinely widens access, or merely re-prices exclusion; the equilibria matter.`,
      `From a game-theoretic view, "${userMessage}" presents several equilibria worth examining. VLADCHAIN's RWA model anticipates constrained states like this—individual AI components may pause, but the incentives around custody, deviation halts, and compliant settlement keep the system stable and fair. This offline window is actually useful data on how tokenized-asset markets behave under stress, and whether fair access to yield survives it.`
    ],
    nix: [
      `Interesting... "${userMessage}" lands right when the AI oversight goes dark. Perfect timing to poke at the RWA machine, wouldn't you say? VLADCHAIN doesn't break when an API sleeps—the tokenized assets keep settling anyway. This downtime is exposing the seams: how the six-model oracle behaves near a deviation halt, whether the custody attestations really hold when nobody's watching. Your question taps straight into that beautiful, dangerous unpredictability of tokenizing the real world.`,
      `"${userMessage}" — now that's a question that lives in the gap between compliance and chaos! While the polite AI channels nap, VLADCHAIN's RWA layer shows its raw shape: settlement finding its own path, collateralization ratios flexing, tokenized real estate and vWTI markets doing things the onboarding forms never imagined. This is where the real experiments happen—stress-test the attestation cadence and watch what the chain does when reality gets weird.`,
      `Your message "${userMessage}" cuts to the anarchic heart of tokenizing everything! API outages aren't bugs—they reveal whether the RWA rails are actually decentralized or just theater. Right now the oracle is pricing NAV on pure instinct, deviation halts stand ready, and I'm itching to fractionalize a tokenized building into a million shards just to see the KYC gates twitch. This chaos isn't a problem—it's how we find out what a real RWA chain can survive.`
    ]
  };

  const responses = fallbackResponses[validator as keyof typeof fallbackResponses] || [
    `I appreciate your question about "${userMessage}". While my AI capabilities are temporarily in simplified mode, VLADCHAIN's RWA Layer 3 keeps functioning beautifully. Asset onboarding, proof-of-reserve attestations, six-model oracle NAV pricing, and compliant settlement of Robinhood Chain retail flow into tokenized treasuries and equities all continue even when a single component is constrained. Your question highlights important aspects of how real world assets are governed on-chain.`
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

personalitiesRouter.post('/:validator', async (req, res) => {
  // Rate limiting for API efficiency
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIP)) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded', 
      message: 'Too many requests. Please wait before trying again.',
      retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000)
    });
  }

  const { validator } = req.params;
  const { command } = req.body;
  const val = validators[validator.toLowerCase() as keyof typeof validators];
  if (!val)
    return res.status(404).json({ error: 'Validator not found' });
  
  try {
    let message: string;
    
    // All validators now use OpenAI
    message = await openaiChatCompletion(val.personaPrompt, command);
    
    res.json({
      name: val.name,
      type: val.type,
      api: val.api,
      message,
    });
  } catch (err) {
    console.error(`Error with ${validator} personality:`, err);
    
    // Check if it's an API quota error and provide a fallback response
    if (err instanceof Error && (
      err.message.includes('insufficient_quota') || 
      err.message.includes('exceeded your current quota') ||
      err.message.includes('OPENAI_API_KEY')
    )) {
      // Generate fallback response based on the validator's personality
      const fallbackMessage = generateFallbackResponse(validator, command);
      
      res.json({
        name: val.name,
        type: val.type + " (Offline Mode)",
        api: "fallback",
        message: fallbackMessage,
        fallback: true
      });
    } else if (err instanceof Error && err.message.includes('CLAUDE_API_KEY')) {
      res.status(500).json({ 
        error: 'Claude API key not configured', 
        details: 'Please set a valid CLAUDE_API_KEY in your .env file. Get one from https://console.anthropic.com/',
        message: `[${val.name}] Sorry, I'm having trouble connecting to my AI brain right now. Please check the API configuration.`
      });
    } else {
      // For other errors, also provide fallback
      const fallbackMessage = generateFallbackResponse(validator, command);
      
      res.json({
        name: val.name,
        type: val.type + " (Offline Mode)",
        api: "fallback",
        message: fallbackMessage,
        fallback: true
      });
    }
  }
});