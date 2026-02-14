FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY ./ ./

FROM node:22-alpine AS final
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules/
COPY --from=builder /app/index.js ./
COPY --from=builder /app/config.js ./
COPY --from=builder /app/automod.js ./
COPY --from=builder /app/commands ./commands/
COPY --from=builder /app/utils ./utils/
COPY --from=builder /app/package.json ./
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "process.exit(0)" || exit 1
CMD ["node", "index.js"]
