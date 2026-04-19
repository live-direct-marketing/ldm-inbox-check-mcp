# ldm-inbox-check-mcp

[![npm](https://img.shields.io/npm/v/ldm-inbox-check-mcp.svg)](https://www.npmjs.com/package/ldm-inbox-check-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-compatible-blue.svg)](https://modelcontextprotocol.io)

MCP server for [Inbox Check](https://check.live-direct-marketing.online) —
programmatic email deliverability testing across Gmail, Outlook, Yahoo,
Mail.ru and Yandex. Plug it into Claude Desktop, Cursor, or any other
MCP-compatible AI client.

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

No global install needed — Claude Desktop / Cursor will `npx`-run it on
demand.

## Get an API key

1. Go to <https://check.live-direct-marketing.online/docs>.
2. Contact the operator for a key (self-service issuance coming later).
3. Copy the `icp_live_...` string — it’s shown exactly once.

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

### Custom agents (Agent SDK, LangChain, etc.)

Run the server manually and pipe stdio, or use the underlying REST API
directly — see <https://check.live-direct-marketing.online/docs>.

## Environment variables

| Variable | Required | Default |
| --- | --- | --- |
| `INBOX_CHECK_API_KEY` | yes | — |
| `INBOX_CHECK_BASE_URL` | no | `https://check.live-direct-marketing.online` |

Override the base URL only for self-hosted deployments or testing.

## Example prompt

> “Use inbox-check to create a test against Gmail and Outlook, then wait 60
> seconds and tell me where the email landed.”

The agent will call `inbox_check_create`, show you the seed addresses to
send to, and (after you send) call `inbox_check_status` to report
placements.

## License

MIT © Live Direct Marketing
