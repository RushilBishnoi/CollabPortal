# =============================================================================
# Academia-Industry Collaboration Platform — Backend
# Multi-stage production Dockerfile
# =============================================================================

FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
RUN npm ci --workspace=backend
COPY backend/ ./backend/
RUN npm run prisma:generate --workspace=backend
RUN npm run build --workspace=backend

FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
RUN npm ci --workspace=backend --omit=dev
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/backend/node_modules/.prisma ./backend/node_modules/.prisma
RUN mkdir -p /app/storage/placements /app/storage/applications && chown -R nestjs:nodejs /app/storage
USER nestjs
WORKDIR /app/backend
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/v1/health/liveness || exit 1
CMD ["node", "dist/main.js"]
