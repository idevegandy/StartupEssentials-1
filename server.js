/**
 * StartupEssentials - Simple Node.js Server
 * This basic server serves the static files for the StartupEssentials website
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the port to run the server on (default to 5000)
const PORT = process.env.PORT || 5000;

// Define MIME types for different file extensions
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
};

// Create HTTP server
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  // Handle the root URL by serving index.html
  let filePath = req.url === '/' 
    ? path.join(__dirname, 'index.html') 
    : path.join(__dirname, req.url);
  
  // Get the file extension
  const extname = path.extname(filePath).toLowerCase();
  
  // Default content type to text/plain
  let contentType = MIME_TYPES[extname] || 'text/plain';
  
  // Read the file
  fs.readFile(filePath, (error, content) => {
    if (error) {
      // If the file is not found, return 404
      if (error.code === 'ENOENT') {
        fs.readFile(path.join(__dirname, '404.html'), (err, content) => {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          
          // If 404.html exists, serve it; otherwise, send a simple message
          if (err) {
            res.end('<html><body><h1>404 Not Found</h1><p>The page you requested could not be found.</p></body></html>');
          } else {
            res.end(content, 'utf-8');
          }
        });
      } else {
        // For other errors, return 500
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      // If no error, serve the file with appropriate content type
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}/`);
  console.log('Press Ctrl+C to stop the server');
});

// Handle server errors
server.on('error', (err) => {
  console.error('Server error:', err);
  
  // If port is already in use, try another one
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is already in use. Please use a different port.`);
    process.exit(1);
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nGracefully shutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
