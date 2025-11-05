# Multi-stage build for Node.js TypeScript app
FROM node:20-slim AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
ENV MEDIASOUP_SKIP_WORKER_PREBUILT_DOWNLOAD=false
ENV npm_config_cache=/tmp/.npm
RUN npm ci --prefer-offline --no-audit --progress=false

# Copy TypeScript config and source files
COPY tsconfig.json ./
COPY prisma ./prisma/
COPY src ./src/

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production stage
FROM node:20-slim AS production

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    dumb-init \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r nodejs \
    && useradd -r -g nodejs hbb

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production --prefer-offline --no-audit && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

# Create startup script with CORRECT path
RUN echo '#!/bin/bash\n\
set -e\n\
echo "🚀 Starting HBB Service..."\n\
echo "🔄 Running database migrations..."\n\
npx prisma migrate deploy\n\
echo "✅ Migrations complete"\n\
echo "🎯 Starting application..."\n\
exec node dist/app.js' > /app/start.sh && chmod +x /app/start.sh

# Set ownership
RUN chown -R hbb:nodejs /app
USER hbb

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["/app/start.sh"]