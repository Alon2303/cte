require('dotenv').config();
const axios = require('axios');
const QRCode = require('qrcode');
const https = require('https');

// Create an HTTPS agent with SSL verification disabled
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const clientId = process.env.CLIENT_ID; // Use the client ID from environment variables

const IP = '192.168.1.121';

const deviceVerificationEndpoint = `https://${IP}:3000/device/code`;
const tokenEndpoint = `https://${IP}:3000/token`;

async function requestDeviceCode() {
    try {
        const response = await axios.post(deviceVerificationEndpoint, {
            client_id: clientId,
            scope: process.env.SCOPE // Use the scope from environment variables
        }, { httpsAgent });

        const { device_code, user_code, verification_uri, verification_uri_complete, interval } = response.data;

        console.log('Please visit:', verification_uri);
        console.log('And enter the code:', user_code);

        // Generate QR code
        const qrCodeData = await QRCode.toDataURL(verification_uri_complete);
        console.log('Scan this QR code to authorize:');
        console.log(qrCodeData);

        return { device_code, interval };
    } catch (error) {
        console.error('Error requesting device code:', error.response ? error.response.data : error.message);
    }
}

async function pollForToken(device_code, interval) {
    try {
        while (true) {
            await new Promise(resolve => setTimeout(resolve, interval * 1000));

            const response = await axios.post(tokenEndpoint, {
                client_id: clientId,
                device_code: device_code,
                grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
            }, { httpsAgent });

            if (response.data.access_token) {
                console.log('Access token:', response.data.access_token);
                console.log('User claims:', response.data.user_claims);
                break;
            } else if (response.data.error) {
                if (response.data.error === 'authorization_pending') {
                    console.log('Authorization pending...');
                } else if (response.data.error === 'slow_down') {
                    console.log('Slowing down...');
                    interval += 5;
                } else {
                    console.error('Error:', response.data.error);
                    break;
                }
            }
        }
    } catch (error) {
        console.error('Error polling for token:', error.response ? error.response.data : error.message);
    }
}

(async () => {
    const { device_code, interval } = await requestDeviceCode();
    await pollForToken(device_code, interval);
})();
