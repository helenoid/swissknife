# Multi-stage Dockerfile for SwissKnife Production Deployment
# Stage 1: Build environment
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock* pnpm-lock.yaml* ./

# Install dependencies with production optimizations
RUN npm ci --only=production --no-audit --no-fund

# Copy source code
COPY . .

# Build all components
RUN npm run build:all

# Stage 2: Production runtime
FROM node:18-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production --no-audit --no-fund && npm cache clean --force

# Copy built artifacts from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/web/dist ./web/dist
COPY --from=builder /app/ipfs_accelerate_js/dist ./ipfs_accelerate_js/dist
COPY --from=builder /app/cli.mjs ./cli.mjs

# Copy essential runtime files
COPY --from=builder /app/vite.web.config.ts ./vite.web.config.ts
COPY --from=builder /app/src/shared ./src/shared

# Create non-root user for security
RUN addgroup -g 1001 -S swissknife && \
    adduser -S swissknife -u 1001

# Set ownership and permissions
RUN chown -R swissknife:swissknife /app
USER swissknife

# Expose the web GUI port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/ || exit 1

# Default command to run the virtual desktop
CMD ["npm", "run", "desktop"]

# Labels for metadata
LABEL maintainer="Benjamin Barber <starworks5@gmail.com>"
LABEL description="SwissKnife - Unified AI-powered development suite with virtual desktop"
LABEL version="0.0.53"
LABEL org.opencontainers.image.source="https://github.com/hallucinate-llc/swissknife"