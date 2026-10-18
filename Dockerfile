# Stage 1: Build the React/Vite Frontend
FROM node:20-alpine AS build

WORKDIR /app

# Cache package dependencies
COPY package*.json ./
RUN npm ci

# Copy source and produce static build
COPY . .
RUN npm run build

# Stage 2: Serve production bundle with Nginx
FROM nginx:alpine

# Copy static assets from build stage to Nginx web root
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration supporting SPA client-side routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
