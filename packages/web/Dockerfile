# Build stage
FROM oven/bun:1.2.18 AS builder

WORKDIR /app

# Copy package files and root tsconfig
COPY package.json bun.lock tsconfig.json ./
COPY packages/web/package.json ./packages/web/
COPY packages/shared/package.json ./packages/shared/
COPY packages/api/package.json ./packages/api/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source files
COPY packages/shared ./packages/shared
COPY packages/web ./packages/web

# Build web app
WORKDIR /app/packages/web
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN bun run build

# Production stage - serve with nginx
FROM nginx:alpine

# Copy nginx config as template (uses envsubst for API_URL)
COPY packages/web/nginx.conf /etc/nginx/templates/default.conf.template

# Copy built files
COPY --from=builder /app/packages/web/dist /usr/share/nginx/html

# Default API URL (overridden at deploy time)
ENV API_URL=http://localhost:3001

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:8080/ || exit 1

# envsubst replaces ${API_URL} in the template, then start nginx
CMD ["/bin/sh", "-c", "envsubst '${API_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
