#! /usr/bin/env node
"use strict";
const fs = require('fs');
const crypto = require("hypercore-crypto");
const DHT = require("hyperdht");
const b32 = require('hi-base32');
const { announce } = require('hyper-ipc-secure')();
require('dotenv').config();

const node = new DHT();
const keyPair = crypto.keyPair();

const run = () => {
    const hyperconfig = JSON.parse(fs.readFileSync('../hyperconfig.json'));
    
    // Start the DHT node and announce
    node.ready().then(() => {
        for (let conf of hyperconfig) {
            console.log("ANNOUNCING", conf);
            announce('hyperbolic' + conf, keyPair);
            const b32pub = b32.encode(keyPair.publicKey).replace(/=/g, '').toLowerCase();

            const server = node.createServer();
            server.on("connection", incoming => {
                incoming.once("data", data => {
                    if (data === 'dns') {
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
