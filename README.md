# OAuth Device Flow Implementation

This project demonstrates an OAuth Device Flow implementation using Node.js, Express, and Axios. It includes both the OAuth server (`auth-service.js`) and the client (`notification-service.js`). The project also includes SSL configuration for secure communication and various security measures.

## Table of Contents

- [Architecture](#architecture)
- [Flow](#flow)
- [Security Measures](#security-measures)
- [Setup](#setup)
- [Running the Services](#running-the-services)

## Architecture

The architecture consists of two main components:

1. **OAuth Server (`auth-service.js`)**:
   - Handles device authorization and token issuance.
   - Implements endpoints for device code generation, user code verification, and token requests.
   - Uses HTTPS for secure communication.

2. **OAuth Client (`notification-service.js`)**:
   - Requests device codes and polls for tokens.
   - Communicates with the OAuth server using Axios.
   - Disables SSL verification for development purposes (not recommended for production).

## Flow

1. **Device Code Request**:
   - The client requests a device code from the OAuth server.
   - The server responds with a device code, user code, verification URI, and polling interval.

2. **User Authorization**:
   - The user visits the verification URI and enters the user code.
   - The server verifies the user code and displays a QR code for the user to scan.
   - The user scans the QR code to complete the authorization.

3. **Token Request**:
   - The client polls the OAuth server for an access token using the device code.
   - The server responds with an access token and user claims once the device is authorized.

## Security Measures

1. **HTTPS**:
   - The server uses HTTPS to encrypt communication.
   - Self-signed certificates are used for development, with SSL verification disabled on the client side.

2. **Environment Variables**:
   - Sensitive information such as client IDs and scopes are stored in environment variables.

3. **CORS Policy**:
   - The server implements a strict CORS policy to control which domains can access the API.

4. **Rate Limiting**:
   - The server uses rate limiting to protect against abuse and denial-of-service attacks.

## Setup

1. **Install Dependencies**:
   ```bash
   npm install

## Run The services

1. ```bash
   node auth-service.js

2. ```
   node notification-service.js
