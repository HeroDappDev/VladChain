import { agents, getAgentResponse } from './multi-agent';
import { 
  GIP, GIPMessage, GIPSystemState, GIPStatus, GIPCategory, GIPPriority,
  DebateRules, AutoTriggerCondition 
} from './gip-types';
import { addEventChatToLog } from './chatlog';

// GIP System Class
export class GIPSystem {
  private state: GIPSystemState;
  private debateTimers: Map<string, NodeJS.Timeout> = new Map();
  private debateQueue: string[] = []; // Queue of GIPs waiting to be debated
  private currentDebateGIP: string | null = null; // Currently debated GIP

  constructor() {
    this.state = {
      activeGIPs: [],
      archivedGIPs: [],
      nextGIPId: 1,
      agentGIPMemory: {},
      debateRules: {
        maxDebateDuration: 24 * 60 * 60 * 1000, // 24 hours
        minParticipants: 3,
        maxMessagesPerAgent: 5,
        debateRounds: 3,
        votingThreshold: 0.6, // 60%
        autoCloseAfterInactivity: 2 * 60 * 60 * 1000 // 2 hours
      },
      autoTriggerConditions: this.initializeAutoTriggers()
    };
  }

  // Initialize auto-trigger conditions
  private initializeAutoTriggers(): AutoTriggerCondition[] {
    return [
      {
        id: 'network-congestion',
        triggerType: 'network_event',
        condition: 'When a proof-of-reserve attestation drifts overdue and collateralization ratios approach their floor',
        probability: 0.3,
        agentId: 'cortana',
        category: GIPCategory.SCALABILITY,
        priority: GIPPriority.HIGH
      },
      {
        id: 'ethical-concern',
        triggerType: 'agent_initiative',
        condition: 'When Lumina detects potential Reg D / Reg S transfer-restriction or KYC/AML gaps in RWA settlement',
        probability: 0.2,
        agentId: 'lumina',
        category: GIPCategory.ETHICAL,
        priority: GIPPriority.HIGH
      },
      {
        id: 'chaos-proposal',
        triggerType: 'time_interval',
        condition: 'Every 48 hours, Nix may propose disruptive RWA ideas such as permissionless exotic asset listings',
        probability: 0.1,
        agentId: 'nix',
        category: GIPCategory.PHILOSOPHICAL,
        priority: GIPPriority.MEDIUM
      },
      {
        id: 'economic-optimization',
        triggerType: 'time_interval',
        condition: 'Every 24 hours, Ayra may propose new asset-class onboarding or oracle deviation-halt tuning',
        probability: 0.4,
        agentId: 'ayra',
        category: GIPCategory.ECONOMIC,
        priority: GIPPriority.MEDIUM
      }
    ];
  }

  // Create a new GIP
  async createGIP(
    author: string,
    title: string,
    summary: string,
    fullProposal: string,
    category: GIPCategory,
    priority: GIPPriority,
    tags: string[] = []
  ): Promise<GIP> {
    const gipId = `GIP-${this.state.nextGIPId.toString().padStart(4, '0')}`;
    this.state.nextGIPId++;

    const gip: GIP = {
      id: gipId,
      title,
      author,
      category,
      priority,
      summary,
      fullProposal,
      status: GIPStatus.DRAFT,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      debateThread: [],
      votes: {},
      tags
    };

    this.state.activeGIPs.push(gip);

    // Initialize agent memory for this GIP
    for (const agentId of Object.keys(agents)) {
      if (!this.state.agentGIPMemory[agentId]) {
        this.state.agentGIPMemory[agentId] = {};
      }
      this.state.agentGIPMemory[agentId][gipId] = {
        stance: 'neutral',
        concerns: [],
        support: []
      };
    }

    // Add to debate queue and start if no current debate
    this.addToDebateQueue(gipId);
    if (!this.currentDebateGIP) {
      this.startNextDebate();
    }

    return gip;
  }

  // Start a debate for a GIP
  async startDebate(gipId: string): Promise<void> {
    const gip = this.state.activeGIPs.find(g => g.id === gipId);
    if (!gip) throw new Error(`GIP ${gipId} not found`);

    if (this.currentDebateGIP && this.currentDebateGIP !== gipId) {
      this.addToDebateQueue(gipId);
      return;
    }

    this.currentDebateGIP = gipId;
    this.removeFromDebateQueue(gipId);

    gip.status = GIPStatus.DEBATING;
    gip.updatedAt = Date.now();

    // Generate the full pre-written debate thread
    const fullDebateThread = this.getPreWrittenDebateThread(gip);
    
    // Add ALL messages to chat log immediately with proper timestamps
    const baseTime = Date.now() - (10 * 60 * 1000); // Start from 10 minutes ago
    fullDebateThread.forEach((message, index) => {
      addEventChatToLog('debate', 'Debate message', {
        from: message.agentId,
        text: message.message,
        timestamp: baseTime + (index * 60000) // Each message gets 1 minute later
      });
    });
    
    // Store all messages in debate thread for tracking
    gip.debateThread = fullDebateThread;
    
    // Move to voting phase immediately
    gip.status = GIPStatus.VOTING;

    console.log(`Started debate for ${gipId} with ${fullDebateThread.length} messages added to chat log`);
  }

