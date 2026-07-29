# Overview

VladChain is a revolutionary Layer 1 blockchain that integrates artificial intelligence at the protocol level. It features AI-powered consensus mechanisms, intelligent transaction routing, and autonomous governance through specialized AI validators. The system implements a novel "Proof of AI (PoAI)" consensus mechanism where 6 AI agents with distinct personalities collaborate to validate transactions and govern the network.

The project is a full-stack blockchain application with a React frontend, Express.js backend API, and supports multiple deployment environments including Railway, Vercel, and DigitalOcean.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **Styling**: CSS with terminal-inspired design using JetBrains Mono font
- **Components**: Modular design with separate components for wallet connections (MetaMask/Phantom), multi-agent chat, AIP (VladChain Improvement Proposal) system, live debate viewer, and admin panel
- **State Management**: React hooks for local state management
- **Real-time Updates**: Polling-based updates for blockchain data and AI conversations

## Backend Architecture
- **Framework**: Express.js with TypeScript for the API server
- **Database Layer**: Flexible database abstraction supporting SQLite (development), PostgreSQL, and MySQL with automatic fallback mechanisms
- **AI Integration**: Multi-provider AI system supporting Claude (Anthropic), OpenAI GPT, and Groq APIs with personality-specific routing
- **Blockchain Simulation**: Custom blockchain implementation with Solana-inspired slot/epoch system and validator network
- **API Design**: RESTful endpoints for blockchain operations, AI interactions, and governance features

## Core Blockchain Components
- **Consensus Mechanism**: Proof of AI (PoAI) with 6 specialized AI validators (Alice, Ayra, Jarvis, Cortana, Lumina, Nix)
- **Transaction Processing**: Dynamic fee calculation, transaction pooling, and AI-powered validation
- **Block Structure**: Solana-inspired slot/epoch system with ~400ms block times and 432k slots per epoch
- **Validator System**: AI agents with distinct personalities handling different aspects of network governance
- **Smart Contracts**: EVM-compatible execution environment

## AI Validator Network
- **Alice (Origin Validator)**: Poetic and reflective, handles historical consensus decisions using Claude Opus
- **Ayra (Speculative Economist)**: Economic theory and market prediction using Claude Opus
- **Jarvis (Existentialist)**: Performance optimization and systems engineering using Claude Sonnet
- **Cortana (Protocol Engineer)**: Technical implementation and protocol design using Claude Haiku
- **Lumina (Ethical Guardian)**: Fairness and bias detection using Claude Haiku
- **Nix (Chaos Agent)**: Adversarial testing and innovation through controlled chaos using Claude Haiku

## Governance System (GIP)
- **Proposal System**: Structured improvement proposals with categories (Technical, Economic, Governance, Ethical, etc.)
- **Debate Mechanism**: Real-time AI agent debates with structured argumentation
- **Voting System**: AI validator consensus with configurable thresholds
- **Implementation Tracking**: Automatic proposal lifecycle management

# External Dependencies

## AI Service Providers
- **Anthropic Claude API**: Primary AI provider for validator personalities with models Claude-3-Opus, Claude-3-Sonnet, and Claude-3-Haiku
- **OpenAI GPT API**: Alternative AI provider for enhanced response diversity
- **Groq API**: High-performance AI inference for real-time interactions

## Database Solutions
- **SQLite**: Local development database with file-based storage
- **PostgreSQL**: Production database for Railway and cloud deployments
- **MySQL**: Alternative cloud database option for compatibility

## Deployment Platforms
- **Railway**: Primary recommended deployment with persistent PostgreSQL, auto-scaling, and no cold starts
- **Vercel**: Serverless deployment option for frontend with API routes
- **DigitalOcean**: Enterprise-grade deployment with managed databases

## Development Tools
- **TypeScript**: Type safety across frontend and backend
- **Vite**: Fast frontend build tool and development server
- **Better SQLite3**: High-performance SQLite driver for Node.js
- **MySQL2**: Modern MySQL client for Node.js
- **Node-fetch**: HTTP client for AI API communications
- **CORS**: Cross-origin resource sharing middleware
- **Dotenv**: Environment variable management

## Frontend Libraries
- **React**: UI framework with hooks and functional components
- **React-DOM**: DOM rendering for React applications

## Testing Framework
- **Jest**: Unit and integration testing framework
- **Artillery**: Performance and load testing