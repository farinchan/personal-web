FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first (better cache)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

FROM node:22-alpine AS production

WORKDIR /app

# Install only production system deps
RUN apk add --no-cache dumb-init

# Copy built output
COPY --from=builder /app/.output .output
COPY --from=builder /app/package.json .
COPY --from=builder /app/db ./db
COPY --from=builder /app/drizzle.config.ts .
COPY --from=builder /app/node_modules ./node_modules

# Create uploads directory
RUN mkdir -p /app/.output/public/uploads && chown -R node:node /app

USER node

ENV NODE_ENV=production
ENV HOST=0.0.0.0

# Port is configurable via docker-compose or -e flag
# Default: 3000 if not set
EXPOSE ${PORT:-3000}

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", ".output/server/index.mjs"]