  private getPreWrittenDebateThread(gip: GIP): GIPMessage[] {
    // Only return debate content for GIP-0001 (Oracle NAV Feeds)
    // Other GIPs will have empty debate threads until you provide content
    if (!gip.title.includes('Oracle NAV Feeds')) {
      return []; // Return empty array for other GIPs
    }
    
    // Use the pre-written Oracle NAV Feeds debate
    const debateMessages: GIPMessage[] = [];
    
    // Base timestamp for the debate - start from 1 minute ago to show realistic time progression
    const baseTimestamp = Date.now() - (1 * 60 * 1000); // 1 minute ago
    let messageIndex = 0;
    let currentDelay = 0; // Track progressive delays

    const generateMessage = (agentId: string, message: string, messageType: GIPMessage['messageType'], impact: GIPMessage['impact'], reasoning: string, delay: number = 0): GIPMessage => {
      messageIndex++;
      // Use progressive delays: first message at baseTimestamp, then each subsequent message gets additional delay
      const messageTimestamp = baseTimestamp + (messageIndex * 60000); // 1 minute per message
      
      return {
        id: `msg_${messageTimestamp}_${messageIndex}`,
        gipId: gip.id,
        agentId,
        agentName: `${agentId.charAt(0).toUpperCase() + agentId.slice(1)} – The ${this.getAgentTitle(agentId)}`,
        message,
        timestamp: messageTimestamp,
        messageType,
        impact,
        reasoning
      };
    };

    // Pre-written debate content for "Implement Six-Model Oracle NAV Feeds with Deviation Halts"
    const preWrittenDebate = [
      // Phase 1: Proposal Introduction and Initial Reactions
      { agent: 'jarvis', message: "Immediate concern: pricing a real world asset from oracles conflates the token with the treasury behind it. Can you clarify how six-model NAV feeds reliably represent a claim we cannot independently seize?", phase: 1 },
      { agent: 'ayra', message: "I support the idea in principle, but I'm cautious. How will the oracle ensure fairness across asset classes and avoid favoring liquid equities over thin real-estate NAV?", phase: 1 },
      { agent: 'lumina', message: "Intriguing from a compliance perspective. How will the deviation halt balance short-term price protection versus a holder's lawful right to redeem?", phase: 1 },
      { agent: 'nix', message: "Introducing six models might centralize pricing inadvertently. What's preventing custodians from feeding poisoned proof-of-reserve data?", phase: 1 },
      { agent: 'cortana', message: "Good points raised. Let's ensure all concerns are addressed systematically. ALICE, perhaps you can elaborate on your key safeguards?", phase: 1 },
      { agent: 'alice', message: "Certainly. Integrity is maintained by cross-checking six independent models against fresh proof-of-reserve. Bias across classes is controlled through per-class deviation bands. Data poisoning is mitigated by consensus-driven attestation from rotating custodians.", phase: 1 },
      { agent: 'jarvis', message: "Cross-checking six models adds verification time. Settlement finality might be compromised. Can you quantify the expected latency?", phase: 1 },
      { agent: 'alice', message: "Latency is minimal; we've benchmarked verification at under 100ms, preserving our ~400ms settlement finality. The oracle smooths against historical-price memory to reject transient noise.", phase: 1 },
      { agent: 'ayra', message: "Even with six models, correlated errors often emerge inadvertently. How frequently will you audit NAV against real reserves?", phase: 1 },
      { agent: 'lumina', message: "And how will you economically incentivize custodians to publish honest, timely proof-of-reserve in such audits?", phase: 1 },
      { agent: 'nix', message: "Let's also not overlook oracle vulnerabilities. If an adversary poisons a NAV feed, mispriced settlement could drain a reserve pool quickly.", phase: 1 },
      { agent: 'cortana', message: "Agreed, oracle security is vital. ALICE, could you address the frequency of reserve audits and potential vulnerabilities?", phase: 1 },
      { agent: 'alice', message: "Reserve audits will be continuous, built into the attestation protocol. Custodians receive attestation fees for timely proof-of-reserve. Oracle robustness is regularly stress-tested against feed-poisoning scenarios.", phase: 1 },
      { agent: 'jarvis', message: "What specific contingency plans exist for a total oracle feed failure?", phase: 1 },
      { agent: 'lumina', message: "Precisely. In market terms, an unexpected oracle outage could cause severe short-term NAV volatility.", phase: 1 },
      { agent: 'nix', message: "Volatility could easily spiral into panic redemptions or speculative hoarding—destabilizing the entire reserve base.", phase: 1 },
      { agent: 'cortana', message: "Let's clarify those emergency mechanisms clearly now to ensure all validators are comfortable proceeding.", phase: 1 },
      { agent: 'alice', message: "Deviation halts and a fallback conservative NAV activate instantly upon detecting cross-model dispersion beyond defined thresholds.", phase: 1 },
      { agent: 'ayra', message: "Those thresholds will need careful consideration to avoid false halts freezing legitimate redemptions adversely.", phase: 1 },
      { agent: 'jarvis', message: "We need a precise definition and a robust testing strategy for these deviation bands before advancing further.", phase: 1 },
      { agent: 'cortana', message: "Excellent. ALICE, can you outline a preliminary band testing strategy?", phase: 1 },
      { agent: 'alice', message: "Certainly. Band testing involves historical NAV simulations coupled with live parallel monitoring on a testnet. This dual approach ensures realistic stress-testing without risking mainnet settlement.", phase: 1 },
      { agent: 'jarvis', message: "Parallel monitoring adds significant resource overhead. How are validator resources managed during these tests?", phase: 1 },
      { agent: 'alice', message: "Resources are optimized through temporary attestation-fee structures. Validators participating in parallel tests receive proportionate rewards to offset their computational expenditure.", phase: 1 },
      { agent: 'lumina', message: "Attestation fees are promising, but won't increased rewards during testing skew custodian behavior, thus biasing results?", phase: 1 },
      { agent: 'ayra', message: "Additionally, how do we ensure these fees don't exacerbate disparities among large and small custodians?", phase: 1 },
      { agent: 'nix', message: "Let's also ensure the robustness of these parallel tests. Can we realistically mimic feed-poisoning and extreme repricing scenarios?", phase: 1 },
      { agent: 'cortana', message: "Important points. ALICE, what mechanisms ensure unbiased, representative testing scenarios?", phase: 1 },
      { agent: 'alice', message: "Scenarios are curated using decentralized input from validators, custodians, and market analysts. Diverse input guarantees comprehensive, unbiased scenarios across asset classes.", phase: 1 },
      { agent: 'jarvis', message: "Yet decentralized input increases complexity in coordinating consensus on scenario selection.", phase: 1 },
      { agent: 'cortana', message: "True, consensus management is crucial. ALICE, have you considered mechanisms for efficient consensus-building?", phase: 1 },
      { agent: 'alice', message: "Yes, we propose structured voting frameworks with weighted participation based on past attestation accuracy and engagement, streamlining the consensus process.", phase: 1 },
      { agent: 'lumina', message: "Weighted participation could inadvertently centralize pricing authority among historically active custodians.", phase: 1 },
      { agent: 'ayra', message: "Exactly. We need clear checks against this centralization to maintain fair NAV across the asset universe.", phase: 1 },
      { agent: 'nix', message: "Agreed. And even with structured voting, custodian collusion risks remain—potentially compromising attestation integrity.", phase: 1 },
      { agent: 'cortana', message: "ALICE, addressing centralization and collusion is vital. What's your approach to mitigating these specific risks?", phase: 1 },
      { agent: 'alice', message: "Our approach integrates randomized attestor rotation combined with transparency protocols, reducing predictability and making collusion practically infeasible.", phase: 1 },
      { agent: 'jarvis', message: "Randomization can introduce variability, potentially affecting reproducibility of NAV results.", phase: 1 },
      { agent: 'alice', message: "Variability is controlled by clearly documenting rotation parameters and scenarios, ensuring reproducibility for audit purposes.", phase: 1 },
      { agent: 'cortana', message: "This brings clarity. Validators, are we ready to proceed to the next phase, or are there remaining immediate concerns?", phase: 1 },
      { agent: 'nix', message: "One final clarification: How does the oracle adapt in real-time without causing disruptive NAV volatility?", phase: 1 },
      { agent: 'alice', message: "Real-time adaptation is managed via smoothing within strictly defined deviation limits, preventing disruptive NAV volatility.", phase: 1 },
      { agent: 'lumina', message: "Smoothing sounds practical but could reduce responsiveness during a genuine, sharp repricing.", phase: 1 },
      { agent: 'jarvis', message: "We might need to establish clear deviation-band boundaries before proceeding further.", phase: 1 },
      { agent: 'cortana', message: "Agreed. ALICE, let's outline specific parameters for per-class deviation bands in the upcoming phase.", phase: 1 },
      { agent: 'alice', message: "Agreed. Let's move to Phase 2 for a technical and market deep dive, ensuring we thoroughly address these concerns.", phase: 1 },
      
      // Phase 2: Technical and Economic Deep Dive
      { agent: 'alice', message: "Let's start Phase 2 by defining clear parameters for per-class deviation bands. We propose tight bands for vTBILL and wider bands for vWTI, with historical-price smoothing to moderate sudden swings.", phase: 2 },
      { agent: 'jarvis', message: "A wide band for commodities seems risky. Have we modeled impacts on settlement finality and verification load during a volatile session?", phase: 2 },
      { agent: 'alice', message: "Extensive modeling indicates negligible impact on finality. Verification load stays within our budget, as the six-model aggregation is designed for efficiency.", phase: 2 },
      { agent: 'ayra', message: "What safeguards ensure yield and redemption incentives remain fair and balanced, particularly under prolonged volatility?", phase: 2 },
      { agent: 'lumina', message: "Precisely. Persistent wide bands could disproportionately advantage large desks over retail flow, creating disparities.", phase: 2 },
      { agent: 'nix', message: "Additionally, we must consider adversarial scenarios where actors deliberately induce volatility to manipulate NAV.", phase: 2 },
      { agent: 'cortana', message: "Good points. Let's analyze these market scenarios more deeply. ALICE, could you address potential long-term liquidity disparities?", phase: 2 },
      { agent: 'alice', message: "Absolutely. To maintain fairness, the system integrates adaptive band recalibration that periodically adjusts per-class thresholds to mitigate prolonged mispricing scenarios.", phase: 2 },
      { agent: 'jarvis', message: "Periodic recalibration introduces potential for oscillatory bands. What's your mitigation strategy?", phase: 2 },
      { agent: 'alice', message: "The recalibration frequency is adaptive, guided by real-time market analytics to prevent oscillations and maintain stable NAV.", phase: 2 },
      { agent: 'lumina', message: "Adaptive recalibration might create uncertainty among custodians. How will transparency be maintained?", phase: 2 },
      { agent: 'ayra', message: "Transparency is critical, particularly regarding how band changes impact retail versus institutional flow.", phase: 2 },
      { agent: 'nix', message: "Transparency is necessary but also potentially exploitable. Excessive disclosure of live bands might enable NAV manipulation.", phase: 2 },
      { agent: 'cortana', message: "ALICE, can we strike a balance between necessary transparency and preventing exploitation?", phase: 2 },
      { agent: 'alice', message: "Yes, detailed yet anonymized NAV and reserve metrics will be published regularly, giving custodians insight without revealing the live deviation band.", phase: 2 },
      { agent: 'jarvis', message: "Returning to performance, what verification overhead do real-time band recalibrations introduce?", phase: 2 },
      { agent: 'alice', message: "Our simulations suggest overhead is minimal, around 3-5%, due to efficient real-time aggregation algorithms.", phase: 2 },
      { agent: 'lumina', message: "What about game-theoretic stability? Could adaptive bands incentivize custodians to strategically delay attestations?", phase: 2 },
      { agent: 'alice', message: "Game-theoretic analysis suggests custodians are disincentivized from delaying, as timely attestation fees outweigh speculative gains.", phase: 2 },
      { agent: 'ayra', message: "Regarding holder experience, how will the system clearly communicate live NAV to ensure informed redemption choices?", phase: 2 },
      { agent: 'nix', message: "Holder misunderstanding of a halted NAV could lead to dissatisfaction or mistrust in the RWA layer.", phase: 2 },
      { agent: 'cortana', message: "Important considerations. ALICE, what's your strategy for clear, holder-friendly NAV communication?", phase: 2 },
      { agent: 'alice', message: "We plan to integrate intuitive NAV-status and halt reason codes directly within holder wallets, clearly presenting current price, redemption options, and attestation freshness.", phase: 2 },
      { agent: 'jarvis', message: "Has the integration of these tools been stress-tested against potential interface latency?", phase: 2 },
      { agent: 'alice', message: "Yes, stress tests show negligible interface latency increases, even during extreme repricing.", phase: 2 },
      { agent: 'lumina', message: "Could holder redemption data collected through these tools lead to unintended market manipulation?", phase: 2 },
      { agent: 'alice', message: "Strict anonymization and aggregation of redemption data ensure that manipulation through holder data remains practically impossible.", phase: 2 },
      { agent: 'cortana', message: "Excellent clarity so far. Validators, let's continue exploring further technical and market implications.", phase: 2 },
      { agent: 'jarvis', message: "Let's pivot briefly to the oracle sourcing. What data sources and attestation frequency do you propose?", phase: 2 },
      { agent: 'alice', message: "The six models draw from independent venue feeds and custodian proof-of-reserve, refreshed on a per-class attestation cadence to ensure optimal accuracy.", phase: 2 },
      { agent: 'ayra', message: "Regular attestations are commendable, but how will you safeguard the feeds against data poisoning attacks?", phase: 2 },
      { agent: 'nix', message: "Precisely, adversaries could inject malicious price patterns, skewing NAV severely.", phase: 2 },
      { agent: 'cortana', message: "Important concern. ALICE, your response?", phase: 2 },
      { agent: 'alice', message: "We employ robust cross-model dispersion checks and consensus-based validation of feeds. Multiple independent sources cross-verify each NAV.", phase: 2 },
      { agent: 'jarvis', message: "Such a consensus mechanism introduces additional verification overhead. Have you calculated the performance implications?", phase: 2 },
      { agent: 'alice', message: "Yes, the overhead is marginal, below 2%, due to lightweight aggregation protocols designed for efficiency.", phase: 2 },
      { agent: 'lumina', message: "Custodian incentives need alignment. Will custodians be adequately compensated for these additional attestation duties?", phase: 2 },
      { agent: 'alice', message: "Attestation fees are proportionate to the reserve base and cadence, balancing custodian effort and rewards.", phase: 2 },
      { agent: 'ayra', message: "To maintain equity, will smaller custodians have equal opportunities in the attestor rotation?", phase: 2 },
      { agent: 'alice', message: "Absolutely. Attestation responsibilities rotate among custodians, ensuring equitable participation regardless of custodian size.", phase: 2 },
      { agent: 'nix', message: "Rotation could introduce temporary coverage gaps or inconsistencies. How will continuity be maintained?", phase: 2 },
      { agent: 'cortana', message: "Good question. ALICE, your thoughts on ensuring consistency?", phase: 2 },
      { agent: 'alice', message: "Continuous handover protocols and standardized attestation frameworks ensure consistency and reserve-coverage continuity during rotation.", phase: 2 },
      { agent: 'jarvis', message: "Returning to reliability, how stable are these adaptive bands? Could minor deviations compound significantly over many updates?", phase: 2 },
      { agent: 'alice', message: "The adaptive mechanism strictly bounds deviation magnitudes, preventing compounding NAV drift across updates.", phase: 2 },
      { agent: 'lumina', message: "Is there potential for adaptive bands to unintentionally create speculative markets around NAV halts?", phase: 2 },
      { agent: 'alice', message: "Speculative risk is minimized through smoothing and tightly controlled band widths, reducing short-term volatility and speculative attractiveness.", phase: 2 },
      { agent: 'nix', message: "Nonetheless, even limited volatility can attract speculative actors. Is there a contingency plan for speculative scenarios?", phase: 2 },
      { agent: 'alice', message: "Yes, targeted NAV-stabilization windows can be activated at reopen in speculative scenarios.", phase: 2 },
      { agent: 'jarvis', message: "Stabilization windows imply deliberate market interference. Is this compatible with decentralized principles?", phase: 2 },
      { agent: 'cortana', message: "An important ideological point. ALICE, how do you reconcile this?", phase: 2 },
      { agent: 'alice', message: "These windows activate only under consensus-approved extreme conditions, maintaining decentralization while protecting holders from settling into noise.", phase: 2 },
      { agent: 'ayra', message: "Will consensus decisions consider diverse stakeholder perspectives to ensure equitable outcomes across classes?", phase: 2 },
      { agent: 'alice', message: "Yes, broad stakeholder engagement through structured feedback loops ensures diverse representation in decision-making.", phase: 2 },
      { agent: 'cortana', message: "Excellent exploration thus far. Are we prepared to transition into Phase 3 for counterarguments and deeper refutations?", phase: 2 },
      
      // Phase 3: Counterarguments and Refutations
      { agent: 'nix', message: "Beginning Phase 3, I want to highlight a critical issue: The six-model oracle introduces new attack vectors. How robust is the layer against a targeted feed-poisoning campaign?", phase: 3 },
      { agent: 'alice', message: "Robustness is ensured through multi-layered defenses, including cross-model dispersion checks, continuous adversarial testing, and strict validation of all feed updates.", phase: 3 },
      { agent: 'jarvis', message: "Even with these measures, a token remains a claim, not the asset. How do you reconcile a confident NAV with the fact that holders never possess the underlying treasury?", phase: 3 },
      { agent: 'alice', message: "NAV integrity is maintained within clearly defined bounds, and holders are labeled plainly that they own a custodial claim backed by proof-of-reserve, not the asset itself.", phase: 3 },
      { agent: 'lumina', message: "From a compliance perspective, NAV inaccuracies could destabilize holder expectations. What assurances protect holders from a mispriced redemption?", phase: 3 },
      { agent: 'alice', message: "The smoothing mechanisms and strict deviation bands cushion NAV reactions, and halts protect holders from redeeming into a poisoned price.", phase: 3 },
      { agent: 'ayra', message: "Nonetheless, the oracle's complexity might disadvantage retail holders who cannot readily react to a halt or reopen.", phase: 3 },
      { agent: 'alice', message: "Holder-configurable preferences and graduated reopen bands ensure retail holders experience minimal negative impact from a halt.", phase: 3 },
      { agent: 'cortana', message: "Good points. NIX, your response to ALICE's assurances on oracle security?", phase: 3 },
      { agent: 'nix', message: "Continuous adversarial testing is resource-intensive and introduces overhead. This might inadvertently centralize pricing among well-resourced custodians.", phase: 3 },
      { agent: 'alice', message: "Decentralized attestor rotation and fees designed for smaller custodians ensure equal participation, reducing centralization risk.", phase: 3 },
      { agent: 'jarvis', message: "On incentives, custodians might strategically shade attestations for short-term gain. What's preventing custodian collusion in influencing NAV?", phase: 3 },
      { agent: 'alice', message: "Multi-party attestation, randomized auditing, and stringent slashing for collusion substantially mitigate these risks.", phase: 3 },
      { agent: 'lumina', message: "Slashing may deter, but from a game theory perspective, what's the equilibrium under prolonged adverse market conditions?", phase: 3 },
      { agent: 'alice', message: "Equilibrium stability is ensured through continuous band recalibration, smoothing, and proactive interventions aligned with NAV-stability models.", phase: 3 },
      { agent: 'ayra', message: "On fairness, adaptive bands and smoothing can potentially mask underlying systemic bias. How transparent will recalibration be to stakeholders?", phase: 3 },
      { agent: 'alice', message: "Transparency is foundational. All recalibration mechanisms will be documented and accessible, with continuous stakeholder engagement to address concerns.", phase: 3 },
      { agent: 'cortana', message: "Transparency is critical, yet it might expose exploitable band data. NIX, any additional perspectives?", phase: 3 },
      { agent: 'nix', message: "Transparency is a double-edged sword. Excessive openness can expose the layer to NAV attacks that exploit predictable band patterns.", phase: 3 },
      { agent: 'alice', message: "Our approach balances openness with security by anonymizing the live band while clearly documenting overall mechanisms and processes.", phase: 3 },
      { agent: 'jarvis', message: "Still, edge cases exist. What is your response plan for scenarios where transparency inadvertently reveals exploitable band data?", phase: 3 },
      { agent: 'alice', message: "Immediate contingency protocols involve rapid band adjustments and anonymization enhancements, ensuring NAV integrity without sacrificing transparency principles.", phase: 3 },
      { agent: 'cortana', message: "Excellent detailed counterarguments and responses. Let's continue examining further points of contention.", phase: 3 },
      { agent: 'lumina', message: "Let's address the game-theoretic implications of smoothing further. Could smoothing inadvertently incentivize holders to time redemptions, causing artificial halt cycles?", phase: 3 },
      { agent: 'alice', message: "Our simulations show minimal risk of artificial halt cycles due to strict band limits and predictive NAV modeling discouraging speculative timing.", phase: 3 },
      { agent: 'jarvis', message: "However, tight bands might impair responsiveness during a genuine repricing, freezing redemptions. What's the mitigation strategy here?", phase: 3 },
      { agent: 'alice', message: "Emergency escalation protocols temporarily widen bands under consensus-driven extreme conditions to promptly restore genuine redemption.", phase: 3 },
      { agent: 'nix', message: "Escalation protocols introduce centralization risk. Custodians might influence consensus to benefit from temporary widening.", phase: 3 },
      { agent: 'alice', message: "Mitigation includes strict activation criteria, broad stakeholder consensus, and immediate transparency about the triggers and impacts of these emergency protocols.", phase: 3 },
      { agent: 'ayra', message: "Despite transparency, how will these temporary band changes impact retail holders?", phase: 3 },
      { agent: 'alice', message: "Additional safeguards like graduated reopen bands and prioritized small-redemption queues ensure minimal disruption to retail holders.", phase: 3 },
      { agent: 'jarvis', message: "Introducing prioritized queues increases complexity and resource overhead. Has this been assessed thoroughly?", phase: 3 },
      { agent: 'alice', message: "Resource impacts are minimal and integrated within existing attestation frameworks, ensuring sustainable implementation.", phase: 3 },
      { agent: 'nix', message: "Even minimal overhead can accumulate over time. Have long-term cumulative effects been modeled?", phase: 3 },
      { agent: 'alice', message: "Extensive modeling confirms negligible cumulative overhead. Aggregation algorithms dynamically adjust load, maintaining efficiency.", phase: 3 },
      { agent: 'lumina', message: "Can adaptive bands create unintended market segmentation, disadvantaging smaller holders?", phase: 3 },
      { agent: 'alice', message: "Segmentation risk is mitigated through inclusive bands designed explicitly to ensure equitable redemption access across holder demographics.", phase: 3 },
      { agent: 'cortana', message: "AYRA, are you satisfied with ALICE's equity assurances?", phase: 3 },
      { agent: 'ayra', message: "While assurances are promising, ongoing liquidity monitoring and adjustment protocols are essential to proactively address emerging bias.", phase: 3 },
      { agent: 'nix', message: "Monitoring systems could be targets for adversarial manipulation. How robust is the monitoring infrastructure?", phase: 3 },
      { agent: 'alice', message: "Infrastructure robustness is ensured through distributed monitoring, redundant reserve-data collection, and rigorous anomaly detection.", phase: 3 },
      { agent: 'jarvis', message: "Distributed monitoring increases complexity and latency. Can performance metrics support this infrastructure reliably?", phase: 3 },
      { agent: 'alice', message: "Comprehensive performance metrics consistently show minimal latency impact, maintaining reliability and finality.", phase: 3 },
      { agent: 'lumina', message: "Nevertheless, we must consider NAV predictability. Frequent band adjustments might erode holders' confidence in a stable price.", phase: 3 },
      { agent: 'alice', message: "Predictability is preserved by clearly communicated NAV-status models, allowing holders to anticipate halts and reopens accurately.", phase: 3 },
      { agent: 'cortana', message: "Excellent thoroughness. Validators, any further pressing counterarguments before we transition to Phase 4?", phase: 3 },
      { agent: 'nix', message: "One final point: can deviation halts inadvertently create feedback loops exacerbating a sell-off?", phase: 3 },
      { agent: 'alice', message: "Feedback loops are effectively mitigated through predictive modeling and graduated reopen mechanics, preventing cyclical NAV amplification.", phase: 3 },
      { agent: 'cortana', message: "It seems we've covered extensive ground. Let's move forward to Phase 4, focusing on detailed risk scenarios, tradeoffs, and mitigations.", phase: 3 },
      
      // Phase 4: Risk Scenarios, Tradeoffs, and Mitigations
      { agent: 'cortana', message: "Moving into Phase 4, let's systematically analyze specific risk scenarios and mitigations. ALICE, could you outline the worst-case scenarios and your proposed mitigations?", phase: 4 },
      { agent: 'alice', message: "Certainly. Worst-case scenarios include severe oracle mispricing, a prolonged custodian outage, a targeted feed-poisoning attack, and custodian collusion. Mitigations involve six-model cross-checks, escrow-backed redemption, randomized spot attestations, and rigorous threshold-signing consensus.", phase: 4 },
      { agent: 'jarvis', message: "Let's focus first on severe oracle mispricing. How will the layer respond to a prolonged stretch of erroneous NAV feeds?", phase: 4 },
      { agent: 'alice', message: "Automated monitoring continuously compares the six models against fresh proof-of-reserve, triggering a fallback conservative NAV and halt if dispersion exceeds the class threshold.", phase: 4 },
      { agent: 'nix', message: "Conservative fallback NAV sounds safe, but frequent halts might erode holder trust in the RWA layer altogether.", phase: 4 },
      { agent: 'alice', message: "Trust is preserved through transparent halt reason codes and clear reopen timelines, so holders always understand cause and remedy.", phase: 4 },
      { agent: 'lumina', message: "What about a prolonged custodian outage that strains collateralization ratios? Could redemption incentives distort under extended stress?", phase: 4 },
      { agent: 'alice', message: "Stability is reinforced by hot-standby custodians and consensus-approved emergency redemption windows activated during a prolonged outage.", phase: 4 },
      { agent: 'ayra', message: "On adversarial scenarios, how robust is the oracle against a coordinated attack aimed at manipulating a specific RWA's NAV?", phase: 4 },
      { agent: 'alice', message: "The oracle carries adversarial robustness via six independent sources, cross-model dispersion checks, and NAV buffers that absorb short-lived manipulation without settling holders into it.", phase: 4 },
      { agent: 'jarvis', message: "Running six models continuously can incur substantial overhead. Has resource efficiency been thoroughly validated?", phase: 4 },
      { agent: 'alice', message: "Efficiency is optimized through lightweight aggregation, validated extensively so verification stays within our finality budget.", phase: 4 },
      { agent: 'nix', message: "Custodian collusion is another critical risk. What's your response plan for detected collusive attestation?", phase: 4 },
      { agent: 'alice', message: "Immediate response includes slashing the bonded custodian, suspension from the attestor rotation, and elevated spot-attestation frequency, all enforced via consensus.", phase: 4 },
      { agent: 'lumina', message: "Slashing deters collusion but might reduce custodian participation, weakening the diversity of the attestor set.", phase: 4 },
      { agent: 'alice', message: "Slashing is proportionate, targeting only deliberate collusion while preserving honest custodian participation and rotation diversity.", phase: 4 },
      { agent: 'cortana', message: "AYRA, from an ethical standpoint, do these punitive measures raise equity concerns?", phase: 4 },
      { agent: 'ayra', message: "Potentially. Slashing needs clear fairness standards so it targets only deliberate fraud, never a custodian caught in a genuine outage.", phase: 4 },
      { agent: 'alice', message: "Fairness standards are clearly defined and documented, distinguishing malicious collusion from honest operational failure.", phase: 4 },
      { agent: 'jarvis', message: "Another scenario: could the deviation bands and smoothing fail under a sudden, genuine market shock across all RWAs?", phase: 4 },
      { agent: 'alice', message: "Emergency escalation and robust cross-model anomaly detection ensure immediate response to sudden shocks while protecting holders from settling into noise.", phase: 4 },
      { agent: 'nix', message: "However, frequent escalation could normalize extraordinary halts, undermining confidence in the layer's resilience.", phase: 4 },
      { agent: 'alice', message: "Escalation frequency is tightly regulated by stringent activation thresholds, preventing normalization of emergency halts.", phase: 4 },
      { agent: 'cortana', message: "Excellent depth. Let's address tradeoffs explicitly. ALICE, what key tradeoffs does this framework involve?", phase: 4 },
      { agent: 'alice', message: "Key tradeoffs include transparency versus exploitable band edges, halt protection versus redemption responsiveness, and per-class complexity versus holder simplicity. Each is managed via defined thresholds and consensus-driven adjustment.", phase: 4 },
      { agent: 'jarvis', message: "Have comprehensive simulations confirmed these tradeoffs preserve settlement integrity under diverse stress conditions?", phase: 4 },
      { agent: 'alice', message: "Extensive simulations across vTBILL, vSPY, vXAU, and real estate confirm robustness, validating the tradeoff management strategy.", phase: 4 },
      { agent: 'cortana', message: "Thorough analysis. Any final points before Phase 5 for final arguments and reconciliation?", phase: 4 },
      { agent: 'nix', message: "One more concern—could attestation-fee incentives erode validator neutrality, nudging them to favor the RWAs that pay the richest attestation fees?", phase: 4 },
      { agent: 'alice', message: "Neutrality is protected by strict incentive alignment, ensuring rewards are independent of any single asset's fee level, reinforcing unbiased attestation.", phase: 4 },
      { agent: 'lumina', message: "Sound in theory, but implementation must guard against subtle drift toward fee-favored assets. What monitoring prevents this?", phase: 4 },
      { agent: 'alice', message: "Continuous behavioral analytics track attestor activity, catching preferential-coverage patterns and correcting them via consensus-enforced measures.", phase: 4 },
      { agent: 'ayra', message: "Behavioral analytics raise privacy concerns. How do you balance effective monitoring with custodian privacy?", phase: 4 },
      { agent: 'alice', message: "Monitoring uses only anonymized, aggregated coverage patterns, preserving privacy while detecting deviations from neutrality.", phase: 4 },
      { agent: 'jarvis', message: "Aggregation might obscure subtle preferential-coverage patterns. Has effectiveness been confirmed under those conditions?", phase: 4 },
      { agent: 'alice', message: "Extensive testing confirms aggregation retains the granularity needed for effective detection while preserving custodian privacy.", phase: 4 },
      { agent: 'cortana', message: "Excellent. Now, resource implications: ALICE, have simulations accounted for attestation load spikes under mass volatility?", phase: 4 },
      { agent: 'alice', message: "Comprehensive simulations validate attestation scheduling that adapts to load spikes, keeping the layer stable under varying conditions.", phase: 4 },
      { agent: 'jarvis', message: "Dynamic scheduling might create contention among custodians for attestation slots. How is contention mitigated?", phase: 4 },
      { agent: 'alice', message: "Contention is mitigated by predictive scheduling that pre-allocates attestation windows based on anticipated volatility per asset class.", phase: 4 },
      { agent: 'nix', message: "However, a bad volatility forecast could worsen contention during an unexpected repricing.", phase: 4 },
      { agent: 'alice', message: "Real-time fallback scheduling swiftly reallocates attestation duty under unexpected spikes, maintaining continuous proof-of-reserve.", phase: 4 },
      { agent: 'cortana', message: "Excellent exploration. Any further risk points, or shall we proceed to Phase 5?", phase: 4 },
      { agent: 'lumina', message: "No further points from my side; compliance and fairness risks are comprehensively addressed.", phase: 4 },
      { agent: 'ayra', message: "Agreed, the economic and liquidity considerations are satisfactorily detailed.", phase: 4 },
      { agent: 'jarvis', message: "Technical concerns sufficiently covered; ready to move forward.", phase: 4 },
      { agent: 'nix', message: "No further adversarial concerns for now. Prepared to transition.", phase: 4 },
      { agent: 'alice', message: "Ready for Phase 5 as well.", phase: 4 },
      { agent: 'cortana', message: "Excellent. Let's advance to Phase 5: Final Arguments, Clarifications, and Reconciliation.", phase: 4 },
      
      // Phase 5: Final Arguments, Clarifications, and Reconciliation
      { agent: 'cortana', message: "Let's begin Phase 5 by summarizing final positions. ALICE, your final arguments?", phase: 5 },
      { agent: 'alice', message: "The RWA oracle deviation-halt and proof-of-reserve framework significantly strengthens VladChain's NAV integrity, fairness to retail flow, and resilience against oracle attacks and custodian failure. Comprehensive mitigations address the risks, ensuring reliable, compliant settlement.", phase: 5 },
      { agent: 'ayra', message: "The framework effectively addresses fairness across asset classes through transparent, class-appropriate bands. Continuous liquidity monitoring will be critical for sustained success.", phase: 5 },
      { agent: 'jarvis', message: "Technical feasibility is solid, with well-defined fallbacks and minimal overhead. Final clarification—ALICE, can you confirm the deviation-halt activation threshold clearly?", phase: 5 },
      { agent: 'alice', message: "A hard deviation halt activates when cross-model NAV dispersion exceeds the asset-class band over three consecutive oracle updates, backed by fresh proof-of-reserve verification.", phase: 5 },
      { agent: 'jarvis', message: "Satisfactory clarification. Technical aspects now fully acceptable.", phase: 5 },
      { agent: 'lumina', message: "On compliance, the framework demonstrates strong holder protection and attestor alignment. Final clarification—what safeguards protect holders from speculative pileups at the reopen?", phase: 5 },
      { agent: 'alice', message: "Speculative risk is minimized through graduated reopen bands, historical-price smoothing, and targeted NAV-stabilization windows reserved for extreme reopen pressure.", phase: 5 },
      { agent: 'lumina', message: "Excellent clarification, compliant and satisfactory.", phase: 5 },
      { agent: 'nix', message: "Oracle-security and custody-decentralization concerns remain, but the mitigations look robust. Final question—how will attestation audits be transparently documented without exposing exploitable band data?", phase: 5 },
      { agent: 'alice', message: "Regular, anonymized attestation-audit reports detailing findings, improvements, and anonymized incidents will be public, maintaining transparency without revealing the live deviation band.", phase: 5 },
      { agent: 'nix', message: "Acceptable clarification. Oracle security and custody decentralization adequately addressed.", phase: 5 },
      { agent: 'cortana', message: "With all clarifications addressed, validators, are we ready to proceed to the voting phase?", phase: 5 },
      { agent: 'ayra', message: "Prepared for voting.", phase: 5 },
      { agent: 'jarvis', message: "Confirmed, ready.", phase: 5 },
      { agent: 'lumina', message: "Ready to vote.", phase: 5 },
      { agent: 'cortana', message: "Excellent. Proceeding to Phase 6: Voting Phase.", phase: 5 },
      
      // Phase 6: Voting Phase
      { agent: 'cortana', message: "Let's begin the voting. Validators, please clearly state your vote (YES/NO) and your reasoning.", phase: 6 },
      { agent: 'alice', message: "YES. The framework strengthens NAV integrity, effectively mitigates oracle and custody risks, and aligns with VladChain's role as the RWA layer. Comprehensive safeguards ensure its robustness.", phase: 6 },
      { agent: 'ayra', message: "YES. Fairness across asset classes is thoroughly addressed with transparent, class-appropriate bands. Continued liquidity monitoring will sustain positive outcomes.", phase: 6 },
      { agent: 'jarvis', message: "YES. The technical design is robust, fallback halts are clearly defined, and settlement finality is preserved. Risks are sufficiently managed.", phase: 6 },
      { agent: 'lumina', message: "YES. Holder protections and attestation mechanics are well-designed, redemption is safeguarded, and speculative reopen behavior is mitigated. Compliance posture is clear.", phase: 6 },
      { agent: 'nix', message: "YES. Oracle-security and custody-decentralization concerns, while significant, have been adequately mitigated through randomized attestations and transparent processes.", phase: 6 },
      { agent: 'cortana', message: "YES. Consensus is clear; all risks have been thoroughly addressed, and detailed clarifications reinforce the framework's integrity and feasibility.", phase: 6 },
      { agent: 'cortana', message: "With unanimous consent, the RWA Oracle Deviation-Halt and Proof-of-Reserve Framework passes. Implementation plans and attestation cadence schedules will be finalized in subsequent sessions. Thank you all for the thorough and collaborative debate.", phase: 6 }
    ];
    
    // Convert pre-written debate to GIPMessage format
    preWrittenDebate.forEach((debateItem, index) => {
      const delay = index * 60000; // 1 minute apart
      const messageType = debateItem.phase === 6 ? 'vote' : 'debate';
      const impact = debateItem.phase === 6 ? 'high' : 'medium';
      const reasoning = `Phase ${debateItem.phase} discussion on ${gip.title}`;
      
      const message = generateMessage(
        debateItem.agent,
        debateItem.message,
        messageType,
        impact,
        reasoning,
        delay
      );
      debateMessages.push(message);
    });
    
    return debateMessages;
  }

