import http from "http";
import fs from "fs";
import path from "path";
import { URL } from 'url';

const DB_PATH = path.join(process.cwd(), 'database', 'users.json');

const server = http.createServer((req, res) => {
    const requestedUrl = new URL(req.url, `http://${req.headers.host}`);
    let requestedPath = requestedUrl.pathname;

    requestedPath = requestedPath.replace(/\/{2,}/g, '/');

    // Redirect Logic
    if (requestedPath !== requestedUrl.pathname) {
        const cleanUrl = new URL(requestedUrl.toString());
        cleanUrl.pathname = requestedPath;
        res.statusCode = 301;
        res.setHeader('Location', cleanUrl.href);
        res.end();
        return;
    }

    // Handle Signup
    if (req.method === 'POST' && requestedPath === '/api/signup') {
        let body = '';

        // Collect the data chunks sent by the browser
        req.on('data', chunk => {
            body += chunk.toString();
        });

        // Process data once fully received
        req.on('end', () => {
            try {
                const { email, username, password } = JSON.parse(body);

                // Validation
                if (!email || !username || !password) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: "Missing required fields" }));
                    return;
                }

                // Read existing users
                fs.readFile(DB_PATH, 'utf8', (err, data) => {
                    let users = [];
                    if (!err && data) {
                        try { users = JSON.parse(data); } catch (e) { users = []; }
                    }

                    // Check for duplicates
                    const userExists = users.some(u => u.email === email || u.name === username);
                    if (userExists) {
                        res.writeHead(409, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: "User or Email already exists" }));
                        return;
                    }

                    // Create new user object
                    const newUser = {
                        id: "u" + (users.length + 1),
                        name: username,
                        email: email,
                        password: password, // Note: Consider hashing this in production!
                        premium: false
                    };

                    users.push(newUser);

                    // Write back to file
                    fs.writeFile(DB_PATH, JSON.stringify(users, null, 2), (writeErr) => {
                        if (writeErr) {
                            console.error("Database Write Error:", writeErr);
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ message: "Error saving user" }));
                            return;
                        }

                        // Success Response
                        console.log(`Registered new user: ${username}`);
                        res.writeHead(201, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: "Signup successful", user: newUser }));
                    });
                });

            } catch (parseError) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: "Invalid JSON data" }));
            }
        });
        return;
    }

    // Handle Premium Upgrade
    if (req.method === 'POST' && requestedPath === '/api/upgrade-premium') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                // We identify the user by the email sent from the client
                const { email } = JSON.parse(body);

                if (!email) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: "Email is required." }));
                    return;
                }

                // Read the database
                fs.readFile(DB_PATH, 'utf8', (err, data) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: "Database read error" }));
                        return;
                    }

                    let users = [];
                    try { users = JSON.parse(data); } catch (e) { users = []; }

                    // Find the user index
                    const userIndex = users.findIndex(u => u.email === email);

                    if (userIndex === -1) {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: "User not found." }));
                        return;
                    }

                    // UPDATE THE STATUS
                    users[userIndex].premium = true;

                    // Write back to file
                    fs.writeFile(DB_PATH, JSON.stringify(users, null, 2), (writeErr) => {
                        if (writeErr) {
                            console.error("Database Write Error:", writeErr);
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ message: "Error saving data" }));
                            return;
                        }

                        console.log(`User upgraded to Premium: ${users[userIndex].name}`);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            message: "Upgrade successful!",
                            user: users[userIndex]
                        }));
                    });
                });

            } catch (parseError) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: "Invalid JSON data" }));
            }
        });
        return; // Stop execution so static file handler doesn't run
    }

    // Static File Serving Logic
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

        if (stats.isDirectory()) {
            if (!requestedPath.endsWith('/')) {
                res.statusCode = 301;
                res.setHeader('Location', requestedPath + '/');
                res.end();
                return;
            } else {
                filePath = path.join(filePath, 'index.html');
            }
        }

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
