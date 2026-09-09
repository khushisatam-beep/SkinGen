import { getMessage } from './message.js';

/**
 * Handles incoming HTTP requests and routes them to appropriate responses
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
export function handleRoutes(req, res) {
  const { url, method } = req;

  // Set response headers for CORS and plain text format
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');

  // Route 1: GET / -> returns "Welcome to SkinGen AI" from custom module
  if (url === '/' && method === 'GET') {
    res.writeHead(200);
    res.end(getMessage());
  }
  // Route 2: GET /about -> returns "About SkinGen AI"
  else if (url === '/about' && method === 'GET') {
    res.writeHead(200);
    res.end("About SkinGen AI");
  }
  // Route 3: GET /user -> returns simple user message
  else if (url === '/user' && method === 'GET') {
    res.writeHead(200);
    res.end("User: Khushi (SkinGen Registered Patient)");
  }
  // Route 4: GET /async -> Demonstrates Asynchronous Programming using setTimeout()
  else if (url === '/async' && method === 'GET') {
    setTimeout(() => {
      res.writeHead(200);
      res.end("This is an asynchronous response from SkinGen AI (delayed by 2 seconds)!");
    }, 2000);
  }
  // Fallback for any other unmatched routes
  else {
    res.writeHead(404);
    res.end("404 Not Found - Invalid Route");
  }
}