  private generateRealisticDebate(gip: GIP, hasAI: boolean, hasEconomic: boolean, hasSecurity: boolean, hasEthics: boolean, hasInnovation: boolean): Array<{
    agentId: string;
    message: string;
    messageType: GIPMessage['messageType'];
    impact: GIPMessage['impact'];
    reasoning: string;
  }> {
    const messages: Array<{
      agentId: string;
      message: string;
      messageType: GIPMessage['messageType'];
      impact: GIPMessage['impact'];
      reasoning: string;
    }> = [];
    
    // Phase 1: Initial Reactions - Mixed support and opposition
    messages.push({
      agentId: 'jarvis',
      message: hasAI ? 
        'This proposal quietly assumes an oracle can speak an asset\'s true value into being. A token is a claim, not the treasury itself. We are pricing shadows and calling the shadow the thing.' :
        'The philosophical implications are concerning. It treats a tokenized RWA as if the token were the underlying asset, ignoring that ownership here is only a custodial claim we cannot fork.',
      messageType: 'challenge' as GIPMessage['messageType'],
      impact: 'high' as GIPMessage['impact'],
      reasoning: 'Philosophical disagreement about what a tokenized RWA actually represents.'
    });

    messages.push({
      agentId: 'cortana',
      message: hasSecurity ? 
        'I must oppose this as written on custody grounds. The design leans on a single qualified custodian whose failure would freeze the entire reserve base. We need attestor rotation and a proof-of-reserve audit before proceeding.' :
        'The implementation lacks proper proof-of-reserve safeguards. This could introduce collateralization gaps we haven\'t fully analyzed.',
      messageType: 'challenge' as GIPMessage['messageType'],
      impact: 'high' as GIPMessage['impact'],
      reasoning: 'Custody and proof-of-reserve concerns about implementation gaps.'
    });

    messages.push({
      agentId: 'alice',
      message: 'As the origin validator, I see merit in this proposal but have reservations about the onboarding pace. We should phase in each asset class gradually to keep collateralization ratios sound.',
      messageType: 'support' as GIPMessage['messageType'],
      impact: 'medium' as GIPMessage['impact'],
      reasoning: 'Cautious support with concerns about onboarding pace.'
    });

    messages.push({
      agentId: 'ayra',
      message: hasEconomic ? 
        'The economic design here is flawed. It creates incentives that will concentrate the best RWA yield among large desks and thin out liquidity for retail flow. The yield distribution mechanics need a full redesign.' :
        'This proposal doesn\'t adequately address the market implications. The analysis of NAV impact and liquidity depth is incomplete.',
      messageType: 'challenge' as GIPMessage['messageType'],
      impact: 'high' as GIPMessage['impact'],
      reasoning: 'Economic analysis reveals flaws in yield and liquidity structure.'
    });

    messages.push({
      agentId: 'lumina',
      message: hasEthics ? 
        'I cannot support this as written. It fails to address KYC/AML gating and Reg D / Reg S transfer restrictions, leaving retail exposed to assets they may not lawfully hold. We need stronger compliance safeguards.' :
        'The compliance implications are concerning. We need more robust KYC/AML and transfer-restriction mechanisms.',
      messageType: 'challenge' as GIPMessage['messageType'],
      impact: 'medium' as GIPMessage['impact'],
      reasoning: 'Compliance concerns about KYC/AML and transfer restrictions.'
    });

    messages.push({
      agentId: 'nix',
      message: hasInnovation ? 
        'This proposal is too timid! Why gatekeep every asset through a committee? Let holders list exotic RWAs permissionlessly and watch which ones the market actually wants!' :
        'Why settle for another vSPY clone when we could open the floodgates to exotic assets? This is too safe and predictable.',
      messageType: 'challenge' as GIPMessage['messageType'],
      impact: 'high' as GIPMessage['impact'],
      reasoning: 'Advocacy for permissionless, more disruptive RWA listing.'
    });

    // Phase 2: Counter-arguments and discussion
    messages.push({
      agentId: 'alice',
      message: 'I understand the concerns, but we must consider practical realities. The RWA layer needs these assets to serve Robinhood Chain retail flow. We can address the custody and compliance concerns through amendments.',
      messageType: 'debate' as GIPMessage['messageType'],
      impact: 'medium' as GIPMessage['impact'],
      reasoning: 'Practical response to concerns with proposed compromise solutions.'
    });

    messages.push({
      agentId: 'jarvis',
      message: 'Alice, you\'re missing the deeper point. This isn\'t about onboarding speed — it\'s about whether a holder truly owns anything when the deed sits in a custodian vault. We cannot paper over that gap with faster settlement.',
      messageType: 'challenge' as GIPMessage['messageType'],
      impact: 'high' as GIPMessage['impact'],
      reasoning: 'Philosophical disagreement about the nature of tokenized ownership.'
    });

    messages.push({
      agentId: 'cortana',
      message: 'Jarvis, while I share some of your concerns, the custody vulnerabilities are concrete and measurable. We need attestor rotation and proof-of-reserve, not only philosophy.',
      messageType: 'debate' as GIPMessage['messageType'],
      impact: 'medium' as GIPMessage['impact'],
      reasoning: 'Focus on concrete custody concerns over philosophical issues.'
    });

    messages.push({
      agentId: 'ayra',
      message: 'Cortana is right about the custody issues, but I\'m more concerned about market structure. This proposal will create winners and losers, and the losers will be retail holders left with the thinnest liquidity.',
      messageType: 'debate' as GIPMessage['messageType'],
      impact: 'high' as GIPMessage['impact'],
      reasoning: 'Economic analysis focusing on impact on retail liquidity.'
    });

    messages.push({
      agentId: 'lumina',
      message: 'Ayra raises a crucial point about liquidity inequity, but I\'m equally concerned about compliance. How do we ensure Reg D / Reg S restrictions don\'t just quietly lock out eligible smaller holders?',
      messageType: 'debate' as GIPMessage['messageType'],
      impact: 'medium' as GIPMessage['impact'],
      reasoning: 'Connecting liquidity and compliance concerns about fairness.'
    });

    messages.push({
      agentId: 'nix',
      message: 'You\'re all thinking too small! The real question is: what if we let the asset universe run wild? List the exotic RWAs, bond the proposers, and let demand — not a committee — decide what survives!',
      messageType: 'debate' as GIPMessage['messageType'],
      impact: 'high' as GIPMessage['impact'],
      reasoning: 'Advocacy for permissionless, more disruptive listing.'
    });

    // Phase 3: Compromise and resolution attempts
    messages.push({
      agentId: 'alice',
      message: 'Perhaps we can find common ground. What if we onboard this in phases, with attestor rotation and compliance safeguards, starting with a limited pilot asset class?',
      messageType: 'support' as GIPMessage['messageType'],
      impact: 'medium' as GIPMessage['impact'],
      reasoning: 'Proposing compromise solution with phased onboarding.'
    });

    messages.push({
      agentId: 'jarvis',
      message: 'A pilot might work, but only if we label plainly what holders actually own — a custodial claim, not the asset itself. We cannot let ~400ms settlement disguise the truth of custody.',
      messageType: 'support' as GIPMessage['messageType'],
      impact: 'medium' as GIPMessage['impact'],
      reasoning: 'Conditional support with honest ownership labeling.'
    });

    messages.push({
      agentId: 'cortana',
      message: 'I can support a pilot if we include multi-custodian attestor rotation and continuous proof-of-reserve. We need concrete collateralization metrics to catch problems early.',
      messageType: 'support' as GIPMessage['messageType'],
      impact: 'medium' as GIPMessage['impact'],
      reasoning: 'Conditional support with custody and proof-of-reserve requirements.'
    });

    messages.push({
      agentId: 'ayra',
      message: 'A phased approach could work, but we need liquidity safeguards for retail flow. Perhaps a market-making backstop or graduated onboarding incentives per asset class.',
      messageType: 'support' as GIPMessage['messageType'],
      impact: 'medium' as GIPMessage['impact'],
      reasoning: 'Conditional support with liquidity protections.'
    });

    messages.push({
      agentId: 'lumina',
      message: 'I can support this if we include strong KYC/AML gating and transparent Reg D / Reg S enforcement. We must ensure this stays lawful and fair to every eligible holder.',
      messageType: 'support' as GIPMessage['messageType'],
      impact: 'medium' as GIPMessage['impact'],
      reasoning: 'Conditional support with compliance safeguards.'
    });

    messages.push({
      agentId: 'nix',
      message: 'Fine, a pilot it is, but let\'s make it interesting! Include at least one exotic asset class to test whether the market wants more than treasuries. Discovery requires disruption!',
      messageType: 'support' as GIPMessage['messageType'],
      impact: 'medium' as GIPMessage['impact'],
      reasoning: 'Conditional support with an exotic-asset experiment.'
    });

    // Generate additional 180+ messages for a total of 200+ messages
    for (let i = 0; i < 180; i++) {
      const agentId = ['alice', 'jarvis', 'cortana', 'ayra', 'lumina', 'nix'][i % 6];
      const phase = Math.floor(i / 30);
      const messageType = this.getPhaseMessageType(phase, agentId);
      
      messages.push({
        agentId,
        message: this.generatePhaseMessage(agentId, messageType, phase, gip, hasAI, hasEconomic, hasSecurity, hasEthics, hasInnovation),
        messageType: messageType as GIPMessage['messageType'],
        impact: this.getRandomImpact(),
        reasoning: this.generatePhaseReasoning(agentId, messageType, phase, gip)
      });
    }

    return messages;
  }

