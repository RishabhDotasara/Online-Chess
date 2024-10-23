# Use a base image with Node.js
FROM node:20-alpine

# Set the working directory for the frontend
WORKDIR /app/chess

# Copy the frontend package.json and package-lock.json
COPY chess/package*.json ./

# Install frontend dependencies
RUN npm install

# Copy the frontend source code
COPY ./chess/ .

# Build the frontend
RUN npm run build

# Set the working directory for the backend
WORKDIR /app/server

# Copy the backend package.json and package-lock.json
COPY server/package*.json ./

# Install backend dependencies
RUN npm install

# Copy the backend source code
COPY server/ .

# Compile TypeScript for the backend
RUN npm run build

# Expose the ports for both frontend and backend
EXPOSE 3000 4000

# Start both frontend and backend
CMD ["sh", "-c", "cd /app/server && npm start & cd /app/chess && npm run start"]