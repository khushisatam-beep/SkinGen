# SkinGen Docker Quick Start

Requirements: Docker Desktop running.

From this folder, run:

```powershell
docker compose up --build
```

Open:
- Frontend: http://localhost:3000
- Node.js server: http://localhost:5000/
- Server routes: http://localhost:5000/about, /user, /async

Stop containers:

```powershell
docker compose down
```

For complete architecture details, individual container commands, Nginx SPA routing notes, and troubleshooting, see [README_DOCKER.md](./README_DOCKER.md).
