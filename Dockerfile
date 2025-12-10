# Use official Node.js 20 LTS image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy all source files
COPY . .

# Build TypeScript (optional)
# RUN npx tsc

# Expose port if you later add a web server (optional)
EXPOSE 3000

# Run script
CMD ["npx", "ts-node", "fetch-notify.ts"]
