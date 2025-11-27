// scripts/refresh-instagram-token.js
// Refreshes Instagram long-lived access token (valid for 60 days)
// Run this script periodically (e.g., every 30 days) via cron job or scheduled task

const fs = require('fs');
const path = require('path');
const https = require('https');

const INSTAGRAM_REFRESH_URL = 'https://graph.instagram.com/refresh_access_token';
const ENV_FILE_PATH = path.join(__dirname, '..', '.env.local');
const TOKEN_STORE_PATH = path.join(__dirname, 'instagram-token.json');

/**
 * Simple fetch wrapper using https module (to avoid external dependencies)
 */
function fetchJson(url) {
    return new Promise((resolve, reject) => {
        // Handle SSL certificate errors in development
        const options = {
            rejectUnauthorized: process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0'
        };

        https.get(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(json);
                    } else {
                        reject(new Error(`Request failed with status ${res.statusCode}: ${JSON.stringify(json)}`));
                    }
                } catch (e) {
                    reject(new Error(`Failed to parse response: ${e.message}`));
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

/**
 * Refresh a long-lived Instagram access token
 * @param {string} currentToken - Current long-lived access token
 * @returns {Promise<{access_token: string, token_type: string, expires_in: number}>}
 */
async function refreshLongLivedToken(currentToken) {
    const url = `${INSTAGRAM_REFRESH_URL}?grant_type=ig_refresh_token&access_token=${encodeURIComponent(currentToken)}`;

    console.log('Refreshing Instagram access token...');
    return fetchJson(url);
}

/**
 * Load current token from .env.local file
 * @returns {string|null}
 */
function loadCurrentTokenFromEnv() {
    if (!fs.existsSync(ENV_FILE_PATH)) {
        console.error('.env.local file not found');
        return null;
    }

    const envContent = fs.readFileSync(ENV_FILE_PATH, 'utf8');
    const match = envContent.match(/^IG_ACCESS_TOKEN=(.+)$/m);

    if (!match) {
        console.error('IG_ACCESS_TOKEN not found in .env.local');
        return null;
    }

    return match[1].trim();
}

/**
 * Update token in .env.local file
 * @param {string} newToken
 */
function updateTokenInEnv(newToken) {
    let envContent = fs.readFileSync(ENV_FILE_PATH, 'utf8');

    // Replace the IG_ACCESS_TOKEN line
    envContent = envContent.replace(
        /^IG_ACCESS_TOKEN=.+$/m,
        `IG_ACCESS_TOKEN=${newToken}`
    );

    fs.writeFileSync(ENV_FILE_PATH, envContent, 'utf8');
    console.log('✅ Updated IG_ACCESS_TOKEN in .env.local');
}

/**
 * Save token metadata to JSON file for tracking
 * @param {object} tokenData
 */
function saveTokenMetadata(tokenData) {
    const metadata = {
        access_token: tokenData.access_token.substring(0, 20) + '...', // Store partial for reference
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
        expires_at: Math.floor(Date.now() / 1000 + tokenData.expires_in),
        refreshed_at: new Date().toISOString(),
    };

    fs.writeFileSync(TOKEN_STORE_PATH, JSON.stringify(metadata, null, 2), 'utf8');
    console.log('✅ Saved token metadata to', TOKEN_STORE_PATH);
}

/**
 * Load token metadata from JSON file
 * @returns {object|null}
 */
function loadTokenMetadata() {
    if (!fs.existsSync(TOKEN_STORE_PATH)) {
        return null;
    }

    try {
        const content = fs.readFileSync(TOKEN_STORE_PATH, 'utf8');
        return JSON.parse(content);
    } catch (err) {
        console.error('Error reading token metadata:', err);
        return null;
    }
}

/**
 * Check if token needs refresh
 * @param {number} daysThreshold - Refresh if less than this many days left
 * @returns {boolean}
 */
function shouldRefreshToken(daysThreshold = 30) {
    const metadata = loadTokenMetadata();

    if (!metadata || !metadata.expires_at) {
        console.log('⚠️  No token metadata found - will attempt refresh');
        return true;
    }

    const now = Math.floor(Date.now() / 1000);
    const daysLeft = (metadata.expires_at - now) / 86400;

    console.log(`Token expires in ${Math.round(daysLeft)} days`);

    if (daysLeft <= daysThreshold) {
        console.log(`⚠️  Token expires soon (< ${daysThreshold} days) - refreshing...`);
        return true;
    }

    console.log(`✅ Token is still valid (${Math.round(daysLeft)} days left)`);
    return false;
}

/**
 * Main function to refresh Instagram token
 */
async function run() {
    try {
        console.log('=== Instagram Token Refresh Script ===\n');

        // Check if refresh is needed
        if (!shouldRefreshToken(30)) {
            console.log('\n✅ No refresh needed at this time');
            return;
        }

        // Load current token
        const currentToken = loadCurrentTokenFromEnv();
        if (!currentToken) {
            throw new Error('Could not load current token from .env.local');
        }

        console.log('Current token loaded (length:', currentToken.length, 'chars)');

        // Refresh the token
        const refreshed = await refreshLongLivedToken(currentToken);

        if (!refreshed.access_token) {
            throw new Error('Refresh response did not include access_token');
        }

        console.log('✅ Token refreshed successfully');
        console.log('New token expires in:', refreshed.expires_in, 'seconds (~', Math.round(refreshed.expires_in / 86400), 'days)');

        // Update .env.local
        updateTokenInEnv(refreshed.access_token);

        // Save metadata
        saveTokenMetadata(refreshed);

        console.log('\n✅ Token refresh completed successfully!');
        console.log('⚠️  Remember to restart your Next.js dev server to use the new token');

    } catch (err) {
        console.error('\n❌ Token refresh failed:', err.message);
        console.error('\nPlease check:');
        console.error('1. Your current token is valid');
        console.error('2. You have internet connectivity');
        console.error('3. The Instagram API is accessible');
        process.exit(1);
    }
}

// Run if called directly
run();
