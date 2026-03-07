name: security-audit
description: Conducts a rigorous security vulnerability assessment and penetration testing simulation for the Voice of Tihama platform, safeguarding APIs, authentication mechanisms, and sensitive data.

skill_overview: >
  This tool executes a comprehensive security evaluation of the platform's full-stack architecture. It aims to identify, classify, and mitigate potential threat vectors and vulnerabilities in strict alignment with OWASP Top 10 industry standards, ensuring robust data protection and system integrity.

vulnerability_detection_focus:
  - SQL Injection (SQLi) & Prisma ORM Query Vulnerabilities
  - Cross-Site Scripting (XSS) & Content Security Policy (CSP) Efficacy
  - Cross-Site Request Forgery (CSRF) Mitigation & SameSite Cookie Policies
  - Broken Authentication, Session Hijacking & Fixation
  - Insecure Direct Object References (IDOR) & Privilege Escalation (Permission Bypass)
  - Sensitive Data Exposure & Cryptographic Failures

infrastructure_and_policy_review:
  - API Endpoint Hardening, CORS Configurations & Rate Limiting
  - Admin Authentication, Multi-Factor Authentication (MFA) Readiness & RBAC (Role-Based Access Control)
  - Secure Token Storage (JWT), HttpOnly Cookies, & Token Lifecycle Management
  - Environment Variable Security, Secrets Management & CI/CD Pipeline Security

execution_directive: >
  Perform a systematic, code-level security audit across both frontend and backend repositories. Identify security misconfigurations and vulnerabilities, delivering actionable, "secure-by-default" remediation strategies to fortify the platform against external and internal threats.