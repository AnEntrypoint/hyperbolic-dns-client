#! /usr/bin/env node
"use strict";
const fs = require('fs');
const axios = require('axios');
const ip = require('ip'); // Importing the ip package
require('dotenv').config();

console.log("Current directory:", __dirname);

const registerWebhook = async (subdomain) => {
    const webhookUrl = process.env.WEBHOOK_URL;  // Get the webhook URL from environment variables

    // Get the client's local IP address
    const localIp = ip.address(); // Retrieve local IP address

    // Prepare data for registration
    const data = {
        name: subdomain.name, // Subdomain name from the config
        host: localIp, // Use the local IP address
    };

    try {
        const response = await axios.post(webhookUrl, data);
        console.log(`Registration successful for ${subdomain.name}:`, response.data);
    } catch (error) {
        console.error(`Error during registration for ${subdomain.name}:`, error.response ? error.response.data : error.message);
    }
};

const run = () => {
    // Load hyperconfig from a JSON file
    const hyperconfig = JSON.parse(fs.readFileSync('./hyperconfig.json'));
    
    // Register each configuration initially
    hyperconfig.forEach(subdomain => {
        registerWebhook(subdomain);
    });

    // Periodically re-register each subdomain every minute
    setInterval(() => {
        console.log("Re-registering...");
        hyperconfig.forEach(subdomain => {
            registerWebhook(subdomain);
        });
    }, 60 * 1000); // 60 * 1000 milliseconds = 1 minute
};

run();