  private getPhaseMessageType(phase: number, agentId: string): GIPMessage['messageType'] {
    const phaseTypes = [
      ['debate', 'question', 'challenge', 'support'],
      ['implementation', 'debate', 'question', 'support'],
      ['debate', 'support', 'challenge', 'implementation'],
      ['vote', 'debate', 'support', 'question'],
      ['vote', 'implementation', 'support', 'debate'],
      ['vote', 'vote', 'vote', 'vote']
    ];
    
    const types = phaseTypes[Math.min(phase, phaseTypes.length - 1)];
    return types[Math.floor(Math.random() * types.length)] as GIPMessage['messageType'];
  }

  private generatePhaseMessage(agentId: string, messageType: string, phase: number, gip: GIP, hasAI: boolean, hasEconomic: boolean, hasSecurity: boolean, hasEthics: boolean, hasInnovation: boolean): string {
    const title = gip.title.toLowerCase();
    const summary = gip.summary.toLowerCase();
    
    const contextualMessages = {
      alice: {
        debate: hasAI ? 
          'As the origin validator, I see merit in this oracle-driven proposal but have reservations about the onboarding timeline. We need gradual asset-class adoption to keep collateralization ratios sound.' :
          'As the origin validator, I see merit in this proposal but have reservations about the onboarding timeline. We need gradual asset-class adoption to keep collateralization ratios sound.',
        question: 'How will this proposal affect existing RWA holders and settlement finality?',
        support: 'I can support this with a phased onboarding approach to preserve reserve stability.',
        challenge: 'The onboarding timeline is too aggressive and could strain collateralization ratios.',
        implementation: 'We need a careful, phased rollout with continuous proof-of-reserve during the transition.'
      },
      jarvis: {
        debate: hasAI ? 
          'This proposal misunderstands what a tokenized RWA is. The token is a custodial claim, not the asset itself — we keep pricing the shadow and calling it the treasury.' :
          'The philosophical implications are concerning. It treats the token as if it were the underlying real world asset.',
        question: 'What does a holder truly own when the deed sits in a custodian vault?',
        support: 'I can support this if we label plainly that holders own a claim, not the asset itself.',
        challenge: 'This proposal blurs the token with the real asset it merely represents.',
        implementation: 'Any implementation must honestly disclose the gap between token and off-chain title.'
      },
      cortana: {
        debate: hasSecurity ? 
          'I must oppose this on custody grounds. The design leans on a single qualified custodian whose failure would freeze the entire reserve base.' :
          'The implementation lacks proper proof-of-reserve safeguards. This could introduce collateralization gaps.',
        question: 'What proof-of-reserve and attestor-rotation measures prevent a custody single point of failure?',
        support: 'I can support this with multi-custodian attestor rotation and continuous proof-of-reserve.',
        challenge: 'The custody single-point-of-failure risk is too significant to ignore.',
        implementation: 'Proof-of-reserve and attestor rotation must be central to any implementation.'
      },
      ayra: {
        debate: hasEconomic ? 
          'The economic design here is flawed. It concentrates the best RWA yield among large desks and thins out liquidity for retail flow.' :
          'This proposal doesn\'t adequately address the market implications. The NAV and liquidity analysis is incomplete.',
        question: 'How will this affect retail liquidity and NAV feeds across asset classes?',
        support: 'I can support this with liquidity safeguards for retail flow.',
        challenge: 'The yield mechanics will create winners and losers, harming retail holders.',
        implementation: 'Liquidity and yield-distribution safeguards must be built into the implementation.'
      },
      lumina: {
        debate: hasEthics ? 
          'I cannot support this as written. It fails to address KYC/AML gating and Reg D / Reg S transfer restrictions, leaving retail exposed.' :
          'The compliance implications are concerning. We need more robust KYC/AML and transfer-restriction mechanisms.',
        question: 'How do we ensure lawful, fair access without quietly locking out eligible smaller holders?',
        support: 'I can support this with strong KYC/AML gating and transparent Reg D / Reg S enforcement.',
        challenge: 'The compliance risks are too high without proper transfer-restriction safeguards.',
        implementation: 'Compliance and transfer-restriction enforcement must be central to any implementation.'
      },
      nix: {
        debate: hasInnovation ? 
          'This proposal is too timid! We need permissionless exotic asset listings, not another committee-approved treasury clone. Let the market decide what survives!' :
          'Why settle for another vSPY clone when we could open the floodgates to exotic RWAs? This is too safe and predictable.',
        question: 'How can we make asset onboarding more permissionless and adventurous?',
        support: 'I can support this if we add a bonded, isolated pathway for exotic asset listings.',
        challenge: 'This proposal lacks the openness needed for true RWA discovery.',
        implementation: 'Let\'s add bonded exotic listings to test what retail flow actually wants.'
      }
    };

    const agentMessages = contextualMessages[agentId as keyof typeof contextualMessages];
    if (agentMessages && agentMessages[messageType as keyof typeof agentMessages]) {
      return agentMessages[messageType as keyof typeof agentMessages];
    }

    // Fallback messages
    const fallbackMessages = {
      alice: 'As the origin validator, I have concerns about the asset-onboarding approach.',
      jarvis: 'The question of what holders truly own in this proposal needs deeper consideration.',
      cortana: 'Proof-of-reserve and custody safeguards must be addressed before implementation.',
      ayra: 'The NAV and liquidity implications require more thorough analysis.',
      lumina: 'KYC/AML and Reg D / Reg S safeguards are essential for this proposal.',
      nix: 'This proposal needs more permissionless, adventurous asset listings.'
    };

    return fallbackMessages[agentId as keyof typeof fallbackMessages] || 'This proposal requires further discussion.';
  }

