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

Stop containers with Ctrl+C, then run:

```powershell
docker compose down
```

This configuration runs the React/Vite frontend and the small Node.js HTTP server included in this repository. It does not add a Python ML service or MongoDB because those components are not present in this ZIP.
