# Use Node 20 alpine
FROM node:20-alpine AS builder
WORKDIR /app

# Give the build process 1024MB of RAM (Perfect for t3.micro)
ENV NODE_OPTIONS="--max-old-space-size=1024"

COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.ts ./next.config.ts
EXPOSE 3000
CMD ["npm", "start"]
