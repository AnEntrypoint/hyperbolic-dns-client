#! /usr/bin/env node
"use strict";
const fs = require('fs');
const crypto = require("hypercore-crypto");
const DHT = require("hyperdht");
const { announce } = require('hyper-ipc-secure')();
require('dotenv').config();
const b32 = require('hi-base32');

console.log("Current directory:", __dirname);
const node = new DHT();
const keyPair = crypto.keyPair();

const registerSubdomain = async (subdomain) => {
    const topic = Buffer.from(`hyperbolic${subdomain}`);
    const subdomainData = {
        publicKey: keyPair.publicKey,
        createdAt: Date.now(),
        subdomain: subdomain
    };

    // Announce the subdomain to the DHT
    try {
        await node.mutablePut(keyPair, Buffer.from(JSON.stringify(subdomainData)));
        announce(subdomain, keyPair);
        console.log(`Subdomain "${subdomain}" registered with key pair: ${b32.encode(keyPair.publicKey).replace(/=/g, '').toLowerCase()}`);
    } catch (error) {
        console.error(`Failed to register subdomain "${subdomain}":`, error);
    }
};

const run = async () => {
    const hyperconfig = JSON.parse(fs.readFileSync('./hyperconfig.json'));

    Node.ready().then(async () => {
        for (let conf of hyperconfig) {
            console.log("Announcing configuration for:", conf);
            await registerSubdomain(conf);
        }
    }).catch(console.error);
};

run();
