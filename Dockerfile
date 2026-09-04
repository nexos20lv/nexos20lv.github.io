# syntax=docker/dockerfile:1.7

# ---------- deps ----------
# Installs production + dev deps once so the cache survives source changes.
# libc6-compat is required by Next.js' SWC binaries on Alpine.
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- builder ----------
# Runs `next build` which, with `output: "standalone"` in next.config.ts,
# produces a self-contained bundle in .next/standalone.
FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- runner ----------
# Minimal runtime: no npm, no source, no dev deps. Non-root user.
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Unprivileged user so a container breakout can't write to bind mounts with
# root. 1001 is Next.js' conventional uid.
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Standalone output does NOT include /public and /.next/static, we copy them
# explicitly so they land at the paths Next's server.js expects.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Traefik (Dockploy's default proxy) will do its own healthchecks at the
# HTTP level, but this one helps `docker ps` show unhealthy containers.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]
