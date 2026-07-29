# Security Policy

VLADCHAIN is an experimental blockchain simulation. It does not hold real funds,
custody real assets, or process payments. Even so, we want the code and the
hosted demo to be safe, and we appreciate responsible reports. This policy makes
no claims of certifications, audits, or dedicated security staffing.

## Reporting a Vulnerability

### 1. **DO NOT** create a public GitHub issue
Security vulnerabilities should be reported privately to prevent exploitation.

### 2. Report privately via GitHub Security Advisories
Use the repository's "Security" tab → "Report a vulnerability" to reach the
maintainers privately. Where possible, include:
- **Type of issue** (injection, XSS, auth bypass, etc.)
- **Affected source file(s)** and location (branch/commit or direct URL)
- **Any special configuration required to reproduce the issue**
- **Step-by-step instructions to reproduce the issue**
- **Proof-of-concept (if possible)**
- **Impact of the issue, including how an attacker might exploit it**

### 3. What to expect
This is a small open-source project — there is no dedicated security team or
guaranteed response SLA. We will acknowledge reports as quickly as we can,
fix confirmed issues, and credit reporters (with permission) once a fix ships.

## Security Measures in the Codebase

What is actually implemented today:

- **Input validation** on transaction and account API endpoints
- **Faucet rate limiting** (cooldown plus daily caps) to prevent abuse
- **Parameterized SQL queries** via better-sqlite3
- **Secrets kept in environment variables**, never committed to the repository
- **Admin endpoints protected** by authentication
- **No real funds at risk** — wallets and balances are simulated

## Scope Notes

- VladChain is **not** production-grade financial infrastructure: do not use it
  to secure real funds or sensitive data. The code has not been externally
  audited, and there are no uptime, monitoring, or patch-cadence guarantees.
- Simulated wallet mnemonics are stored server-side for the demo. Do not reuse
  them anywhere real.
- The AI validators are LLM-driven personas; their output is displayed content,
  not a consensus security mechanism.

## Responsible Disclosure

We follow responsible disclosure practices:
1. **Private Reporting**: Vulnerabilities reported privately via GitHub Security Advisories
2. **Collaborative Fix**: Work with reporters on solutions
3. **Public Credit**: Acknowledge contributors (with permission)
4. **No Legal Action**: Good faith security research is welcome

## Contact

- **Private reports**: GitHub Security Advisories on this repository
- **General questions**: open a GitHub issue (no sensitive details)

## Acknowledgments

We thank the security researchers and community members who help keep
VladChain secure through responsible disclosure and security research.
