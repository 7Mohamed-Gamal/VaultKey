# Stage 1: Build the production application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies cleanly
RUN npm ci

# Copy all source files
COPY . .

# Build production assets (Vite generates output to /app/dist)
RUN npm run build

# Stage 2: Serve using high-performance NGINX Alpine image
FROM nginx:alpine

# Copy custom Nginx configuration for single-page React applications (SPA)
RUN rm -rf /usr/share/nginx/html/* && \
    rm -rf /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose container port 3000
EXPOSE 3000

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