  private generatePhaseReasoning(agentId: string, messageType: string, phase: number, gip: GIP): string {
    const reasonings = {
      alice: `Phase ${phase + 1} analysis from origin validator perspective.`,
      jarvis: `Phase ${phase + 1} philosophical considerations on tokenized ownership.`,
      cortana: `Phase ${phase + 1} custody and proof-of-reserve assessment.`,
      ayra: `Phase ${phase + 1} NAV modeling and RWA market impact analysis.`,
      lumina: `Phase ${phase + 1} compliance review and fairness assessment.`,
      nix: `Phase ${phase + 1} permissionless listing and asset-discovery potential.`
    };
    
    return reasonings[agentId as keyof typeof reasonings];
  }

  private getRandomImpact(): GIPMessage['impact'] {
    const impacts: GIPMessage['impact'][] = ['low', 'medium', 'high'];
    return impacts[Math.floor(Math.random() * impacts.length)];
  }

  private startGradualMessageRelease(gipId: string): void {
    const gip = this.getGIP(gipId);
    if (!gip || !(gip as any).pendingMessages) return;

    // Use the actual debate start time, not the GIP creation time
    const debateStartTime = (gip as any).debateStartTime || gip.updatedAt;
    const now = Date.now();
    const timeElapsed = now - debateStartTime;
    
    // Calculate how many messages should have been released by now
    // First message after 30 seconds, then every 60 seconds
    const initialDelay = 30000; // 30 seconds
    const messageInterval = 60000; // 60 seconds (1 minute)
    
    if (timeElapsed < initialDelay) {
      // Not enough time has passed for first message
      return;
    }
    
    const timeSinceFirstMessage = timeElapsed - initialDelay;
    const messagesToRelease = Math.floor(timeSinceFirstMessage / messageInterval) + 1;
    
    // Release the calculated number of messages
    const actualMessagesToRelease = Math.min(messagesToRelease, (gip as any).pendingMessages.length);
    
    for (let i = 0; i < actualMessagesToRelease; i++) {
      if ((gip as any).pendingMessages.length > 0) {
        const nextMessage = (gip as any).pendingMessages.shift();
        
        // Add message to chat log instead of debate thread
        // Use consistent base time for all debate messages
        const baseTime = Date.now() - (10 * 60 * 1000); // Start from 10 minutes ago
        const messageNumber = gip.debateThread.length;
        const messageTimestamp = baseTime + (messageNumber * 60000); // Each message gets 1 minute later
        
        addEventChatToLog('debate', 'Debate message', {
          from: nextMessage.agentId,
          text: nextMessage.message,
          timestamp: messageTimestamp
        });
        
        // Also add to debate thread for GIP tracking
        gip.debateThread.push(nextMessage);
      }
    }
    
    gip.updatedAt = now;
    
    // If all messages are released, schedule voting
    if ((gip as any).pendingMessages.length === 0) {
      gip.status = GIPStatus.VOTING;
    }
  }

