# Security Policy

## Supported Versions

Markie is in `0.x`. Only the latest minor release receives security fixes.

| Version | Supported |
| ------- | --------- |
| 0.2.x   | ✅ |
| < 0.2   | ❌ — please upgrade |

## Reporting a Vulnerability

**Please do not file public GitHub issues for security vulnerabilities.**

Use GitHub's private vulnerability reporting:

1. Go to https://github.com/poiemaweb/markie/security/advisories/new
2. Submit a private advisory with:
   - A clear description of the vulnerability and its impact
   - Reproduction steps or proof-of-concept (without exploiting any third-party data)
   - The affected version(s) and platform(s)
   - Any suggested mitigation, if you have one

You should receive an acknowledgment within **3 business days**.

If you cannot use GitHub's private reporting, open a minimal public issue stating only that you have a security concern and asking for a contact channel — _do not include details_.

## Scope

Markie is a local desktop / static web application. Common areas of concern:

- **Markdown rendering escape paths** — the renderer relies on `markdown-it` defaults. If you find an XSS path that bypasses sanitization, this is in scope.
- **File / clipboard handling** — Tauri IPC bridge for `read_clipboard_text`, `write_clipboard_text`, and drag-and-drop paths.
- **Export pipeline** — PDF/PNG generation via `html-to-image` and `jspdf`.
- **Auto-update / signing** — _planned for `0.4.x`; not yet shipped_.

Out of scope:

- Vulnerabilities in upstream dependencies that are already publicly known and have published advisories — file them upstream.
- Misconfiguration of a user's own deployment (e.g., serving the static build over plain HTTP on a public network).

## Disclosure

We aim to publish a fix and a public advisory within **30 days** of triage, depending on severity. Reporters who follow this policy will be credited in the advisory unless they ask to remain anonymous.
