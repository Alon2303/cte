require('dotenv').config();
const https = require('https');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require("path");

// Load SSL certificate
const privateKey = fs.readFileSync(path.join(__dirname, 'server.key'), 'utf8');
const certificate = fs.readFileSync(path.join(__dirname, 'server.cert'), 'utf8');
const ca = fs.readFileSync(path.join(__dirname, 'rootCA.pem'), 'utf8');
const credentials = { key: privateKey, cert: certificate, ca: ca };

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = 3000;
const CLIENT_ID = process.env.CLIENT_ID;
const SCOPE = process.env.SCOPE;
const IP = '192.168.1.121';
const devices = {};
const tokens = {};

// Simulated user claims
const userClaims = {
    username: 'testuser',
    email: 'testuser@example.com',
    roles: ['user']
};

// CORS policy
const corsOptions = {
    origin: 'http://your-allowed-origin.com', // Replace with your client app's URL
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Endpoint to request device code
app.post('/device/code', (req, res) => {
    const { client_id, scope } = req.body;
    if (client_id !== CLIENT_ID || scope !== SCOPE) {
        console.error('Invalid client_id or scope', { client_id, scope });
        return res.status(400).json({ error: 'invalid_request' });
    }

    const device_code = uuidv4();
    const user_code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const verification_uri = `https://${IP}:${PORT}/device/auth`;
    const verification_uri_complete = `${verification_uri}?user_code=${user_code}`;
    const interval = 5;

    devices[device_code] = { user_code, verification_uri, authorized: false };

    res.json({
        device_code,
        user_code,
        verification_uri,
        verification_uri_complete,
        interval
    });
});

// Endpoint to display the form to enter the user code
app.get('/device/auth', (req, res) => {
    res.send(`
        <form action="/device/auth" method="POST">
            <label for="user_code">Enter the code:</label>
            <input type="text" id="user_code" name="user_code" required />
            <button type="submit">Authorize</button>
        </form>
    `);
});

// Endpoint to handle the form submission and authorize the device
app.post('/device/auth', (req, res) => {
    const { user_code } = req.body;
    const device = Object.values(devices).find(d => d.user_code === user_code);

    if (!device) {
        return res.status(400).send('Invalid user code.');
    }

    device.authorized = true;

    // Show QR code to user to scan
    const verification_uri_complete = `https://${IP}:${PORT}/device/verify?user_code=${user_code}`;
    res.send(`
        <p>Device authorized. Please scan the QR code below to complete the process:</p>
        <img src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(verification_uri_complete)}&size=150x150" />
    `);
});

// Endpoint to verify the authorization after scanning the QR code
app.get('/device/verify', (req, res) => {
    const { user_code } = req.query;
    const device = Object.values(devices).find(d => d.user_code === user_code);

    if (!device) {
        return res.status(400).send('Invalid user code.');
    }

    const access_token = uuidv4();
    tokens[access_token] = { device_code: device.device_code, user_claims: userClaims };

    res.send(`
        <p>Device verification complete. You can close this window.</p>
        <p>Your access token: ${access_token}</p>
        <p>Your user claims:</p>
        <pre>${JSON.stringify(userClaims, null, 2)}</pre>
    `);
});

// Endpoint to request the access token
app.post('/token', (req, res) => {
    const { client_id, device_code, grant_type } = req.body;
    if (client_id !== CLIENT_ID || grant_type !== 'urn:ietf:params:oauth:grant-type:device_code') {
        console.error('Invalid client_id, device_code, or grant_type', { client_id, device_code, grant_type });
        return res.status(400).json({ error: 'invalid_request' });
    }

    const device = devices[device_code];
    if (!device) {
        return res.status(400).json({ error: 'invalid_grant' });
    }

    if (!device.authorized) {
        return res.status(400).json({ error: 'authorization_pending' });
    }

    const access_token = uuidv4();
    tokens[access_token] = { device_code };

    res.json({ access_token, user_claims: userClaims });
});

// Create HTTPS server
const httpsServer = https.createServer(credentials, app);

httpsServer.listen(PORT, '0.0.0.0', () => {
    console.log(`OAuth provider listening at https://${IP}:${PORT}`);
});
