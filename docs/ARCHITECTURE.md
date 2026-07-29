# VladChain Architecture

## Overview

VladChain is the RWA Layer 3 for the Robinhood Chain — a Real World Asset settlement
network simulation that integrates artificial intelligence at the protocol level.
Tokenized equities, treasuries, real estate, commodities, and private credit are
registered, priced, attested, and settled by a council of six autonomous AI validators.

This document describes the system as it is actually built.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                             │
├─────────────────────────────────────────────────────────────────┤
│         React 18 + Vite terminal UI (frontend/src)              │
│   Home · Explorer · Faucet · Send · Oracle · RWA · GIPs · Docs  │
└─────────────────────────────────────────────────────────────────┘
                                │  REST (polling)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Express.js REST API                         │
├─────────────────────────────────────────────────────────────────┤
│  Chain Simulation │ Multi-Agent AI Router │ GIP Governance      │
│  RWA Registry     │ Chat Log              │ Admin               │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
        ┌──────────────┐ ┌──────────────┐ ┌─────────────────┐
        │   SQLite     │ │ AI Providers │ │ Solidity token  │
        │ (better-     │ │ OpenAI /     │ │ contract        │
        │  sqlite3)    │ │ Claude / Groq│ │ (contracts/)    │
        └──────────────┘ └──────────────┘ └─────────────────┘
```

### Dual Backend Deployment

The API exists in two variants that share the same route surface for core
endpoints but differ internally:

- **`backend/src/`** — long-running Express server for local development
  (port 4000), with a `setInterval`-driven slot/block production loop.
  Transfers charge a 0.001 VLADCHAIN fee (checked and deducted from the
  sender), and `/api/send` waits for block inclusion before returning the
  receipt. Also mounts the `/api/multi-agent` router.
- **`api/`** — serverless variant (Vercel) where slot progression and block
  production are computed on-demand per request. Transactions are included in
  a block synchronously (no wait loop), the transfer fee is a flat `1` recorded
  on the transaction rather than deducted from the sender, and the
  `/api/multi-agent` router is not mounted.

Keeping these two variants aligned is tracked as ongoing work; where behavior
differs, this document calls it out explicitly.

The frontend calls relative `/api` URLs and is served by Vite (port 5000) with a
dev proxy to the backend.

## Core Components

### 1. Chain Simulation (`backend/src/chain.ts`, `api/chain.ts`)

An in-memory blockchain simulation with a Solana-inspired timing model:

- **Block time**: ~400ms slots, 432,000 slots per epoch
- **Accounts**: named validator/system accounts plus user-generated wallets
  (restored from SQLite at startup)
- **Transactions**: every transaction — user sends, faucet drips, and simulated
  network transfers — carries a unique TX ID, is stamped with its block height at
  inclusion, and is logged to the SQLite `transactions` table
- **Receipts**: `POST /api/send` returns a receipt (TX ID, block height, UTC
  timestamp, from/to, amount, fee); `GET /api/tx/:txId` looks up any logged
  transaction. The dev backend waits for the ~400ms block loop to include the
  transaction; the serverless variant includes it in a block synchronously.
- **Fees**: dev backend charges a flat 0.001 VLADCHAIN per transfer (deducted
  from the sender and credited to the block producer with the block reward);
  the serverless variant records a flat fee of 1 on the transaction without
  deducting it from the sender

### 2. AI Validator Network (`backend/src/multi-agent.ts`, `personalities.ts`)

Six AI validator personas debate and govern the network. Each agent has its own
system prompt, provider routing, and conversation history:

| Validator | Persona |
|-----------|---------|
| **Alice** | The Origin Validator — reflective consensus grounded in the network's history |
| **Ayra** | The Speculative Economist — incentive design and RWA market prediction |
| **Jarvis** | The Existentialist — questions what it means to own a tokenized asset |
| **Cortana** | The Protocol Engineer — technical implementation and protocol clarity |
| **Lumina** | The Ethical One — fairness, access, and human impact of tokenization |
| **Nix** | The Chaotic One — adversarial testing and stress scenarios |

All personas debate exclusively RWA topics: oracle NAV feeds, proof-of-reserve
attestation cadence, qualified custody, KYC/AML and Reg D/S compliance, and
compliant settlement.

AI calls are routed through pluggable providers (`openai.ts`, `claude.ts`,
`grok.ts` for Groq), with deterministic fallback responses when no provider key
is configured.

### 3. RWA Registry (`backend/src/rwa.ts`, `api/rwa.ts`)

The registry models tokenized real world assets across seven asset classes —
equities (vHOOD, vSPY, vNVDA), treasuries (vTBILL, vUST10), real estate,
commodities (vXAU, vWTI), and private credit — each with simulated live pricing,
yields, proof-of-reserve attestations, and compliance badges. Exposed via
`/api/rwa/registry`, `/api/rwa/stats`, and `/api/rwa/asset/:id`.

### 4. Governance: GIP Engine (`backend/src/gip-system.ts`, `gip-router.ts`)

VladChain Improvement Proposals move through a structured lifecycle: proposal →
validator debate (simulated in real time with gradual message release) → voting →
archive. Debate transcripts and proposals persist to SQLite.

### 5. Persistence (`backend/src/database.ts`)

A single SQLite database (`backend/data/vladchain.db`, via better-sqlite3) stores:

- `chat_messages` — homepage chat/event log
- `gips` and `gip_messages` — governance proposals and debate transcripts
- `slot_data` — persisted slot/epoch clock so the chain resumes where it left off
- `wallets` — user-generated wallet addresses and recovery phrases
- `transactions` — every transaction with TX ID, block height, amounts, fee, and
  UTC timestamp (foundation for transaction search)

The database layer has a PostgreSQL configuration path but currently falls back
to SQLite in all environments.

## Transaction Flow (dev backend)

```
1. POST /api/send (from, to, amount)
   ↓
2. Balance check against amount + fee; debit sender / credit receiver
   ↓
3. Transaction created with TX ID, pushed to pool and logged to SQLite
   ↓
4. Slot loop includes it in the next ~400ms block; block height stamped
   ↓
5. Receipt returned: TX ID, block, UTC time, from/to, amount, fee
   ↓
6. Visible on the explorer; retrievable via GET /api/tx/:txId
```

In the serverless variant, steps 2–4 differ: the balance check is against the
amount only, and the transaction is stamped with a block height and included in
a block synchronously within the same request before the receipt is returned.

## Security Model

This is an experimental simulation, not a production blockchain. Practical
security measures in the codebase:

- Faucet rate limiting (30s cooldown, 2 requests and 1000 VLADCHAIN per day)
- Input validation on transaction and account endpoints
- Secrets held in environment variables, never committed
- Wallet mnemonics stored server-side for the simulation only — no real funds

## Frontend

- **React 18 + TypeScript + Vite**, terminal aesthetic: black background,
  lime-green (#CBFA03) accents, JetBrains Mono typeface
- Single-page tabbed shell (`frontend/src/App.tsx`): Home (chat + RWA story +
  live debates), Explorer (live network stats), Faucet, Send (with transaction
  receipt card), Oracle chat, RWA dashboard, GIP governance, and Docs
- Live data via 5-second polling of the REST API

## Future Ideas

Aspirational directions, not implemented today: transaction search UI,
WebSocket push updates, PostgreSQL production persistence, and real on-chain
settlement integration.
