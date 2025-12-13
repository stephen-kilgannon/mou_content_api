# Use Node.js 20 LTS Alpine for smaller image size
FROM node:20-alpine AS builder

# Set metadata for the image
LABEL maintainer="Content API Team"
LABEL description="Content API - PostgreSQL Edition"
LABEL version="1.0"

# Install PostgreSQL client and build dependencies
RUN apk add --no-cache postgresql-client python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

# Install PostgreSQL client for runtime
RUN apk add --no-cache postgresql-client curl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Create logs directory and set permissions
RUN mkdir -p /app/logs && chown nodejs:nodejs /app/logs

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Set environment
ENV NODE_ENV=production

# Start application
CMD ["node", "dist/index.js"]