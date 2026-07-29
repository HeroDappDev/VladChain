import { Router } from 'express';

// ─────────────────────────────────────────────────────────────────────────────
// VLADCHAIN RWA Registry — simulated tokenized real-world asset data layer.
// Positions VladChain as the RWA Layer 3 for the Robinhood Chain.
// Prices/yields are simulated with light jitter to feel live, consistent with
// the rest of the app's simulated chain data.
// ─────────────────────────────────────────────────────────────────────────────

export interface RWAAsset {
  id: string;
  symbol: string;
  name: string;
  assetClass: 'Tokenized Equities' | 'US Treasuries' | 'Real Estate' | 'Commodities' | 'Private Credit';
  issuer: string;
  custodian: string;
  basePrice: number;      // USD reference price
  baseYield: number;      // annualized %, 0 for non-yielding
  tvl: number;            // USD value tokenized
  compliance: string[];   // e.g. ['KYC/AML', 'Reg D']
  attestor: string;
  attestationCadence: string;
  oracleSource: string;
  chain: string;
  decimals: number;
}

const REGISTRY: RWAAsset[] = [
  // ── Tokenized Equities ──
  { id: 'rwa-eq-001', symbol: 'vHOOD',  name: 'Robinhood Markets Inc. (Tokenized)', assetClass: 'Tokenized Equities', issuer: 'VladChain Securities SPV I', custodian: 'Anchorage Digital', basePrice: 41.27, baseYield: 0, tvl: 148_500_000, compliance: ['KYC/AML', 'Reg S'], attestor: 'Chainproof Audit Group', attestationCadence: 'Daily', oracleSource: 'PoAI Council · 6-model median', chain: 'VladChain L3', decimals: 6 },
  { id: 'rwa-eq-002', symbol: 'vSPY',   name: 'S&P 500 Index Basket (Tokenized)',   assetClass: 'Tokenized Equities', issuer: 'VladChain Securities SPV I', custodian: 'BNY Mellon Digital',  basePrice: 623.18, baseYield: 1.28, tvl: 512_400_000, compliance: ['KYC/AML', 'Reg S'], attestor: 'Chainproof Audit Group', attestationCadence: 'Daily', oracleSource: 'PoAI Council · 6-model median', chain: 'VladChain L3', decimals: 6 },
  { id: 'rwa-eq-003', symbol: 'vNVDA',  name: 'NVIDIA Corp. (Tokenized)',           assetClass: 'Tokenized Equities', issuer: 'VladChain Securities SPV II', custodian: 'Anchorage Digital', basePrice: 172.44, baseYield: 0.03, tvl: 287_900_000, compliance: ['KYC/AML', 'Reg D'], attestor: 'Chainproof Audit Group', attestationCadence: 'Daily', oracleSource: 'PoAI Council · 6-model median', chain: 'VladChain L3', decimals: 6 },
  // ── US Treasuries ──
  { id: 'rwa-ust-001', symbol: 'vTBILL', name: 'US Treasury Bills 0–3M (Tokenized)', assetClass: 'US Treasuries', issuer: 'VladChain Treasury Trust', custodian: 'State Street Digital', basePrice: 100.02, baseYield: 5.11, tvl: 1_284_000_000, compliance: ['KYC/AML', 'Reg D'], attestor: 'Deloitte Digital Assurance', attestationCadence: 'Daily', oracleSource: 'On-chain NAV oracle', chain: 'VladChain L3', decimals: 6 },
  { id: 'rwa-ust-002', symbol: 'vUST10', name: 'US Treasury Notes 10Y (Tokenized)',  assetClass: 'US Treasuries', issuer: 'VladChain Treasury Trust', custodian: 'State Street Digital', basePrice: 96.84, baseYield: 4.32, tvl: 642_700_000, compliance: ['KYC/AML', 'Reg D'], attestor: 'Deloitte Digital Assurance', attestationCadence: 'Daily', oracleSource: 'On-chain NAV oracle', chain: 'VladChain L3', decimals: 6 },
  // ── Real Estate ──
  { id: 'rwa-re-001', symbol: 'vNYCRE', name: 'Manhattan Prime Commercial REIT (Tokenized)', assetClass: 'Real Estate', issuer: 'VladChain Realty SPV', custodian: 'Fireblocks Trust Co.', basePrice: 54.90, baseYield: 6.85, tvl: 421_300_000, compliance: ['KYC/AML', 'Reg D', 'Accredited Only'], attestor: 'CBRE Valuation + Chainproof', attestationCadence: 'Monthly', oracleSource: 'Appraisal NAV oracle', chain: 'VladChain L3', decimals: 6 },
  { id: 'rwa-re-002', symbol: 'vRESI',  name: 'US Single-Family Rental Pool (Tokenized)',    assetClass: 'Real Estate', issuer: 'VladChain Realty SPV', custodian: 'Fireblocks Trust Co.', basePrice: 27.35, baseYield: 7.42, tvl: 198_600_000, compliance: ['KYC/AML', 'Reg D', 'Accredited Only'], attestor: 'CBRE Valuation + Chainproof', attestationCadence: 'Monthly', oracleSource: 'Appraisal NAV oracle', chain: 'VladChain L3', decimals: 6 },
  // ── Commodities ──
  { id: 'rwa-cm-001', symbol: 'vXAU',   name: 'LBMA Gold, Vaulted Zurich (Tokenized)', assetClass: 'Commodities', issuer: 'VladChain Commodities AG', custodian: 'Brinks Vault Zurich', basePrice: 2412.60, baseYield: 0, tvl: 764_800_000, compliance: ['KYC/AML', 'Reg S'], attestor: 'Bureau Veritas + Chainproof', attestationCadence: 'Weekly', oracleSource: 'PoAI Council · 6-model median', chain: 'VladChain L3', decimals: 8 },
  { id: 'rwa-cm-002', symbol: 'vWTI',   name: 'WTI Crude Futures Basket (Tokenized)',  assetClass: 'Commodities', issuer: 'VladChain Commodities AG', custodian: 'ICE Clear Custody', basePrice: 78.12, baseYield: 0, tvl: 96_200_000, compliance: ['KYC/AML', 'Reg S'], attestor: 'Bureau Veritas + Chainproof', attestationCadence: 'Weekly', oracleSource: 'PoAI Council · 6-model median', chain: 'VladChain L3', decimals: 6 },
  // ── Private Credit ──
  { id: 'rwa-pc-001', symbol: 'vCRED',  name: 'Senior Secured Lending Pool A (Tokenized)', assetClass: 'Private Credit', issuer: 'VladChain Credit DAC', custodian: 'Wilmington Trust Digital', basePrice: 101.44, baseYield: 11.20, tvl: 356_100_000, compliance: ['KYC/AML', 'Reg D', 'Accredited Only'], attestor: 'KPMG Digital Assurance', attestationCadence: 'Monthly', oracleSource: 'Servicer NAV oracle', chain: 'VladChain L3', decimals: 6 },
  { id: 'rwa-pc-002', symbol: 'vTRADE', name: 'Trade Finance Receivables Pool (Tokenized)', assetClass: 'Private Credit', issuer: 'VladChain Credit DAC', custodian: 'Wilmington Trust Digital', basePrice: 100.18, baseYield: 9.65, tvl: 142_900_000, compliance: ['KYC/AML', 'Reg D'], attestor: 'KPMG Digital Assurance', attestationCadence: 'Monthly', oracleSource: 'Servicer NAV oracle', chain: 'VladChain L3', decimals: 6 },
];

