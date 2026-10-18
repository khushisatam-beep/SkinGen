# SkinGen Containerization Guide

This document describes how to run the SkinGen application using Docker and Docker Compose.

---

## Architecture Overview

- **Frontend (`skingen-frontend`)**:
  - React 18 + Vite SPA.
  - Multi-stage build compiled via `node:20-alpine` (`npm run build`).
  - Production static bundle served via `nginx:alpine` on port `80` (mapped to `3000` on the host).
  - Configured with `nginx.conf` supporting client-side SPA routing (`try_files $uri $uri/ /index.html;`) and gzip compression.

- **Server (`skingen-server`)**:
  - Standalone Node.js HTTP server (`server/server.js`) using Node 20.
  - Listens on port `5000` (mapped to `5000` on the host).
  - Implements modular routing (`/`, `/about`, `/user`, `/async`) and CORS headers.

> **Note on Backend & Database**: Full backend services and MongoDB integration are being developed separately by the backend team and will be connected upon completion.

---

## Prerequisites

1. **Docker Desktop** installed and running on your system (Windows, macOS, or Linux).
2. **Docker Compose v2** (included with modern Docker Desktop installations).

---

## Quick Start (Docker Compose)

### 1. Build and Start All Services

Open a terminal in the root `SkinGen` folder and run:

```bash
docker compose up --build
```

To run in detached (background) mode:

```bash
docker compose up -d --build
```

### 2. Access the Application

- **Frontend Application**: [http://localhost:3000](http://localhost:3000)
- **Node.js Server**: [http://localhost:5000/](http://localhost:5000/)
  - Test Routes:
    - [http://localhost:5000/](http://localhost:5000/) — `"Welcome to SkinGen AI"`
    - [http://localhost:5000/about](http://localhost:5000/about) — `"About SkinGen AI"`
    - [http://localhost:5000/user](http://localhost:5000/user) — `"User: Khushi (SkinGen Registered Patient)"`
    - [http://localhost:5000/async](http://localhost:5000/async) — Asynchronous 2-second delayed response

### 3. Stop Containers

To gracefully stop and remove the containers:

```bash
docker compose down
```

---

## Building and Running Services Individually

### Frontend Only

```bash
# Build the frontend Docker image
docker build -t skingen-frontend .

# Run the container
docker run -d -p 3000:80 --name skingen-frontend skingen-frontend
```

### Server Only

```bash
# Build the server Docker image
docker build -f Dockerfile.server -t skingen-server .

# Run the container
docker run -d -p 5000:5000 --name skingen-server skingen-server
```

---

## Useful Docker Commands

| Action | Command |
|---|---|
| View container status | `docker compose ps` |
| View combined logs | `docker compose logs -f` |
| View frontend logs | `docker compose logs -f frontend` |
| View server logs | `docker compose logs -f server` |
| Restart services | `docker compose restart` |
| Rebuild without cache | `docker compose build --no-cache` |

---

## Troubleshooting

1. **Port Conflicts (`3000` or `5000` already in use)**:
   - Ensure local dev processes (e.g. `npm run dev` or `node server/server.js`) are stopped before launching Docker containers.
   - Alternatively, modify the host port in `docker-compose.yml` (e.g., `"3001:80"` or `"5001:5000"`).

2. **SPA Client Routing 404s**:
   - The custom `nginx.conf` includes `try_files $uri $uri/ /index.html;`, ensuring direct URL navigation (such as `/profile` or `/assessment`) resolves properly to React Router.

3. **Stale Cache / Outdated Code in Containers**:
   - Force a clean rebuild using:
     ```bash
     docker compose build --no-cache
     docker compose up -d
     ```
