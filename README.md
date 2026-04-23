# ldm-inbox-check-mcp

> **MCP server for [Inbox Check](https://check.live-direct-marketing.online)** —
> programmatic email deliverability testing across **9 providers** (Gmail,
> Outlook, Yahoo, iCloud, AOL, GMX, T-Online, Mail.ru, Yandex) for AI agents.

[📦 npm](https://www.npmjs.com/package/ldm-inbox-check-mcp) ·
[🌐 check.live-direct-marketing.online](https://check.live-direct-marketing.online) ·
[✨ awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) ·
[🔍 Glama](https://glama.ai/mcp/servers)

[![npm version](https://img.shields.io/npm/v/ldm-inbox-check-mcp.svg)](https://www.npmjs.com/package/ldm-inbox-check-mcp)
[![npm downloads](https://img.shields.io/npm/dm/ldm-inbox-check-mcp.svg)](https://www.npmjs.com/package/ldm-inbox-check-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-compatible-blue.svg)](https://modelcontextprotocol.io)

Plug real inbox-placement testing into Claude Desktop, Cursor, Windsurf, Cline,
or any other MCP-compatible AI client. The server wraps the Inbox Check REST
API and exposes 5 tools your agent can call directly — create a test, send
your email to the returned seed addresses, and read back per-provider
placement (Inbox / Spam / Promotions / Updates), authentication results
(SPF, DKIM, DMARC), headers, and screenshots.

## Why use this?

- **9 real provider mailboxes** — Gmail, Outlook, Yahoo, iCloud, AOL, GMX,
  T-Online, Mail.ru, Yandex. Not simulations: actual IMAP-backed seed
  accounts, actual filter verdicts.
- **Authentication verification** — SPF, DKIM, DMARC alignment reported
  per delivery, parsed from `Authentication-Results` headers.
- **Folder detection** — Inbox, Spam, Promotions, Updates, Social,
  Forums, Category-specific tabs where providers expose them.
- **Screenshots** — rendered inbox/spam list view for Gmail, Outlook
  and others, so the agent can show the user what the recipient sees.
- **No flaky scraping** — the service runs its own seed mailboxes; your
  agent only talks to a stable REST API.
- **Built for AI agents** — strict JSON schema via Zod, deterministic
  tool names, cursor pagination, idempotent keys.

## What it does

Exposes 5 tools that wrap the Inbox Check REST API:

| Tool | Description |
| --- | --- |
| `inbox_check_create` | Create a placement test; returns seed addresses to send your email to. |
| `inbox_check_status` | Get per-provider placement, SPF/DKIM/DMARC, screenshots. |
| `inbox_check_list` | List recent tests with cursor pagination. |
| `inbox_check_delete` | Delete a test and its screenshots. |
| `inbox_check_me` | Inspect API key metadata, features, quota usage. |

## Install

```bash
npx ldm-inbox-check-mcp
```

No global install needed — Claude Desktop / Cursor / Windsurf / Cline will
`npx`-run it on demand.

## Get an API key

1. Go to <https://check.live-direct-marketing.online/docs>.
2. Contact the operator for a key (self-service issuance coming later).
3. Copy the `icp_live_...` string — it's shown exactly once.

## Configure your MCP client

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`
(macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "inbox-check": {
      "command": "npx",
      "args": ["-y", "ldm-inbox-check-mcp"],
      "env": {
        "INBOX_CHECK_API_KEY": "icp_live_xxxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

### Cursor

`~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "inbox-check": {
      "command": "npx",
      "args": ["-y", "ldm-inbox-check-mcp"],
      "env": { "INBOX_CHECK_API_KEY": "icp_live_..." }
    }
  }
}
```

### Windsurf

`~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "inbox-check": {
      "command": "npx",
      "args": ["-y", "ldm-inbox-check-mcp"],
      "env": { "INBOX_CHECK_API_KEY": "icp_live_..." }
    }
  }
}
```

### Cline (VS Code)

`~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
(macOS) or the equivalent on your platform:

```json
{
  "mcpServers": {
    "inbox-check": {
      "command": "npx",
      "args": ["-y", "ldm-inbox-check-mcp"],
      "env": { "INBOX_CHECK_API_KEY": "icp_live_..." }
    }
  }
}
```

## Environment variables

| Variable | Required | Default |
| --- | --- | --- |
| `INBOX_CHECK_API_KEY` | yes | — |
| `INBOX_CHECK_BASE_URL` | no | `https://check.live-direct-marketing.online` |

Override the base URL only for self-hosted deployments or testing.

## Example prompts

> "Use inbox-check to create a test against Gmail, Outlook and Yahoo, then
> wait 90 seconds and tell me where the email landed."

> "List my last 10 inbox-check tests and summarise the spam rate per
> provider."

> "Create a test, I'll send the email, then show me the SPF/DKIM/DMARC
> results and tell me which record is misaligned."

## Use cases

1. **Cold-email warm-up QA** — before a campaign, send a draft to the seed
   addresses and have the agent verify Inbox placement on Gmail + Outlook.
2. **Authentication debugging** — when a domain starts landing in Spam, ask
   the agent to run a test and point to the failing SPF/DKIM/DMARC check.
3. **Template change review** — compare placement of an old vs new email
   template across 9 providers in a single agent run.
4. **Shared-IP reputation monitoring** — schedule periodic tests and have
   the agent alert when Spam rate crosses a threshold.
5. **Transactional mail audit** — verify that password-reset / receipt
   emails actually reach the Inbox (not Promotions) on every major provider.

## Related

- [check.live-direct-marketing.online](https://check.live-direct-marketing.online) — the hosted Inbox Check service behind this MCP server.
- [live-direct-marketing/ldm-sdk-js](https://github.com/live-direct-marketing/ldm-sdk-js) — official TypeScript SDK + MCP server for LDM.delivery (email delivery API for AI agents).
- [live-direct-marketing/awesome-email-deliverability](https://github.com/live-direct-marketing/awesome-email-deliverability) — curated list of tools, resources, and best practices for email deliverability.

## License

MIT © Live Direct Marketing
