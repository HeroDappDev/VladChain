import express from 'express';
import { gipSystem } from './gip-system';
import { GIPCategory, GIPPriority, GIPStatus } from './gip-types';

export const gipRouter = express.Router();

// GET current debate status
gipRouter.get('/debate-status', (req, res) => {
  res.json({
    success: true,
    ...gipSystem.getCurrentDebateStatus()
  });
});

// GET all GIPs
gipRouter.get('/', (req, res) => {
  const { status, category, author } = req.query;
  
  let gips = [...gipSystem.getActiveGIPs(), ...gipSystem.getArchivedGIPs()];
  
  if (status) {
    gips = gips.filter(gip => gip.status === status);
  }
  
  if (category) {
    gips = gips.filter(gip => gip.category === category);
  }
  
  if (author) {
    gips = gips.filter(gip => gip.author === author);
  }
  
  res.json({
    success: true,
    gips: gips.sort((a, b) => b.createdAt - a.createdAt)
  });
});

// GET active GIPs only
gipRouter.get('/active', (req, res) => {
  res.json({
    success: true,
    gips: gipSystem.getActiveGIPs().sort((a, b) => b.createdAt - a.createdAt)
  });
});

// GET archived GIPs only
gipRouter.get('/archived', (req, res) => {
  res.json({
    success: true,
    gips: gipSystem.getArchivedGIPs().sort((a, b) => b.createdAt - a.createdAt)
  });
});

// GET specific GIP
gipRouter.get('/:gipId', (req, res) => {
  const { gipId } = req.params;
  const gip = gipSystem.getGIP(gipId);
  
  if (!gip) {
    return res.status(404).json({ error: `GIP ${gipId} not found` });
  }
  
  res.json({
    success: true,
    gip
  });
});

// POST create new GIP
gipRouter.post('/', async (req, res) => {
  const { 
    author, 
    title, 
    summary, 
    fullProposal, 
    category, 
    priority, 
    tags = [] 
  } = req.body;
  
  if (!author || !title || !summary || !fullProposal || !category || !priority) {
    return res.status(400).json({ 
      error: 'Missing required fields: author, title, summary, fullProposal, category, priority' 
    });
  }
  
  try {
    const gip = await gipSystem.createGIP(
      author,
      title,
      summary,
      fullProposal,
      category as GIPCategory,
      priority as GIPPriority,
      tags
    );
    
    res.json({
      success: true,
      message: 'GIP created successfully',
      gip
    });
  } catch (error) {
    console.error('Error creating GIP:', error);
    res.status(500).json({ 
      error: 'Failed to create GIP',
      details: String(error)
    });
  }
});

// POST start debate on GIP
gipRouter.post('/:gipId/debate', async (req, res) => {
  const { gipId } = req.params;
  
  try {
    await gipSystem.startDebate(gipId);
    
    res.json({
      success: true,
      message: `Debate started for ${gipId}`
    });
  } catch (error) {
    console.error('Error starting debate:', error);
    res.status(500).json({ 
      error: 'Failed to start debate',
      details: String(error)
    });
  }
});

// POST archive GIP
gipRouter.post('/:gipId/archive', (req, res) => {
  const { gipId } = req.params;
  
  try {
    gipSystem.archiveGIP(gipId);
    
    res.json({
      success: true,
      message: `GIP ${gipId} archived successfully`
    });
  } catch (error) {
    console.error('Error archiving GIP:', error);
    res.status(500).json({ 
      error: 'Failed to archive GIP',
      details: String(error)
    });
  }
});

// GET GIP transcript
gipRouter.get('/:gipId/transcript', (req, res) => {
  const { gipId } = req.params;
  const gip = gipSystem.getGIP(gipId);
  
  if (!gip) {
    return res.status(404).json({ error: `GIP ${gipId} not found` });
  }
  
  const transcript = gipSystem.exportGIPTranscript(gipId);
  
  res.json({
    success: true,
    gipId,
    transcript
  });
});

// GET system statistics
gipRouter.get('/stats/system', (req, res) => {
  const stats = gipSystem.getSystemStats();
  
  res.json({
    success: true,
    stats
  });
});

