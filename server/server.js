// ============================================================================
// Server Entrypoint: server.js
// 1. Node.js built-in 'http' module creates an HTTP server on port 5000
// 2. Uses routes.js to handle basic routing (req.url, req.method)
// 3. Imports and uses custom module message.js
// 4. Handles asynchronous requests via routes.js
// ============================================================================

import http from 'http';
import { handleRoutes } from './routes.js';
import { getMessage } from './message.js';

const PORT = 5000;

// Create the basic HTTP server using the built-in 'http' module
const server = http.createServer((req, res) => {
  handleRoutes(req, res);
});

// Start listening on port 5000
server.listen(PORT, () => {
  console.log(`SkinGen AI Node.js server is running on port ${PORT}`);
  console.log(`Message from custom module: "${getMessage()}"`);
  console.log(`Open in your browser:`);
  console.log(`  - http://localhost:${PORT}/`);
  console.log(`  - http://localhost:${PORT}/about`);
  console.log(`  - http://localhost:${PORT}/user`);
  console.log(`  - http://localhost:${PORT}/async`);
});
