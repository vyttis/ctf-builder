# syntax=docker/dockerfile:1

# --- Base ---
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# --- Dependencies ---
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# --- Build ---
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env vars must be set via --build-arg or .env
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- Production ---
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
