import http from "http";
import fs from "fs";
import path from "path";
import { URL } from 'url';

const server = http.createServer((req, res) => {
    const requestedUrl = new URL(req.url, `http://${req.headers.host}`);
    let requestedPath = requestedUrl.pathname;

    requestedPath = requestedPath.replace(/\/{2,}/g, '/');

    // If the normalized path is different from the original raw URL path, redirect immediately
    if (requestedPath !== requestedUrl.pathname) {
        // Build the clean URL for the redirect location
        const cleanUrl = new URL(requestedUrl.toString()); // Clone the URL object
        cleanUrl.pathname = requestedPath; // Set the cleaned path

        res.statusCode = 301;
        res.setHeader('Location', cleanUrl.href);
        res.end();
        return;
    }

    // Handle root path normalization
    if (requestedPath === '/') {
        requestedPath = '/index.html';
    }

    let filePath = path.join(process.cwd(), requestedPath);

    fs.stat(filePath, (err, stats) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.statusCode = 404;
                res.setHeader('Content-Type', 'text/plain');
                res.end('404 Not Found: ' + req.url);
            } else {
                console.error('File System Stat Error:', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'text/plain');
                res.end('500 Internal Server Error: ' + err.code);
            }
            return;
        }

        // Handle Directories: Force Trailing Slash Redirect for *clean* paths
        if (stats.isDirectory()) {
            // Check if the current CLEAN path is missing the trailing slash
            if (!requestedPath.endsWith('/')) {
                res.statusCode = 301;
                res.setHeader('Location', requestedPath + '/');
                res.end();
                return;
            } else {
                filePath = path.join(filePath, 'index.html');
            }
        }

        // Handle Files
        const extname = String(path.extname(filePath)).toLowerCase();
        const mimeTypes = {
            '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
            '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpg',
            '.gif': 'image/gif', '.svg': 'image/svg+xml', '.wav': 'audio/wav',
            '.mp4': 'video/mp4', '.woff': 'application/font-woff',
            '.ttf': 'application/font-ttf', '.eot': 'application/vnd.ms-fontobject',
            '.otf': 'application/font-otf', '.ico': 'image/x-icon'
        };
        const contentType = mimeTypes[extname] || 'application/octet-stream';

        fs.readFile(filePath, (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    res.statusCode = 404;
                    res.setHeader('Content-Type', 'text/plain');
                    res.end('404 Not Found: ' + req.url);
                } else {
                    console.error('File System Read Error:', err);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'text/plain');
                    res.end('500 Internal Server Error during read: ' + err.code);
                }
            } else {
                res.statusCode = 200;
                res.setHeader('Content-Type', contentType);
                res.end(data);
            }
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
