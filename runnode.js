#! /usr/bin/env node
"use strict";
const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

console.log("Current directory:", __dirname);

const getPublicIP = async () => {
    console.debug("Attempting to fetch public IP...");
    try {
        const response = await axios.get('https://icanhazip.com');
        console.debug("Public IP fetched successfully:", response.data.trim());
        return response.data.trim();  // Remove any extra whitespace/newline
    } catch (error) {
        console.error("Error fetching public IP:", error.message);
        return null;  // Return null in case of error
    }
};

const registerWebhook = async (subdomain, publicIp) => {
    const webhookUrl = process.env.WEBHOOK_URL;  // Get the webhook URL from environment variables
    console.debug("Preparing to register webhook for subdomain:", subdomain.name);

    // Prepare data for registration
    const data = {
        name: process.env.SUBDOMAIN, // Subdomain name from the config
        host: publicIp, // Use the public IP address
    };

    const token = process.env.BEARER_TOKEN; // Get Bearer token from environment variables
    console.debug("Using webhook URL:", webhookUrl);
    console.debug("Using Bearer token:", token ? "Provided" : "Not provided");

    try {
        const response = await axios.post(webhookUrl, data, {
            headers: {
                Authorization: `Bearer ${token}`, // Set the Authorization header
            }
        });
        console.log(`Registration successful for ${subdomain.name}:`, response.data);
    } catch (error) {
        console.error(`Error during registration for ${subdomain.name}:`, error.response ? error.response.data : error.message);
    }
};

const run = async () => {
    console.debug("Loading hyperconfig from JSON file...");
    const hyperconfig = JSON.parse(fs.readFileSync('./hyperconfig.json'));
    console.debug("Hyperconfig loaded:", hyperconfig);

    // Get the public IP address
    const publicIp = await getPublicIP();

    // If we couldn't get an IP, exit
    if (!publicIp) {
        console.error("Could not retrieve public IP address. Exiting...");
        return;
    }

    // Register each configuration initially
    for (const subdomain of hyperconfig) {
        console.debug("Registering subdomain:", subdomain.name);
        await registerWebhook(subdomain, publicIp);
    }

    // Periodically re-register each subdomain every minute
    setInterval(async () => {
        console.log("Re-registering...");
        const newPublicIp = await getPublicIP(); // Fetch the public IP again

        if (newPublicIp) {
            console.debug("New public IP retrieved:", newPublicIp);
            for (const subdomain of hyperconfig) {
                console.debug("Re-registering subdomain:", subdomain.name);
                await registerWebhook(subdomain, newPublicIp);
            }
        } else {
            console.error("Could not retrieve public IP address during re-registration.");
        }
    }, 60 * 1000); // 60 * 1000 milliseconds = 1 minute
};

run();
