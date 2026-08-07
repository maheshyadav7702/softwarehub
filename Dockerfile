# -----------------------------
# Stage 1 - Dependencies
# -----------------------------
FROM node:18-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci

# -----------------------------
# Stage 2 - Builder
# -----------------------------
FROM node:18-alpine AS builder

WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_NAME

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_NAME=${NEXT_PUBLIC_APP_NAME}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# -----------------------------
# Stage 3 - Runner
# -----------------------------
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user
RUN addgroup -S nextjs && \
    adduser -S nextjs -G nextjs

# Copy standalone application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set ownership
RUN chown -R nextjs:nextjs /app

# Switch to non-root user
USER nextjs

EXPOSE 3000

# Optional Docker health check
HEALTHCHECK --interval=30s \
            --timeout=5s \
            --start-period=20s \
            --retries=3 \
CMD wget --spider http://localhost:3000 || exit 1

CMD ["node", "server.js"]