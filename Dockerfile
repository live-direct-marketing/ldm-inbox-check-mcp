# Inbox Check MCP server — stdio transport
# Build:  docker build -t ldm-inbox-check-mcp .
# Run:    docker run -i --rm -e INBOX_CHECK_API_KEY=icp_live_... ldm-inbox-check-mcp
#
# The container speaks MCP over stdio on stdin/stdout, so `-i` (interactive)
# is required when running standalone. MCP clients spawn the container and
# attach to its stdio automatically.

# ---------- build stage ----------
FROM node:20-alpine AS build
WORKDIR /app

# Install deps using package-lock for reproducible builds
COPY package.json package-lock.json ./
RUN npm ci

# Compile TypeScript → dist/
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Drop devDependencies for the runtime layer
RUN npm prune --omit=dev

# ---------- runtime stage ----------
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
# Default base URL; override with -e INBOX_CHECK_BASE_URL=...
ENV INBOX_CHECK_BASE_URL=https://check.live-direct-marketing.online

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json LICENSE README.md ./

# Run as the unprivileged node user built into the official image
USER node

ENTRYPOINT ["node", "dist/index.js"]
