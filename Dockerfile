# Multi-stage build for SwissKnife

# Build stage
FROM node:20-slim AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-slim AS production
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built files from builder stage
COPY --from=builder /app/cli.mjs ./
COPY --from=builder /app/yoga.wasm ./
COPY --from=builder /app/install.sh ./

# Create a non-root user
RUN groupadd -r swissknife && \
    useradd -r -g swissknife swissknife && \
    chown -R swissknife:swissknife /app

# Switch to non-root user
USER swissknife

# Set entrypoint
ENTRYPOINT ["node", "cli.mjs"]

# Development stage
FROM node:20 AS development
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Set environment variables
ENV NODE_ENV=development

# Set up for development
CMD ["npm", "run", "dev"]

# Testing stage
FROM node:20 AS testing
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source files and tests
COPY . .

# Set environment variables
ENV NODE_ENV=test

# Run tests by default
CMD ["npm", "test"]