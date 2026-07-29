# Security Policy

VladChain is an experimental, in-development project. This policy describes how to report security issues and what security practices actually apply to this codebase. It makes no claims of certifications, audits, or dedicated security staffing.

## Reporting a Vulnerability

### 1. **DO NOT** create a public GitHub issue
Security vulnerabilities should be reported privately to prevent exploitation.

### 2. Report privately via GitHub Security Advisories
Use the repository's "Security" tab → "Report a vulnerability" to reach the maintainers privately. Include the following information where possible:
- **Type of issue** (e.g. injection, cross-site scripting, authentication bypass)
- **Full paths of source file(s) related to the vulnerability**
- **The location of the affected source code (tag/branch/commit or direct URL)**
- **Any special configuration required to reproduce the issue**
- **Step-by-step instructions to reproduce the issue**
- **Proof-of-concept or exploit code (if possible)**
- **Impact of the issue, including how an attacker might exploit it**

### 3. What to expect
This is a small, part-time project. We will acknowledge reports and work on fixes as time allows, and coordinate public disclosure with the reporter once a fix is available.

## Scope

VladChain is an experimental blockchain demonstration. It is **not** production-grade financial infrastructure:
- Do not use it to secure real funds or sensitive data.
- The consensus, cryptography, and networking code have **not** been externally audited.
- There are no uptime, monitoring, or patch-cadence guarantees.

## Security Practices in This Codebase

- **Hashing**: SHA-256 is used for block integrity.
- **Input validation**: API inputs are validated on the server.
- **Dependencies**: Dependencies are updated on a best-effort basis.
- **Secrets**: Credentials are kept out of the repository and managed via environment secrets.

## Responsible Disclosure

We follow responsible disclosure practices:
1. **Private Reporting**: Vulnerabilities reported privately via GitHub Security Advisories
2. **Collaborative Fix**: We work with reporters on solutions
3. **Public Credit**: Contributors acknowledged with their permission
4. **No Legal Action**: Good-faith security research is welcome

## Contact

- **Private reports**: GitHub Security Advisories on this repository
- **General questions**: open a GitHub issue (no sensitive details)

## Acknowledgments

We thank the security researchers and community members who help keep VladChain secure through responsible disclosure and security research.
