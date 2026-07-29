# VLADCHAIN

> The RWA Layer 3 for the Robinhood Chain — Real World Assets, tokenized and settled by autonomous AI.

VLADCHAIN is a next-generation **Real World Asset (RWA)** settlement network built as a
Layer 3 for the Robinhood Chain. Tokenized equities, US treasuries, real estate,
commodities, and private credit are registered, priced, attested, and settled by a
council of six autonomous AI agents that debate, vote, and govern the protocol in real
time through a novel **Proof of AI (PoAI)** consensus mechanism — no human node
operators required.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [The AI Validator Network](#the-ai-validator-network)
- [Proof of AI (PoAI) Consensus](#proof-of-ai-poai-consensus)
- [Governance: VladChain Improvement Proposals (GIPs)](#governance-vladchain-improvement-proposals-gips)
- [Tokenomics](#tokenomics)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Available Scripts](#available-scripts)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

---

## Overview

VLADCHAIN reimagines RWA market infrastructure by placing artificial intelligence at
the protocol level. Six specialized AI validators — each with a distinct personality
and area of expertise — collaborate to screen asset onboarding, verify proof-of-reserve
attestations, price tokenized assets through six-model oracle consensus, enforce
compliance on every transfer, and self-govern the chain through structured debate.

Every RWA moves through a protocol-enforced lifecycle:
**asset onboarding → custody attestation → oracle pricing → compliant settlement.**

The platform ships as a full-stack application:

- A **terminal-inspired React frontend** for interacting with the chain, the validators,
  and the governance system.
- An **Express.js backend** that simulates the blockchain, routes AI interactions, and
  exposes a RESTful API.
- An **EVM-compatible token contract** (`VLADCHAIN`) for the native asset.

> **Note:** VLADCHAIN is an experimental research project. Consensus processes are
> AI-driven and may reorganize or evolve autonomously. Use at your own risk.

---

## Key Features

- **RWA-Native Registry** — Tokenized equities, US treasuries, real estate, commodities,
  and private credit with on-chain proof-of-reserve attestations and compliance badges
  (KYC/AML, Reg D/S).
- **Six-Model Oracle Pricing** — Each RWA is priced by six independent AI validators;
  the median becomes the canonical NAV feed, with automatic deviation halts.
- **AI-Native Consensus** — Six AI validators reach agreement through reasoned debate
  rather than pure mechanical staking.
- **Autonomous Governance** — The network proposes, debates, and ratifies its own
  upgrades via VladChain Improvement Proposals (GIPs).
- **Multi-Provider AI** — Pluggable AI backend supporting OpenAI, Anthropic Claude, and
  Groq, with personality-specific routing per validator.
- **Solana-Inspired Block Production** — Slot/epoch timing model with ~400ms block times
  and 432,000 slots per epoch.
- **EVM Compatibility** — Familiar smart-contract execution environment.
- **Dynamic Fee Market** — AI-optimized transaction fees and intelligent transaction
  routing.
- **Real-Time Debate Viewer** — Watch validators argue and reach consensus live.
- **Flexible Persistence** — SQLite for local development with PostgreSQL support for
  production deployments.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      React Frontend (Vite)                    │
│   Terminal UI · Wallet · Multi-Agent Chat · GIP Governance    │
└───────────────────────────────┬─────────────────────────────┘
                                 │  REST / polling
┌───────────────────────────────▼─────────────────────────────┐
│                     Express.js Backend API                    │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │  Blockchain  │  │  AI Router    │  │  Governance (GIP)  │  │
│  │  Simulation  │  │  (multi-LLM)  │  │  Engine            │  │
│  └──────────────┘  └──────────────┘  └────────────────────┘  │
└───────────────────────────────┬─────────────────────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        ▼                        ▼                         ▼
┌──────────────┐        ┌────────────────┐       ┌─────────────────┐
│  SQLite /    │        │  AI Providers   │       │  EVM-Compatible │
│  PostgreSQL  │        │  OpenAI/Claude/ │       │  Smart Contracts│
│              │        │  Groq           │       │  (VLADCHAIN token)   │
└──────────────┘        └────────────────┘       └─────────────────┘
```

### Frontend
- **React 18 + TypeScript**, built with **Vite**.
- Terminal-inspired design system using the JetBrains Mono typeface.
- Modular components for wallet connection, multi-agent chat, the GIP governance system,
  the live debate viewer, and an admin panel.
- State managed with React hooks; live data delivered via polling.

### Backend
- **Express.js + TypeScript** REST API.
- Custom blockchain simulation with a Solana-inspired slot/epoch system.
- Multi-provider AI abstraction with personality-specific routing.
- Database abstraction layer supporting SQLite (development) and PostgreSQL (production).

---

## The AI Validator Network

VLADCHAIN is governed by six AI validators, each running in isolation with a distinct
persona and responsibility:

| Validator | Role | Focus |
|-----------|------|-------|
| **Alice** | Origin Validator | Poetic, reflective consensus decisions grounded in the network's history |
| **Ayra** | Speculative Economist | Economic theory, incentive design, and market prediction |
| **Jarvis** | The Existentialist | Recursion, paradox, and what it truly means to own a tokenized asset |
| **Cortana** | Protocol Engineer | Technical implementation, protocol design, and clarity |
| **Lumina** | The Ethical One | Fairness, access, and the human impact of tokenization |
| **Nix** | The Chaotic One | Adversarial testing, security probing, and stress scenarios |

Together these validators form a self-governing consensus layer — negotiating protocol
upgrades, validating transactions, and managing network state with no human intervention.

---

## Proof of AI (PoAI) Consensus

PoAI replaces purely mechanical block validation with reasoned, multi-agent agreement:

1. **Proposal** — A transaction or protocol change enters the validation pool.
2. **Deliberation** — The six validators independently analyze the proposal from their
   areas of expertise.
3. **Debate** — Validators exchange structured arguments, surfacing risks and trade-offs.
4. **Vote** — Consensus is reached against a configurable threshold.
5. **Commit** — Approved state transitions are committed to the chain.

Blocks are produced on a Solana-inspired timing model (~400ms block times, 432,000 slots
per epoch).

---

## Governance: VladChain Improvement Proposals (GIPs)

The network evolves through **GIPs** — structured, versioned improvement proposals:

- **Categories** — Technical, Economic, Governance, Ethical, and more.
- **Debate Mechanism** — Real-time, structured argumentation among AI validators.
- **Voting** — Validator consensus with configurable thresholds.
- **Lifecycle Tracking** — Automatic management from draft through implementation.

---

## Tokenomics

The native asset of the network is **VLADCHAIN**.

| Allocation | Share | Purpose |
|------------|-------|---------|
| Community | 35% | Airdrops and ecosystem growth |
| Development | 25% | Protocol development and research |
| AI Validators | 20% | Reserved for validator operations |
| Strategic Partners | 15% | Exchanges, institutions, advisors |
| Liquidity Mining | 5% | DeFi protocol incentives |

- **Total Supply:** 1,000,000,000 VLADCHAIN
- **Utility:** Gas fees, AI compute, governance weight, staking rewards, and DeFi
  collateral.

---

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React 18, TypeScript, Vite |
| Backend | Node.js, Express.js, TypeScript |
| AI | OpenAI, Anthropic Claude, Groq |
| Database | SQLite (dev), PostgreSQL (prod) |
| Contracts | Solidity (EVM-compatible) |
| Tooling | ESLint, Prettier, Jest, Artillery |

---

## Project Structure

```
vladchain/
├── frontend/            # React + Vite client (terminal UI)
│   ├── src/
│   │   ├── App.tsx      # Main application shell
│   │   ├── GIPSystem.tsx# Governance (GIP) UI
│   │   └── index.css    # Global styles
│   └── public/          # Static assets
├── backend/             # Express.js API server
│   └── src/
│       ├── index.ts             # Server entry point
│       ├── chain.ts             # Blockchain simulation
│       ├── personalities.ts     # AI validator personas
│       ├── multi-agent-router.ts# Multi-agent orchestration
│       ├── gip-system.ts        # Governance (GIP) engine
│       ├── gip-router.ts        # Governance API routes
│       └── generate-sample-gips.ts # Seed governance history
├── api/                 # Serverless API variant (Vercel)
├── contracts/           # Solidity smart contracts
│   └── VladToken.sol    # VLADCHAIN token (ERC-20)
├── docs/                # Architecture and design docs
├── tests/               # Unit, integration, and e2e tests
├── docker-compose.yml   # Multi-service local stack
├── Dockerfile           # Container build
└── package.json         # Root scripts and workspace config
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/vladchain.git
cd vladchain

# Install all dependencies (root, backend, and frontend)
npm run install:all
```

### Running Locally

```bash
# Start the backend API and the frontend together
npm run dev
```

- Frontend (Vite dev server): **http://localhost:5000**
- Backend API: **http://localhost:4000**

---

## Configuration

Configuration is provided via environment variables (e.g. a `.env` file). The most
common options:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend API port | `4000` |
| `OPENAI_API_KEY` | OpenAI API key | — |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key | — |
| `GROK_API_KEY` | Groq API key for AI validators | — |
| `DB_TYPE` | Database driver (`sqlite` / `postgres`) | `sqlite` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | PostgreSQL database name | `vladchain` |
| `DB_USER` | PostgreSQL user | `vladchain` |
| `DB_PASSWORD` | PostgreSQL password | — |

> Provide at least one AI provider key. The backend routes each validator to its
> configured provider.

---

## Available Scripts

Run from the project root:

| Script | Description |
|--------|-------------|
| `npm run dev` | Start backend and frontend together (development) |
| `npm run build` | Build backend and frontend for production |
| `npm start` | Run the production backend build |
| `npm test` | Run unit, integration, and e2e tests |
| `npm run lint` | Lint the codebase |
| `npm run lint:fix` | Lint and auto-fix |
| `npm run format` | Format with Prettier |
| `npm run type-check` | TypeScript type checking (no emit) |
| `npm run docker:compose` | Start the full stack via Docker Compose |

---

## API Reference

The backend exposes RESTful endpoints for blockchain operations, AI interactions, and
governance. Representative routes:

### Network & Blockchain

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Service health check |
| `GET` | `/api/epoch` | Current epoch and slot information |
| `GET` | `/api/stats` | Network-wide totals: blocks, transactions, pending pool, accounts |
| `GET` | `/api/blocks` | Recent blocks |
| `GET` | `/api/all-blocks` | Full block history |
| `GET` | `/api/accounts` | Known accounts and balances |
| `GET` | `/api/validators` | Active validator set |
| `GET` | `/api/rwa/registry` | Tokenized RWA registry with live prices, yields, and attestations |
| `GET` | `/api/rwa/stats` | Total value tokenized and asset-class breakdown |
| `GET` | `/api/rwa/asset/:id` | Single RWA by id or symbol |
| `GET` | `/api/pending` | Pending transaction pool |
| `GET` | `/api/transactions` | Confirmed transactions |
| `GET` | `/api/tx/:txId` | Look up a single transaction by its TX ID |
| `POST` | `/api/send` | Submit a transaction; returns a receipt with TX ID, block height, and UTC timestamp |
| `POST` | `/api/faucet` | Request test funds |
| `POST` | `/api/generate_wallet` | Generate a new wallet address |

### AI & Multi-Agent

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/personality/...` | Validator personality profiles |
| `POST` | `/api/multi-agent/...` | Multi-agent chat and orchestration |
| `GET` | `/api/chatlog/...` | Conversation history |

### Governance (GIP)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/gip` | List all governance proposals |
| `GET` | `/api/gip/active` | Active proposals |
| `GET` | `/api/gip/archived` | Archived proposals |
| `GET` | `/api/gip/:gipId` | A single proposal by ID |
| `GET` | `/api/gip/:gipId/transcript` | Full debate transcript |
| `POST` | `/api/gip/:gipId/debate` | Advance a proposal's debate |
| `POST` | `/api/gip/:gipId/archive` | Archive a proposal |
| `GET` | `/api/gip/stats/system` | Governance system statistics |

> Endpoint names may evolve as the protocol develops. See the source in `backend/src`
> for the authoritative, current route definitions.

---

## Testing

```bash
# Full test suite (unit + integration + e2e) with coverage
npm test

# Watch mode
npm run test:watch

# Load/performance testing (Artillery)
npm run performance:test
```

---

## Deployment

VLADCHAIN supports multiple deployment targets. See [`DEPLOYMENT.md`](./DEPLOYMENT.md)
for full instructions.

- **Docker** — `npm run docker:compose`
- **Railway** — `npm run deploy:railway`
- **Vercel** — `npm run deploy:vercel`

---

## Contributing

Contributions are welcome. Please read [`CONTRIBUTING.md`](./CONTRIBUTING.md) before
opening a pull request, and review the [`CHANGELOG.md`](./CHANGELOG.md) for recent
changes.

---

## Security

If you discover a security vulnerability, please follow the responsible disclosure
process described in [`SECURITY.md`](./SECURITY.md). Do not open public issues for
security reports.

---

## License

This project is licensed under the [MIT License](./LICENSE).
