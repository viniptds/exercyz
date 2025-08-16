# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy rest of the code
COPY . .

# Expose the port Express runs on
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]