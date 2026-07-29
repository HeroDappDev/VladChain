import React, { useEffect, useState } from 'react';

const LIME = '#CBFA03';

interface ProofOfReserve {
  status: string;
  collateralizationPct: number;
  attestor: string;
  lastAttestation: string;
  cadence: string;
}

interface RWAAsset {
  id: string;
  symbol: string;
  name: string;
  assetClass: string;
  issuer: string;
  custodian: string;
  price: number;
  yield: number;
  change24h: number;
  tvl: number;
  compliance: string[];
  oracleSource: string;
  chain: string;
  proofOfReserve: ProofOfReserve;
}

interface RWAStats {
  totalValueTokenized: number;
  assetCount: number;
  assetClasses: number;
  avgYieldWeighted: number;
  proofOfReserveCoverage: number;
  settlementFinalityMs: number;
  byClass: Record<string, { tvl: number; count: number }>;
}

function fmtUSD(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
}

function timeAgo(iso: string): string {
  const h = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000));
  return h === 0 ? 'just now' : `${h}h ago`;
}

const CLASS_ORDER = ['US Treasuries', 'Tokenized Equities', 'Commodities', 'Real Estate', 'Private Credit'];

export default function RWADashboard() {
  const [assets, setAssets] = useState<RWAAsset[]>([]);
  const [stats, setStats] = useState<RWAStats | null>(null);
  const [selected, setSelected] = useState<RWAAsset | null>(null);
  const [classFilter, setClassFilter] = useState<string>('All');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [reg, st] = await Promise.all([
          fetch('/api/rwa/registry').then(r => r.json()),
          fetch('/api/rwa/stats').then(r => r.json()),
        ]);
        if (!alive) return;
        setAssets(reg.assets || []);
        setStats(st);
        setError(null);
      } catch {
        if (alive) setError('RWA registry unavailable — backend offline');
      }
    };
    load();
    const t = setInterval(load, 15_000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const shown = classFilter === 'All' ? assets : assets.filter(a => a.assetClass === classFilter);

  const card: React.CSSProperties = { border: `1px solid rgba(203,250,3,0.25)`, borderRadius: '10px', padding: '18px', background: 'rgba(203,250,3,0.04)' };
  const label: React.CSSProperties = { color: '#8B98A5', fontSize: '0.72em', textTransform: 'uppercase', letterSpacing: '1px' };

  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', color: '#C9D1D9', fontFamily: 'JetBrains Mono, monospace' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', margin: '10px 0 6px' }}>
        <h1 style={{ color: '#FFFFFF', fontSize: '2em', margin: '0 0 6px', letterSpacing: '1px' }}>
          RWA <span style={{ color: LIME, textShadow: `0 0 14px ${LIME}` }}>REGISTRY</span>
        </h1>
        <div style={{ color: '#FFFFFF', fontSize: '0.95em' }}>
          Real World Assets, tokenized and settled on the RWA Layer 3 for the Robinhood Chain
        </div>
        <div style={{ color: '#8B98A5', fontSize: '0.78em', letterSpacing: '2px', marginTop: '4px' }}>
          INSTITUTIONAL-GRADE · PROOF-OF-RESERVE VERIFIED · AI-PRICED
        </div>
      </div>

      {error && (
        <div style={{ ...card, borderColor: '#FF6B6B', color: '#FF6B6B', textAlign: 'center', margin: '16px 0' }}>{error}</div>
      )}

      {/* Stats band */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', margin: '20px 0' }}>
          {[
            { v: fmtUSD(stats.totalValueTokenized), l: 'Total Value Tokenized' },
            { v: String(stats.assetCount), l: 'Listed RWAs' },
            { v: `${stats.avgYieldWeighted}%`, l: 'Avg Yield (TVL-weighted)' },
            { v: `${stats.proofOfReserveCoverage}%`, l: 'Proof-of-Reserve Coverage' },
            { v: `${stats.settlementFinalityMs}ms`, l: 'Settlement Finality' },
          ].map((s, i) => (
            <div key={i} style={{ ...card, textAlign: 'center', padding: '14px' }}>
              <div style={{ color: LIME, fontSize: '1.45em', fontWeight: 'bold', textShadow: '0 0 10px rgba(203,250,3,0.4)' }}>{s.v}</div>
              <div style={{ ...label, marginTop: '5px' }}>{s.l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Asset class breakdown */}
      {stats && (
        <div style={{ margin: '0 0 20px' }}>
          <div style={{ display: 'flex', height: '14px', borderRadius: '7px', overflow: 'hidden' }}>
            {CLASS_ORDER.filter(c => stats.byClass[c]).map((c, i) => {
              const pct = (stats.byClass[c].tvl / stats.totalValueTokenized) * 100;
              const colors = ['#CBFA03', '#9BC400', '#7A9B00', '#5C7400', '#3E4E00'];
              return <div key={c} style={{ width: `${pct}%`, background: colors[i % colors.length] }} title={`${c} ${pct.toFixed(1)}%`} />;
            })}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '0.78em', color: '#B8C2CC', marginTop: '8px' }}>
            {CLASS_ORDER.filter(c => stats.byClass[c]).map(c => (
              <span key={c}>{c} <span style={{ color: LIME }}>{((stats.byClass[c].tvl / stats.totalValueTokenized) * 100).toFixed(1)}%</span></span>
            ))}
          </div>
        </div>
      )}

      {/* Class filter */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '0 0 14px' }}>
        {['All', ...CLASS_ORDER].map(c => (
          <button
            key={c}
            onClick={() => setClassFilter(c)}
            style={{
              background: classFilter === c ? LIME : 'transparent',
              color: classFilter === c ? '#000' : LIME,
              border: `1px solid ${LIME}`,
              borderRadius: '6px',
              padding: '10px 14px',
              minHeight: '44px',
              fontFamily: 'inherit',
              fontSize: '0.78em',
              fontWeight: 'bold',
              letterSpacing: '1px',
              cursor: 'pointer',
            }}
          >
            {c.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Registry table */}
      <div style={{ border: '1px solid rgba(203,250,3,0.2)', borderRadius: '10px', overflow: 'hidden', overflowX: 'auto' }}>
        <table className="explorer-data-table rwa-registry-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84em', minWidth: '640px' }}>
          <thead>
            <tr style={{ background: 'rgba(203,250,3,0.07)' }}>
              {['ASSET', 'CLASS', 'PRICE', '24H', 'YIELD', 'TVL', 'COMPLIANCE', 'RESERVES'].map(h => (
                <th key={h} style={{ ...label, textAlign: h === 'ASSET' || h === 'CLASS' || h === 'COMPLIANCE' ? 'left' : 'right', padding: '11px 14px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((a, i) => (
              <tr
                key={a.id}
                onClick={() => setSelected(selected?.id === a.id ? null : a)}
                style={{
                  cursor: 'pointer',
                  background: selected?.id === a.id ? 'rgba(203,250,3,0.1)' : i % 2 === 0 ? 'rgba(203,250,3,0.02)' : 'transparent',
                  borderTop: '1px solid rgba(203,250,3,0.08)',
                }}
              >
                <td data-label="ASSET" style={{ padding: '11px 14px' }}>
                  <span style={{ color: LIME, fontWeight: 'bold' }}>{a.symbol}</span>
                  <div style={{ color: '#8B98A5', fontSize: '0.82em' }}>{a.name}</div>
                </td>
                <td data-label="CLASS" style={{ padding: '11px 14px', color: '#B8C2CC' }}>{a.assetClass}</td>
                <td data-label="PRICE" style={{ padding: '11px 14px', textAlign: 'right', color: '#FFFFFF' }}>${a.price.toLocaleString()}</td>
                <td data-label="24H" style={{ padding: '11px 14px', textAlign: 'right', color: a.change24h >= 0 ? LIME : '#FF6B6B' }}>
                  {a.change24h >= 0 ? '+' : ''}{a.change24h}%
                </td>
                <td data-label="YIELD" style={{ padding: '11px 14px', textAlign: 'right', color: a.yield > 0 ? LIME : '#5A6470' }}>
                  {a.yield > 0 ? `${a.yield}%` : '—'}
                </td>
                <td data-label="TVL" style={{ padding: '11px 14px', textAlign: 'right', color: '#FFFFFF' }}>{fmtUSD(a.tvl)}</td>
                <td data-label="COMPLIANCE" className="explorer-cell-break" style={{ padding: '11px 14px' }}>
                  {a.compliance.map(c => (
                    <span key={c} style={{ display: 'inline-block', border: '1px solid rgba(203,250,3,0.4)', borderRadius: '4px', color: LIME, fontSize: '0.72em', padding: '1px 6px', margin: '1px 4px 1px 0' }}>{c}</span>
                  ))}
                </td>
                <td data-label="RESERVES" style={{ padding: '11px 14px', textAlign: 'right' }}>
                  <span style={{ color: LIME, fontSize: '0.8em' }}>✓ {a.proofOfReserve.collateralizationPct}%</span>
                </td>
              </tr>
            ))}
            {shown.length === 0 && !error && (
              <tr><td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: '#8B98A5' }}>Loading RWA registry…</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail panel */}
      {selected && (
        <div style={{ ...card, margin: '18px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <span style={{ color: LIME, fontWeight: 'bold', fontSize: '1.25em', textShadow: '0 0 6px rgba(203,250,3,0.4)' }}>{selected.symbol}</span>
              <span style={{ color: '#FFFFFF', marginLeft: '12px' }}>{selected.name}</span>
            </div>
            <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', color: '#8B98A5', cursor: 'pointer', fontFamily: 'inherit' }}>[ close ]</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px', marginTop: '16px' }}>
            <div>
              <div style={label}>Issuer</div>
              <div style={{ color: '#FFFFFF', marginBottom: '10px' }}>{selected.issuer}</div>
              <div style={label}>Qualified Custodian</div>
              <div style={{ color: '#FFFFFF', marginBottom: '10px' }}>{selected.custodian}</div>
              <div style={label}>Settlement Chain</div>
              <div style={{ color: LIME }}>{selected.chain}</div>
            </div>
            <div>
              <div style={label}>Proof of Reserve</div>
              <div style={{ color: LIME, marginBottom: '10px' }}>
                {selected.proofOfReserve.status} · {selected.proofOfReserve.collateralizationPct}% collateralized
              </div>
              <div style={label}>Attestor</div>
              <div style={{ color: '#FFFFFF', marginBottom: '10px' }}>{selected.proofOfReserve.attestor}</div>
              <div style={label}>Last Attestation</div>
              <div style={{ color: '#FFFFFF' }}>{timeAgo(selected.proofOfReserve.lastAttestation)} · {selected.proofOfReserve.cadence.toLowerCase()} cadence</div>
            </div>
            <div>
              <div style={label}>Oracle Pricing</div>
              <div style={{ color: '#FFFFFF', marginBottom: '10px' }}>{selected.oracleSource}</div>
              <div style={label}>Compliance Framework</div>
              <div style={{ marginBottom: '10px' }}>
                {selected.compliance.map(c => (
                  <span key={c} style={{ display: 'inline-block', border: '1px solid rgba(203,250,3,0.4)', borderRadius: '4px', color: LIME, fontSize: '0.78em', padding: '2px 8px', margin: '2px 6px 2px 0' }}>{c}</span>
                ))}
              </div>
              <div style={label}>Value Tokenized</div>
              <div style={{ color: '#FFFFFF' }}>{fmtUSD(selected.tvl)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Lifecycle strip */}
      <div style={{ margin: '30px 0 20px' }}>
        <div style={{ ...label, marginBottom: '10px' }}>RWA Lifecycle on VladChain</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {[
            { n: '1', t: 'Asset Onboarding', d: 'Issuer registers the asset; the AI council screens legal structure, custody, and eligibility.' },
            { n: '2', t: 'Custody Attestation', d: 'Qualified custodians post signed proof-of-reserve attestations on-chain on a fixed cadence.' },
            { n: '3', t: 'Oracle Pricing', d: 'Six independent AI validators produce a median price and NAV feed, with deviation halts.' },
            { n: '4', t: 'Compliant Settlement', d: 'Robinhood Chain retail flow settles into RWAs in ~400ms inside a compliance-native transfer layer.' },
          ].map((s, i) => (
            <div key={i} style={{ ...card, padding: '14px' }}>
              <div style={{ color: LIME, fontWeight: 'bold', marginBottom: '6px' }}>{s.n} · {s.t}</div>
              <div style={{ color: '#B8C2CC', fontSize: '0.82em', lineHeight: '1.55' }}>{s.d}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ color: '#5A6470', fontSize: '0.75em', textAlign: 'center', margin: '10px 0 30px', maxWidth: '720px', marginLeft: 'auto', marginRight: 'auto' }}>
        Simulated registry data for demonstration. Nothing on this page constitutes an offer of securities or investment advice.
      </div>
    </div>
  );
}
