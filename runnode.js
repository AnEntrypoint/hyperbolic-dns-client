#! /usr/bin/env node
"use strict";
const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

console.log("Current directory:", __dirname);

const registerWebhook = async (data) => {
    const bearerToken = process.env.BEARER_TOKEN; // Get the token from environment variables
    const webhookUrl = process.env.WEBHOOK_URL;  // Get the webhook URL from environment variables

    try {
        const response = await axios.post(webhookUrl, data, {
            headers: {
                'Authorization': `Bearer ${bearerToken}`,
                'Content-Type': 'application/json'
            }
        });
        console.log("Registration successful:", response.data);
    } catch (error) {
        console.error("Error during registration:", error.response ? error.response.data : error.message);
    }
};

const run = () => {
    const hyperconfig = JSON.parse(fs.readFileSync('./hyperconfig.json'));
    
    // Register each configuration through the webhook
    for (let conf of hyperconfig) {
        const data = {
            name: conf, // Use `conf` or modify as needed to send what you need
            host: 'your-host-name', // Replace with real host or retrieve as needed
        };
        
        console.log("Registering...", data);
        registerWebhook(data);
    }
};

run();
