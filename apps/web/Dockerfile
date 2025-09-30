# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund --legacy-peer-deps || npm install --no-audit --no-fund --legacy-peer-deps
COPY . .
RUN npm run build

# Runtime stage
FROM nginx:1.25-alpine
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist/ .
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]