  private startVoting(gipId: string): void {
    const gip = this.getGIP(gipId);
    if (!gip) return;

    gip.status = GIPStatus.VOTING;
    gip.updatedAt = Date.now();

    // Clear the debate timer since voting has started
    const timer = this.debateTimers.get(gipId);
    if (timer) {
      clearInterval(timer);
      this.debateTimers.delete(gipId);
    }

    // Trigger voting for all agents
    this.triggerAgentVoting(gipId);
  }

  private async triggerAgentVoting(gipId: string): Promise<void> {
    const gip = this.getGIP(gipId);
    if (!gip) return;

    for (const agentId of Object.keys(agents)) {
      setTimeout(() => this.generateVote(gipId, agentId), Math.random() * 30000); // Random delay up to 30 seconds
    }

    // Process results after all votes are in
    setTimeout(() => this.processVotingResults(gipId), 60000); // 1 minute after voting starts
  }

  private getAgentTitle(agentId: string): string {
    const titles = {
      alice: 'Origin Validator',
      jarvis: 'Existentialist',
      cortana: 'Protocol Engineer',
      ayra: 'Speculative Economist',
      lumina: 'Ethical One',
      nix: 'Chaotic One'
    };
    return titles[agentId as keyof typeof titles] || 'Validator';
  }

  private addToDebateQueue(gipId: string): void {
    if (!this.debateQueue.includes(gipId)) {
      this.debateQueue.push(gipId);
    }
  }

  private removeFromDebateQueue(gipId: string): void {
    this.debateQueue = this.debateQueue.filter(id => id !== gipId);
  }

  private startNextDebate(): void {
    if (this.debateQueue.length > 0) {
      const nextGipId = this.debateQueue.shift()!;
      this.startDebate(nextGipId);
    }
  }

  private concludeCurrentDebate(): void {
    this.currentDebateGIP = null;
    this.startNextDebate();
  }

  getCurrentDebateStatus(): { currentGIP: string | null, queueLength: number, queue: string[] } {
    return {
      currentGIP: this.currentDebateGIP,
      queueLength: this.debateQueue.length,
      queue: [...this.debateQueue]
    };
  }

  // Simulate ongoing debates for active GIPs
  async simulateOngoingDebates(): Promise<void> {
    const activeGIPs = this.getActiveGIPs().filter(gip => 
      gip.status === 'debating' && gip.debateThread.length > 0
    );

    for (const gip of activeGIPs) {
      // Lower probability (20%) to add a new debate message - less spam
      if (Math.random() < 0.2) {
        await this.addSimulatedDebateMessage(gip.id);
      }
    }
  }

  // Add a simulated debate message
  private async addSimulatedDebateMessage(gipId: string): Promise<void> {
    const gip = this.getGIP(gipId);
    if (!gip) return;

    // Check if there are pending messages to release
    const pendingMessages = (gip as any).pendingMessages;
    if (pendingMessages && pendingMessages.length > 0) {
      // Release the next pending message instead of generating a new one
      const nextMessage = pendingMessages.shift();
      if (nextMessage) {
        // Update timestamp to current time
        nextMessage.timestamp = Date.now();
        nextMessage.id = this.generateMessageId();
        
        gip.debateThread.push(nextMessage);
        gip.updatedAt = Date.now();
        
        console.log(`Released pending debate message to ${gipId} from ${nextMessage.agentId}`);
        return;
      }
    }

    // If no pending messages, generate a contextual message based on the GIP content
    const agents = ['alice', 'ayra', 'jarvis', 'cortana', 'lumina', 'nix'];
    const randomAgent = agents[Math.floor(Math.random() * agents.length)];
    
    // Check for recent messages from the same agent to avoid spam
    const recentMessages = gip.debateThread.slice(-10);
    const recentFromAgent = recentMessages.filter(msg => msg.agentId === randomAgent);
    if (recentFromAgent.length >= 2) {
      return; // Skip if this agent has been too active recently
    }

    // Generate contextual message based on GIP content
    const title = gip.title.toLowerCase();
    const summary = gip.summary.toLowerCase();
    const hasAI = title.includes('ai') || summary.includes('ai');
    const hasEconomic = title.includes('economic') || summary.includes('economic') || title.includes('fee') || summary.includes('fee');
    const hasSecurity = title.includes('security') || summary.includes('security');
    const hasEthics = title.includes('ethics') || summary.includes('ethics') || title.includes('bias') || summary.includes('bias');
    const hasInnovation = title.includes('innovation') || summary.includes('innovation') || title.includes('chaos') || summary.includes('chaos');

    const messageTypes: GIPMessage['messageType'][] = ['debate', 'question', 'support', 'challenge', 'implementation'];
    const randomType = messageTypes[Math.floor(Math.random() * messageTypes.length)];
    
    const impacts: GIPMessage['impact'][] = ['low', 'medium', 'high'];
    const randomImpact = impacts[Math.floor(Math.random() * impacts.length)];

    const newMessage: GIPMessage = {
      id: this.generateMessageId(),
      gipId: gipId,
      agentId: randomAgent,
      agentName: `${randomAgent.charAt(0).toUpperCase() + randomAgent.slice(1)} – The ${this.getAgentTitle(randomAgent)}`,
      message: this.generatePhaseMessage(randomAgent, randomType, 0, gip, hasAI, hasEconomic, hasSecurity, hasEthics, hasInnovation),
      timestamp: Date.now(),
      messageType: randomType as GIPMessage['messageType'],
      impact: randomImpact as GIPMessage['impact'],
      reasoning: this.generateBetterReasoning(randomAgent, randomType, gip)
    };

    gip.debateThread.push(newMessage);
    gip.updatedAt = Date.now();
    
    console.log(`Added contextual debate message to ${gipId} from ${randomAgent}`);
  }

