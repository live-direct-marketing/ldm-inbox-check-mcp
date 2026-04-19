#!/usr/bin/env node
// Inbox Check MCP server — stdio transport.
//
// Wraps https://check.live-direct-marketing.online/api/v1/* so AI agents
// (Claude Desktop, Cursor, any MCP-compatible client) can run inbox-placement
// deliverability tests as tool calls.
//
// Auth: Bearer key passed via INBOX_CHECK_API_KEY env. Base URL overridable
// via INBOX_CHECK_BASE_URL (default = production).

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const BASE_URL = (
  process.env.INBOX_CHECK_BASE_URL || 'https://check.live-direct-marketing.online'
).replace(/\/+$/, '');
const API_KEY = process.env.INBOX_CHECK_API_KEY;

if (!API_KEY) {
  process.stderr.write(
    'ldm-inbox-check-mcp: INBOX_CHECK_API_KEY is required. ' +
      'Get one at https://check.live-direct-marketing.online/docs\n',
  );
  process.exit(1);
}

async function api(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; data: unknown }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'ldm-inbox-check-mcp/0.1.0',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }
  return { status: res.status, data };
}

function toolResult(payload: unknown, isError = false) {
  return {
    content: [
      {
        type: 'text' as const,
        text: typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2),
      },
    ],
    ...(isError ? { isError: true } : {}),
  };
}

const TOOLS = [
  {
    name: 'inbox_check_create',
    description:
      'Create an inbox-placement test. Returns a token and the seed addresses you must send your test email to. The API key has a daily/monthly quota; each successful create consumes one unit.',
    inputSchema: {
      type: 'object',
      properties: {
        providers: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['gmail', 'outlook', 'yahoo', 'mailru', 'yandex'],
          },
          description:
            "Providers to test against. Must be a subset of the key's allowed_providers (see inbox_check_me). Omit to use the full allowlist.",
        },
        recipient_email: {
          type: 'string',
          description: 'Optional — for your own audit trail. Not used for routing.',
        },
        meta: {
          type: 'object',
          description: 'Opaque metadata (e.g. campaign_id) — returned unchanged in GET.',
        },
      },
    },
  },
  {
    name: 'inbox_check_status',
    description:
      'Get the current state of a test: per-provider placement (inbox / spam / promotions / not_received), SPF/DKIM/DMARC, summary stats, and screenshot URLs if the key has screenshots enabled.',
    inputSchema: {
      type: 'object',
      required: ['token'],
      properties: {
        token: {
          type: 'string',
          description: 'Test token returned by inbox_check_create.',
        },
      },
    },
  },
  {
    name: 'inbox_check_list',
    description:
      'List recent tests owned by this API key, most recent first. Supports cursor pagination via created_at.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          description: 'Items per page (default 20).',
        },
        cursor: {
          type: 'string',
          description: 'ISO-8601 created_at from previous page.',
        },
        status: {
          type: 'string',
          enum: ['waiting', 'checking', 'done', 'expired'],
          description: 'Filter by status.',
        },
      },
    },
  },
  {
    name: 'inbox_check_delete',
    description: 'Delete a test and all its results / screenshots. Irreversible.',
    inputSchema: {
      type: 'object',
      required: ['token'],
      properties: {
        token: { type: 'string' },
      },
    },
  },
  {
    name: 'inbox_check_me',
    description:
      'Return this API key’s metadata: tier, enabled features, allowed providers, current daily/monthly usage vs. limits.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

const server = new Server(
  {
    name: 'ldm-inbox-check-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args = {} } = req.params;

  try {
    switch (name) {
      case 'inbox_check_create': {
        const { status, data } = await api('POST', '/api/v1/tests', args);
        return toolResult(data, status >= 400);
      }
      case 'inbox_check_status': {
        const token = String((args as { token?: string }).token || '');
        if (!token) return toolResult({ error: 'token is required' }, true);
        const { status, data } = await api(
          'GET',
          `/api/v1/tests/${encodeURIComponent(token)}`,
        );
        return toolResult(data, status >= 400);
      }
      case 'inbox_check_list': {
        const a = args as Record<string, unknown>;
        const qs = new URLSearchParams();
        if (a.limit !== undefined) qs.set('limit', String(a.limit));
        if (a.cursor) qs.set('cursor', String(a.cursor));
        if (a.status) qs.set('status', String(a.status));
        const suffix = qs.toString() ? `?${qs}` : '';
        const { status, data } = await api('GET', `/api/v1/tests${suffix}`);
        return toolResult(data, status >= 400);
      }
      case 'inbox_check_delete': {
        const token = String((args as { token?: string }).token || '');
        if (!token) return toolResult({ error: 'token is required' }, true);
        const { status, data } = await api(
          'DELETE',
          `/api/v1/tests/${encodeURIComponent(token)}`,
        );
        return toolResult(data, status >= 400);
      }
      case 'inbox_check_me': {
        const { status, data } = await api('GET', '/api/v1/me');
        return toolResult(data, status >= 400);
      }
      default:
        return toolResult({ error: `unknown tool: ${name}` }, true);
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return toolResult({ error: 'request_failed', message: msg }, true);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
process.stderr.write(
  `ldm-inbox-check-mcp 0.1.0 — connected (base=${BASE_URL})\n`,
);