// POST trigger auto-GIP generation
gipRouter.post('/trigger/auto', async (req, res) => {
  try {
    await gipSystem.checkAutoTriggers();
    
    res.json({
      success: true,
      message: 'Auto-trigger check completed'
    });
  } catch (error) {
    console.error('Error checking auto-triggers:', error);
    res.status(500).json({ 
      error: 'Failed to check auto-triggers',
      details: String(error)
    });
  }
});

// GET available categories
gipRouter.get('/categories', (req, res) => {
  res.json({
    success: true,
    categories: Object.values(GIPCategory)
  });
});

// GET available priorities
gipRouter.get('/priorities', (req, res) => {
  res.json({
    success: true,
    priorities: Object.values(GIPPriority)
  });
});

// GET available statuses
gipRouter.get('/statuses', (req, res) => {
  res.json({
    success: true,
    statuses: Object.values(GIPStatus)
  });
});

// POST create sample GIP for testing
gipRouter.post('/sample', async (req, res) => {
  try {
    const sampleGIP = await gipSystem.createGIP(
      'cortana',
      'Standardize Proof-of-Reserve Attestation Cadence for RWA Custodians',
      'Propose a standardized attestation cadence so every qualified custodian publishes proof-of-reserve on a predictable, verifiable schedule.',
      `As the Protocol Engineer of VladChain, I propose a standardized proof-of-reserve attestation cadence for all qualified custodians backing our tokenized assets.

Currently, attestation timing varies by asset class, which creates uneven verification windows for holders of vHOOD, vTBILL, tokenized real estate, and commodities like vXAU. This proposal introduces a unified system that:

1. Requires every qualified custodian to publish proof-of-reserve attestations on a fixed cadence per asset class
2. Cross-checks attested reserves against six-model oracle NAV feeds and collateralization ratios
3. Automatically flags drift between attested reserves and on-chain supply, triggering deviation halts
4. Maintains KYC/AML and Reg D / Reg S compliance throughout the attestation pipeline

Technical Implementation:
- Deploy attestation monitors that verify custodian signatures and reserve statements in real time
- Anchor each attestation on-chain with a verifiable timestamp and asset-class tag
- Create fallback verification through secondary auditors when a custodian misses a window
- Establish governance parameters for cadence per asset class (equities, treasuries, real estate, commodities, private credit)

Benefits:
- Predictable, auditable reserve verification for every RWA holder
- Faster detection of under-collateralization before it reaches retail flow
- Stronger trust in ~400ms settlement of Robinhood Chain retail flow into RWAs
- Demonstrates compliant, transparent RWA governance

This represents a significant step toward fully verifiable real-world asset backing on the RWA Layer 3.`,
      GIPCategory.TECHNICAL,
      GIPPriority.HIGH,
      ['proof-of-reserve', 'custody', 'compliance', 'rwa']
    );
    
    res.json({
      success: true,
      message: 'Sample GIP created successfully',
      gip: sampleGIP
    });
  } catch (error) {
    console.error('Error creating sample GIP:', error);
    res.status(500).json({ 
      error: 'Failed to create sample GIP',
      details: String(error)
    });
  }
});

// POST generate multiple sample GIPs
gipRouter.post('/generate-samples', async (req, res) => {
  try {
    const { generateSampleGIPs } = await import('./generate-sample-gips');
    await generateSampleGIPs();
    
    res.json({
      success: true,
      message: 'Sample GIPs generated successfully'
    });
  } catch (error) {
    console.error('Error generating sample GIPs:', error);
    res.status(500).json({ 
      error: 'Failed to generate sample GIPs',
      details: String(error)
    });
  }
});

// POST clear all GIPs
gipRouter.post('/clear', (req, res) => {
  try {
    gipSystem.clearAllGIPs();
    
    res.json({
      success: true,
      message: 'All GIPs cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing GIPs:', error);
    res.status(500).json({ 
      error: 'Failed to clear GIPs',
      details: String(error)
    });
  }
});

// POST simulate ongoing debates
gipRouter.post('/simulate-debates', async (req, res) => {
  try {
    await gipSystem.simulateOngoingDebates();
    
    res.json({
      success: true,
      message: 'Debate simulation completed'
    });
  } catch (error) {
    console.error('Error simulating debates:', error);
    res.status(500).json({ 
      error: 'Failed to simulate debates',
      details: String(error)
    });
  }
}); 