// Deterministic-ish live jitter so numbers move without a data store
function jitter(base: number, magnitudePct: number, seedOffset = 0): number {
  const t = Date.now() / 60_000 + seedOffset; // changes every minute
  const wave = Math.sin(t) * 0.6 + Math.sin(t / 3.7) * 0.4;
  return base * (1 + (wave * magnitudePct) / 100);
}

function liveAsset(a: RWAAsset, idx: number) {
  const price = jitter(a.basePrice, a.assetClass === 'US Treasuries' ? 0.05 : 0.9, idx);
  const change24h = ((price - a.basePrice) / a.basePrice) * 100;
  const lastAttestation = new Date(Date.now() - ((idx * 37 + 13) % 22) * 3_600_000); // within last ~22h
  return {
    ...a,
    price: Number(price.toFixed(a.basePrice > 500 ? 2 : 4)),
    yield: a.baseYield,
    change24h: Number(change24h.toFixed(2)),
    proofOfReserve: {
      status: 'VERIFIED',
      collateralizationPct: Number((100 + ((idx * 7) % 5) * 0.25).toFixed(2)),
      attestor: a.attestor,
      lastAttestation: lastAttestation.toISOString(),
      cadence: a.attestationCadence,
    },
  };
}

export function getRegistry() {
  return REGISTRY.map(liveAsset);
}

export function getStats() {
  const assets = getRegistry();
  const totalTVL = assets.reduce((s, a) => s + a.tvl, 0);
  const byClass: Record<string, { tvl: number; count: number }> = {};
  for (const a of assets) {
    byClass[a.assetClass] = byClass[a.assetClass] || { tvl: 0, count: 0 };
    byClass[a.assetClass].tvl += a.tvl;
    byClass[a.assetClass].count += 1;
  }
  const yielding = assets.filter(a => a.baseYield > 0);
  const weightedYield = yielding.reduce((s, a) => s + a.baseYield * a.tvl, 0) / (yielding.reduce((s, a) => s + a.tvl, 0) || 1);
  return {
    totalValueTokenized: totalTVL,
    assetCount: assets.length,
    assetClasses: Object.keys(byClass).length,
    avgYieldWeighted: Number(weightedYield.toFixed(2)),
    proofOfReserveCoverage: 100,
    settlementFinalityMs: 400,
    byClass,
    updatedAt: new Date().toISOString(),
  };
}

export const rwaRouter = Router();

rwaRouter.get('/registry', (_req, res) => {
  res.json({ assets: getRegistry() });
});

rwaRouter.get('/stats', (_req, res) => {
  res.json(getStats());
});

rwaRouter.get('/asset/:id', (req, res) => {
  const assets = getRegistry();
  const asset = assets.find(a => a.id === req.params.id || a.symbol.toLowerCase() === String(req.params.id).toLowerCase());
  if (!asset) return res.status(404).json({ error: 'Asset not found in RWA registry' });
  res.json(asset);
});
