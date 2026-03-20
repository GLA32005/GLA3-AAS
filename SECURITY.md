# Security Policy

## Supported Versions
We currently provide active security support for the following versions of AgentSec:

| Version | Supported          |
| ------- | ------------------ |
| v1.5.x  | :white_check_mark: |
| v1.0.x  | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability
We take the security of AgentSec and our users sincerely. If you believe you have found a security vulnerability in AgentSec (e.g. bypasses to the rule engine, SSRF in the console backend, or issues in the AST scanner), please report it to us immediately.

**DO NOT create a public GitHub issue.** Instead, please send an email to `security@agentsec.io`.

### What to Include
Please provide as much information as possible to help us reproduce the issue:
1. Type of issue (e.g., prompt injection bypass, RCE, authorization failure).
2. The version of AgentSec affected.
3. Proof-of-Concept (PoC) code or exact steps to reproduce.
4. The potential impact of the vulnerability.

### Response SLA
When a vulnerability is reported:
* We will acknowledge receipt of your report within **48 hours**.
* We will provide a triage assessment and an estimated timeline for a fix within **5 working days**.
* Once the vulnerability is patched, we will notify you and request verification.
* After the patch is released deployed, you will be publicly acknowledged (if desired) in our release notes and Security Advisories.

**Thank you for making AgentSec safer for the entire open-source AI community.**
