# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

COPY . .
RUN npm ci --only=production

# Expose the port Express runs on
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]