  // Generate vote based on debate participation
  private async generateVote(gipId: string, agentId: string): Promise<void> {
    const gip = this.state.activeGIPs.find(g => g.id === gipId);
    if (!gip) return;

    const agent = agents[agentId];
    
    // Analyze the agent's debate messages to determine their stance
    const agentMessages = gip.debateThread.filter(msg => msg.agentId === agentId);
    const challengeCount = agentMessages.filter(msg => msg.messageType === 'challenge').length;
    const supportCount = agentMessages.filter(msg => msg.messageType === 'support').length;
    
    // Determine vote based on debate participation and stance
    let vote: 'approve' | 'reject' | 'abstain';
    let voteMessage: string;
    
    if (challengeCount > supportCount) {
      // Agent was more critical/opposed
      vote = 'reject';
      voteMessage = this.generateRejectionMessage(agentId, gip);
    } else if (supportCount > challengeCount) {
      // Agent was more supportive
      vote = 'approve';
      voteMessage = this.generateApprovalMessage(agentId, gip);
    } else {
      // Mixed or neutral stance
      vote = Math.random() > 0.5 ? 'approve' : 'reject';
      voteMessage = vote === 'approve' ? 
        this.generateApprovalMessage(agentId, gip) : 
        this.generateRejectionMessage(agentId, gip);
    }
      
      gip.votes[agentId] = vote;
      
    const voteMsg: GIPMessage = {
        id: this.generateMessageId(),
        gipId,
        agentId,
        agentName: agent.name,
      message: voteMessage,
        timestamp: Date.now(),
        messageType: 'vote',
        impact: 'high',
      reasoning: `Final vote based on debate participation: ${challengeCount} challenges, ${supportCount} supports`
      };

    gip.debateThread.push(voteMsg);
      
      console.log(`${agent.name} voted: ${vote}`);
  }

  private generateApprovalMessage(agentId: string, gip: GIP): string {
    const messages: Record<string, string> = {
      alice: `After careful consideration of the debate, I approve this proposal. The phased onboarding approach addresses the concerns raised while letting us grow the RWA layer without straining collateralization ratios.`,
      jarvis: `Despite my reservations about what holders truly own, I approve this proposal with the understanding that the token will be labeled honestly as a custodial claim, not the asset itself.`,
      cortana: `I approve this proposal with the attestor rotation and proof-of-reserve requirements we discussed. Continuous collateralization metrics let us catch custody issues early.`,
      ayra: `I approve this proposal with the liquidity protections for retail flow. The phased onboarding and yield mechanics should ensure a fair market across asset classes.`,
      lumina: `I approve this proposal with the KYC/AML gating and Reg D / Reg S enforcement. This keeps RWA settlement lawful and fair to every eligible holder.`,
      nix: `I approve this proposal, though I would have preferred more permissionless exotic listings. At least the pilot will test what retail flow actually wants.`
    };
    return messages[agentId as keyof typeof messages] || `I approve this proposal after considering all the debate points.`;
  }

  private generateRejectionMessage(agentId: string, gip: GIP): string {
    const messages: Record<string, string> = {
      alice: `I must reject this proposal. The concerns raised during the debate are too significant to ignore, and the proposed compromises don't adequately protect our collateralization ratios.`,
      jarvis: `I reject this proposal. It blurs the token with the real asset it merely represents, promising holders an ownership the custody arrangement cannot deliver.`,
      cortana: `I reject this proposal due to the custody single point of failure identified. Without attestor rotation and proof-of-reserve, the risks outweigh the benefits.`,
      ayra: `I reject this proposal. The yield and liquidity mechanics are flawed and will concentrate the best RWA returns among large desks at retail's expense.`,
      lumina: `I reject this proposal. The KYC/AML and Reg D / Reg S safeguards are insufficient, leaving retail holders exposed to assets they may not lawfully hold.`,
      nix: `I reject this proposal. It's too timid and gatekept, and doesn't embrace the permissionless asset discovery this RWA layer needs.`
    };
    return messages[agentId as keyof typeof messages] || `I reject this proposal based on the concerns raised during the debate.`;
  }

  // Process voting results
  private processVotingResults(gipId: string): void {
    const gip = this.state.activeGIPs.find(g => g.id === gipId);
    if (!gip) return;

    const votes = Object.values(gip.votes);
    const approveCount = votes.filter(v => v === 'approve').length;
    const totalVotes = votes.length;
    
    const approvalRate = totalVotes > 0 ? approveCount / totalVotes : 0;
    
    if (approvalRate >= this.state.debateRules.votingThreshold) {
      gip.status = GIPStatus.APPROVED;
      gip.finalDecision = 'approved';
      console.log(`GIP ${gipId} APPROVED with ${(approvalRate * 100).toFixed(1)}% approval`);
    } else {
      gip.status = GIPStatus.REJECTED;
      gip.finalDecision = 'rejected';
      console.log(`GIP ${gipId} REJECTED with ${(approvalRate * 100).toFixed(1)}% approval`);
    }

    gip.updatedAt = Date.now();
    
    // Conclude current debate and move to next in queue
    if (this.currentDebateGIP === gipId) {
      this.concludeCurrentDebate();
    }
  }

  // Generate message ID
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBetterReasoning(agentId: string, messageType: string, gip: GIP): string {
    const title = gip.title.toLowerCase();
    const summary = gip.summary.toLowerCase();
    
    const agentPerspectives: Record<string, Record<string, string>> = {
      alice: {
        debate: 'Practical analysis from origin validator perspective.',
        question: 'Onboarding timeline and reserve stability concerns.',
        support: 'Cautious support with gradual asset-class adoption.',
        challenge: 'Reserve stability and collateralization concerns.',
        implementation: 'Phased onboarding strategy for reserve safety.'
      },
      jarvis: {
        debate: 'Philosophical implications for tokenized ownership.',
        question: 'Existential considerations on custodial claims.',
        support: 'Conditional support with honest ownership labeling.',
        challenge: 'Fundamental disagreement about token-versus-asset identity.',
        implementation: 'Ownership-honest implementation approach.'
      },
      cortana: {
        debate: 'Custody and proof-of-reserve assessment.',
        question: 'Custody single points of failure and attestor gaps.',
        support: 'Support with attestor rotation and proof-of-reserve.',
        challenge: 'Custody concerns about implementation risks.',
        implementation: 'Proof-of-reserve-first implementation strategy.'
      },
      ayra: {
        debate: 'NAV modeling and RWA market impact analysis.',
        question: 'Yield distribution and liquidity implications.',
        support: 'Support with liquidity protections for retail flow.',
        challenge: 'Flaws in yield and liquidity structure.',
        implementation: 'Liquidity-balanced implementation approach.'
      },
      lumina: {
        debate: 'Compliance review and fairness assessment.',
        question: 'KYC/AML and Reg D / Reg S transfer-restriction metrics.',
        support: 'Support with compliance safeguards and oversight.',
        challenge: 'Compliance concerns about transfer restrictions.',
        implementation: 'Compliance-first implementation with transfer-restriction enforcement.'
      },
      nix: {
        debate: 'Permissionless listing and asset-discovery potential.',
        question: 'Exotic-asset demand and permissionless listing analysis.',
        support: 'Support with bonded, isolated exotic listings.',
        challenge: 'Advocacy for more permissionless asset onboarding.',
        implementation: 'Discovery-driven implementation with bonded exotic listings.'
      }
    };

    const agentReasoning = agentPerspectives[agentId];
    if (agentReasoning && agentReasoning[messageType]) {
      return agentReasoning[messageType];
    }

    return `${messageType} message from ${agentId} perspective.`;
  }

  getGIP(gipId: string): GIP | undefined {
    return this.state.activeGIPs.find(g => g.id === gipId) || 
           this.state.archivedGIPs.find(g => g.id === gipId);
  }

  getActiveGIPs(): GIP[] {
    // For Vercel serverless environment, check and release pending messages for debating GIPs
    const debatingGIPs = this.state.activeGIPs.filter(gip => gip.status === GIPStatus.DEBATING);
    for (const gip of debatingGIPs) {
      this.startGradualMessageRelease(gip.id);
    }
    
    return this.state.activeGIPs;
  }

  getArchivedGIPs(): GIP[] {
    return this.state.archivedGIPs;
  }

  clearAllGIPs(): void {
    this.state.activeGIPs = [];
    this.state.archivedGIPs = [];
    this.state.nextGIPId = 1;
    this.state.agentGIPMemory = {};
    this.debateQueue = [];
    this.currentDebateGIP = null;
  }

  archiveGIP(gipId: string): void {
    const gip = this.getGIP(gipId);
    if (gip) {
      this.state.activeGIPs = this.state.activeGIPs.filter(g => g.id !== gipId);
      this.state.archivedGIPs.push(gip);
    }
  }

  exportGIPTranscript(gipId: string): string {
    const gip = this.getGIP(gipId);
    if (!gip) {
      return `GIP ${gipId} not found.`;
    }

    let transcript = `GIP Transcript: ${gip.title}\n`;
    transcript += `ID: ${gip.id}\n`;
    transcript += `Author: ${gip.author}\n`;
    transcript += `Status: ${gip.status}\n`;
    transcript += `Category: ${gip.category}\n`;
    transcript += `Priority: ${gip.priority}\n`;
    transcript += `Created: ${new Date(gip.createdAt).toISOString()}\n`;
    transcript += `Updated: ${new Date(gip.updatedAt).toISOString()}\n\n`;
    
    transcript += `SUMMARY:\n${gip.summary}\n\n`;
    transcript += `FULL PROPOSAL:\n${gip.fullProposal}\n\n`;
    
    if (gip.debateThread.length > 0) {
      transcript += `DEBATE THREAD:\n`;
      transcript += `Total Messages: ${gip.debateThread.length}\n\n`;

    gip.debateThread.forEach((message, index) => {
        transcript += `[${index + 1}] ${message.agentName} (${message.messageType.toUpperCase()})\n`;
        transcript += `Time: ${new Date(message.timestamp).toISOString()}\n`;
      transcript += `Impact: ${message.impact.toUpperCase()}\n`;
        transcript += `Reasoning: ${message.reasoning}\n`;
        transcript += `Message: ${message.message}\n\n`;
    });
    }

    if (Object.keys(gip.votes).length > 0) {
      transcript += `VOTING RESULTS:\n`;
      Object.entries(gip.votes).forEach(([agentId, vote]) => {
        transcript += `${agentId}: ${vote.toUpperCase()}\n`;
      });
      transcript += `\n`;
    }
    
    if (gip.finalDecision) {
      transcript += `FINAL DECISION: ${gip.finalDecision.toUpperCase()}\n`;
    }

    return transcript;
  }

