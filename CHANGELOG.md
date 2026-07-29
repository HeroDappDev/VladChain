# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Planned
- Transaction search by TX ID on the block explorer
- Public GitHub repository

## [2.2.0] - 2026-07-29

### Added
- **Transaction receipts** — `POST /api/send` now returns a full receipt with TX ID,
  block height, exact UTC timestamp, sender (debit), receiver (credit), and fee.
- Terminal-styled receipt card on the Send page.
- Persistent transaction log — every transaction (user sends, faucet drips, and
  simulated network transfers) is recorded with its TX ID and block height.
- `GET /api/tx/:txId` — look up any transaction by its TX ID (foundation for search).
- `GET /api/stats` — live network-wide totals for blocks, transactions, pending pool,
  and accounts, now powering the explorer stat cards.
- Wallet count persistence — generated wallets are restored at startup so Total
  Accounts survives restarts.

### Changed
- Header navigation: "CHAT" tab renamed to "HOME".
- Homepage: new RWA Layer 3 story section (why an RWA L3, how it works, by the
  numbers, AI-governed) shown above the Live Oracle Debates panel.
- Docs page: removed the redundant "VLADCHAIN PROTOCOL" heading under the ASCII logo.
- Header banner now reads "MAINNET TESTING".

## [2.1.0] - 2026-07

### Added
- RWA registry and dashboard (`/rwa`): tokenized equities (vHOOD/vSPY/vNVDA),
  treasuries (vTBILL/vUST10), real estate, commodities (vXAU/vWTI), and private
  credit with live prices, yields, proof-of-reserve attestations, and compliance
  badges.
- RWA API: `GET /api/rwa/registry`, `GET /api/rwa/stats`, `GET /api/rwa/asset/:id`.
- Homepage `/rwa` command.

### Changed
- **Rebranded to VLADCHAIN** — positioned as The RWA Layer 3 for the Robinhood Chain.
- All six AI validator personas (Alice, Ayra, Jarvis, Cortana, Lumina, Nix) now
  debate exclusively RWA topics: oracle NAV feeds, proof-of-reserve cadence,
  qualified custody, KYC/AML, and compliant settlement.
- Sample governance proposals (GIPs) re-themed to RWA protocol topics.

## [2.0.0] - 2026-06

### Added
- Six-validator AI council with Proof of AI (PoAI) consensus and live debates.
- VladChain Improvement Proposal (GIP) governance system with structured debate,
  voting, and lifecycle tracking.
- Solana-inspired slot/epoch block production (~400ms blocks, 432,000 slots/epoch).
- Block explorer, faucet with daily limits, wallet generation (VladChain + EVM),
  and send-transaction flow.
- Multi-provider AI routing (OpenAI, Anthropic Claude, Groq) per validator.
- SQLite persistence with PostgreSQL support for production.
