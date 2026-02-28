# ============================================
# Stage 1: Build frontend
# ============================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency files first (better layer caching)
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build arguments for frontend env vars
ARG VITE_USE_MOCK=false
ENV VITE_USE_MOCK=$VITE_USE_MOCK

# Build production bundle (includes legacy IE11 build)
RUN npm run build

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

# Copy server code
COPY server/ ./server/

# Install tsx for running TypeScript
RUN npm install -g tsx

EXPOSE 3002

CMD ["tsx", "server/index.ts"]
