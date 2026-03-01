# ============================================
# Stage 1: Build frontend + compile server
# ============================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency files first (better layer caching)
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build production frontend bundle
RUN npm run build

# Compile server TypeScript to JavaScript
RUN npx tsc -p server/tsconfig.json

# ============================================
# Stage 2: Production frontend (nginx)
# ============================================
FROM nginx:alpine AS frontend

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# ============================================
# Stage 3: Production backend (Node.js)
# ============================================
FROM node:22-alpine AS backend

WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy compiled server from builder
COPY --from=builder /app/server/dist ./server/dist/

EXPOSE 3002

CMD ["node", "server/dist/index.js"]