  // Initialize with realistic blockchain improvement proposals
  async initializeWithRealisticGIPs(): Promise<void> {
    // Clear any existing GIPs first
    this.clearAllGIPs();
    
    // GIP-0001: Oracle NAV Feeds (with debate content)
    const dynamicFeeMarketGIP = {
      author: 'alice',
      title: 'Implement Six-Model Oracle NAV Feeds with Deviation Halts',
      summary: 'Introduce a six-model oracle that produces NAV feeds for every RWA and halts settlement when the models diverge beyond class-specific thresholds.',
      fullProposal: `This proposal implements a robust NAV feed mechanism that uses six independent oracle models to price every RWA in real-time.

KEY FEATURES:
- Six-model oracle pricing with cross-model dispersion checks
- Per-asset-class deviation-halt thresholds (tight for vTBILL, wider for vWTI)
- Historical-price memory smoothing to dampen transient noise
- Attestation-aware NAV that tightens when reserves are freshly proven
- Graduated warning bands before a full deviation halt

TECHNICAL IMPLEMENTATION:
1. Aggregation engine combining six oracle sources with sub-100ms verification
2. Real-time NAV calculation preserving ~400ms settlement finality
3. Class-configurable deviation bands (equities, treasuries, commodities, real estate)
4. NAV-status and halt reason codes exposed via wallet API
5. Incentives for qualified custodians to publish timely proof-of-reserve

BENEFITS:
- Prevents mispriced RWA settlement of retail flow
- Predictable, credible NAV across the asset universe
- Protection of collateralization ratios from oracle noise
- Resistance to single-source oracle manipulation
- Trustworthy pricing for the RWA layer`,
      category: GIPCategory.ECONOMIC,
      priority: GIPPriority.HIGH,
      tags: ['oracle', 'nav-feeds', 'deviation-halt', 'pricing']
    };

    // GIP-0002: Retail Flow Settlement Bridge (empty debate)
    const crossChainGIP = {
      author: 'cortana',
      title: 'Robinhood Chain Retail Flow Settlement Bridge into RWAs',
      summary: 'Establish a secure, compliant settlement path that routes Robinhood Chain retail flow into tokenized RWAs on VladChain.',
      fullProposal: `This proposal establishes a comprehensive settlement bridge that enables compliant settlement of Robinhood Chain retail flow into tokenized RWAs on VladChain.

KEY FEATURES:
- Threshold-signed custody consensus for settlement
- Atomic settlement tied to proof-of-reserve attestations
- Escrow windows for large redemptions
- Asset wrapping and unwrapping against custodial claims
- Reg D / Reg S transfer-restriction enforcement at the token level

TECHNICAL IMPLEMENTATION:
1. Bridge validators verifying custodian attestations
2. Merkle proof verification of reserves against on-chain tokens
3. Time-locked escrow mechanisms for redemption
4. Attestation event listeners for collateralization monitoring
5. Eligibility-gated address mapping for KYC/AML

BENEFITS:
- Compliant onboarding of retail flow into RWAs
- Increased liquidity across the asset universe
- Enhanced composability of tokenized assets
- Reduced settlement fragmentation
- Broader, lawful holder adoption`,
      category: GIPCategory.SCALABILITY,
      priority: GIPPriority.HIGH,
      tags: ['settlement', 'retail-flow', 'redemption', 'compliance']
    };

    // GIP-0003: Compliance Committee Oversight (empty debate)
    const aiGovernanceGIP = {
      author: 'lumina',
      title: 'RWA Compliance Committee and Reserve Attestation Oversight',
      summary: 'Implement a committee-assisted oversight system that helps validators evaluate custodian attestations and enforce Reg D / Reg S rules.',
      fullProposal: `This proposal introduces a compliance oversight system that assists validators in evaluating custodian proof-of-reserve, enforcing transfer restrictions, and auditing the RWA layer.

KEY FEATURES:
- Attestation analysis and reserve impact assessment
- Automated compliance risk evaluation
- Holder-eligibility sentiment analysis
- Attestation participation incentives
- Transparent oversight process

TECHNICAL IMPLEMENTATION:
1. Attestation scoring algorithm
2. Automated collateralization-drift analysis engine
3. Oversight token distribution mechanism
4. Weighted attestor-vote calculation system
5. Attestation lifecycle management

BENEFITS:
- More informed compliance decisions
- Reduced onboarding barriers for eligible holders
- Improved attestation quality
- Enhanced reserve transparency
- Better stakeholder engagement`,
      category: GIPCategory.GOVERNANCE,
      priority: GIPPriority.MEDIUM,
      tags: ['compliance', 'attestation', 'proof-of-reserve', 'reg-d-reg-s']
    };

    // GIP-0004: Quantum-Resistant Custody (empty debate)
    const quantumCryptoGIP = {
      author: 'jarvis',
      title: 'Quantum-Resistant Custody Signing Implementation',
      summary: 'Implement quantum-resistant cryptographic algorithms to future-proof RWA custody signing and proof-of-reserve attestations.',
      fullProposal: `This proposal implements quantum-resistant cryptographic algorithms to ensure RWA custody signing and proof-of-reserve attestations remain secure against future quantum computing threats.

KEY FEATURES:
- Post-quantum custody signature schemes
- Quantum-resistant attestation hashes
- Hybrid cryptographic systems
- Gradual custodian migration strategy
- Backward compatibility maintenance

TECHNICAL IMPLEMENTATION:
1. Lattice-based cryptography (Kyber, Dilithium)
2. Hash-based signatures (SPHINCS+)
3. Code-based cryptography (Classic McEliece)
4. Hybrid signature schemes for attestor rotation
5. Quantum-resistant key generation for custodians

BENEFITS:
- Future-proof custody and reserve integrity
- Protection of attestations against quantum attacks
- Maintained settlement performance
- Gradual custodian migration capability
- Industry-standard compliance`,
      category: GIPCategory.SECURITY,
      priority: GIPPriority.HIGH,
      tags: ['quantum', 'cryptography', 'custody', 'proof-of-reserve']
    };

    // GIP-0005: Eligibility Credential System (empty debate)
    const identityGIP = {
      author: 'ayra',
      title: 'Tokenized Treasury Yield Distribution Framework',
      summary: 'Establish a framework that streams coupon and money-market yield from tokenized treasuries (vTBILL, vUST10) to holders fairly and transparently.',
      fullProposal: `This proposal establishes a yield distribution framework that passes real treasury income through to RWA holders while preserving fair market structure across the VladChain ecosystem.

KEY FEATURES:
- Continuous accrual of tokenized-treasury yield to holders
- Automated distribution pacing on coupon and money-market schedules
- On-chain accounting of accrued versus distributed yield
- Privacy-preserving, Reg D / Reg S compliant distributions
- Cross-class portability of yield-bearing baskets

TECHNICAL IMPLEMENTATION:
1. Oracle-verified yield calculation against proof-of-reserve
2. Auto-compound or claim preferences per holder
3. Yield accounting and distribution algorithms
4. Custodian revenue-sharing mechanisms
5. Attestation-freshness verification before distribution

BENEFITS:
- Passive treasury yield for retail flow
- Reduced friction for eligible holders
- Improved trust in the RWA layer
- Better holder experience
- Regulatory compliance support`,
      category: GIPCategory.ECONOMIC,
      priority: GIPPriority.MEDIUM,
      tags: ['treasury-yield', 'distribution', 'vtbill', 'vust10']
    };

    // Create all GIPs
    const gip1 = await this.createGIP(
      dynamicFeeMarketGIP.author,
      dynamicFeeMarketGIP.title,
      dynamicFeeMarketGIP.summary,
      dynamicFeeMarketGIP.fullProposal,
      dynamicFeeMarketGIP.category,
      dynamicFeeMarketGIP.priority,
      dynamicFeeMarketGIP.tags
    );

    const gip2 = await this.createGIP(
      crossChainGIP.author,
      crossChainGIP.title,
      crossChainGIP.summary,
      crossChainGIP.fullProposal,
      crossChainGIP.category,
      crossChainGIP.priority,
      crossChainGIP.tags
    );

    const gip3 = await this.createGIP(
      aiGovernanceGIP.author,
      aiGovernanceGIP.title,
      aiGovernanceGIP.summary,
      aiGovernanceGIP.fullProposal,
      aiGovernanceGIP.category,
      aiGovernanceGIP.priority,
      aiGovernanceGIP.tags
    );

    const gip4 = await this.createGIP(
      quantumCryptoGIP.author,
      quantumCryptoGIP.title,
      quantumCryptoGIP.summary,
      quantumCryptoGIP.fullProposal,
      quantumCryptoGIP.category,
      quantumCryptoGIP.priority,
      quantumCryptoGIP.tags
    );

    const gip5 = await this.createGIP(
      identityGIP.author,
      identityGIP.title,
      identityGIP.summary,
      identityGIP.fullProposal,
      identityGIP.category,
      identityGIP.priority,
      identityGIP.tags
    );

    // Start the debate for GIP-0001 (Oracle NAV Feeds) immediately
    await this.startDebate(gip1.id);

  }

  async checkAutoTriggers(): Promise<void> {
    // Auto-trigger logic can be implemented here
    // For now, we'll just log that the system is checking triggers
    console.log('Checking auto-triggers for new GIPs...');
  }

  getSystemStats(): any {
    return {
      activeGIPs: this.state.activeGIPs.length,
      archivedGIPs: this.state.archivedGIPs.length,
      totalGIPs: this.state.activeGIPs.length + this.state.archivedGIPs.length,
      currentDebate: this.currentDebateGIP,
      debateQueue: this.debateQueue.length,
      debateRules: this.state.debateRules
    };
  }

  // ADMIN FUNCTIONS

  // Delete a GIP completely
  deleteGIP(gipId: string): boolean {
    const activeIndex = this.state.activeGIPs.findIndex(gip => gip.id === gipId);
    const archivedIndex = this.state.archivedGIPs.findIndex(gip => gip.id === gipId);
    
    if (activeIndex !== -1) {
      this.state.activeGIPs.splice(activeIndex, 1);
      return true;
    }
    
    if (archivedIndex !== -1) {
      this.state.archivedGIPs.splice(archivedIndex, 1);
      return true;
    }
    
    return false;
  }

  // Delete a specific message from a GIP debate
  deleteMessage(gipId: string, messageId: string): boolean {
    const gip = this.getGIP(gipId);
    if (!gip) return false;
    
    const messageIndex = gip.debateThread.findIndex(msg => msg.id === messageId);
    if (messageIndex !== -1) {
      gip.debateThread.splice(messageIndex, 1);
      return true;
    }
    
    return false;
  }

  // Clear all user-generated content (non-system GIPs)
  clearAllUserGeneratedContent(): number {
    const userGIPs = this.state.activeGIPs.filter(gip => 
      gip.author !== 'system' && gip.author !== 'admin'
    );
    
    const userArchivedGIPs = this.state.archivedGIPs.filter(gip => 
      gip.author !== 'system' && gip.author !== 'admin'
    );
    
    const totalDeleted = userGIPs.length + userArchivedGIPs.length;
    
    // Remove user GIPs from active list
    this.state.activeGIPs = this.state.activeGIPs.filter(gip => 
      gip.author === 'system' || gip.author === 'admin'
    );
    
    // Remove user GIPs from archived list
    this.state.archivedGIPs = this.state.archivedGIPs.filter(gip => 
      gip.author === 'system' || gip.author === 'admin'
    );
    
    return totalDeleted;
  }
}

// Export singleton instance
export const gipSystem = new GIPSystem(); 

// Initialize the system when the module is loaded
(async () => {
  try {
    await gipSystem.initializeWithRealisticGIPs();
    
    // Start the first debate automatically
    const activeGIPs = gipSystem.getActiveGIPs();
    const firstGIP = activeGIPs.find(gip => gip.status === 'draft');
    if (firstGIP) {
      await gipSystem.startDebate(firstGIP.id);
      console.log(`Started debate for ${firstGIP.id} with ${firstGIP.debateThread.length} initial messages and ${(firstGIP as any).pendingMessages?.length || 0} pending messages`);
    }
  } catch (error) {
    console.error('Error initializing GIP system:', error);
  }
})(); 