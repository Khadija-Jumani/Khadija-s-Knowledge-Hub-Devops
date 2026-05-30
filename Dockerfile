# Use lightweight official Node alpine image
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy dependency manifests
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy application source code and public assets
COPY server.js ./
COPY public/ ./public/

# Expose the application port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start the Node.js web server
CMD ["node", "server.js"]
