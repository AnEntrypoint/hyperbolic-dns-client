#!/usr/bin/env node
"use strict";
const fs = require('fs');
const crypto = require("hypercore-crypto");
const DHT = require("hyperdht");
const b32 = require('hi-base32');
const { announce } = require('hyper-ipc-secure')();
require('dotenv').config();

const node = new DHT();
const keyPair = crypto.keyPair();

const generateCaddyfile = (router) => {
    let caddyfileContent = `
{
    acme_email ${process.env.email || 'your-email@example.com'}  # Replace with your email for Let's Encrypt notifications
}

`;

    Object.entries(router).forEach(([host, target]) => {
        caddyfileContent += `${host} {\n`;
        caddyfileContent += `    reverse_proxy ${target}\n`;
        caddyfileContent += `}\n\n`;
    });

    return caddyfileContent;
};

const run = () => {
    const hyperconfig = JSON.parse(fs.readFileSync('../hyperconfig.json'));
    const router = JSON.parse(fs.readFileSync('../routerconfig.json'));
    const config = JSON.parse(fs.readFileSync('./site/config.json'));

    // Update the config if needed (Optional)
    config.sites.push(...Object.keys(router).filter(site => !config.sites.some(a => a.subject === site)).map(site => ({ subject: site })));
    fs.writeFileSync('./site/config.json', JSON.stringify(config));

    // Define the path for the Caddyfile
    const caddyfilePath = '/home/coder/Caddyfile';

    // Check if the Caddyfile already exists
    if (fs.existsSync(caddyfilePath)) {
        console.log(`Caddyfile already exists at ${caddyfilePath}. Skipping generation.`);
        return; // Skip generation if the file exists
    }

    // Generate the Caddyfile content
    const caddyfileContent = generateCaddyfile(router);
    
    // Write the Caddyfile to /home/coder/Caddyfile
    fs.writeFileSync(caddyfilePath, caddyfileContent.trim(), 'utf8');
    console.log(`Caddyfile generated at ${caddyfilePath}`);

    // Start the DHT node and announce
    node.ready().then(() => {
        for (let conf of hyperconfig) {
            console.log("ANNOUNCING", conf);
            announce('hyperbolic' + conf, keyPair);
            const b32pub = b32.encode(keyPair.publicKey).replace(/=/g, '').toLowerCase();

            const server = node.createServer();
            server.on("connection", incoming => {
                incoming.once("data", data => {
                    if (data == 'dns') {
                        incoming.write(JSON.stringify({ host: node.host }));
                        incoming.end();
                    }
                });
            });
            server.listen(keyPair);
            console.log('listening', b32pub);
        }
    });
};

run();
