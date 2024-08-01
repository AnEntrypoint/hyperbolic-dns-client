#! /usr/bin/env node
"use strict";
const fs = require('fs');
const express = require("express");
const compression = require("compression");
const crypto = require("hypercore-crypto");
const net = require("net");
const pump = require("pump");
const DHT = require("hyperdht");
const b32 = require('hi-base32');
const { announce } = require('hyper-ipc-secure')();
require('dotenv').config();

const node = new DHT();
const keyPair = crypto.keyPair();

const run = () => {
  const hyperconfig = JSON.parse(fs.readFileSync('../hyperconfig.json'));
  const router = JSON.parse(fs.readFileSync('../routerconfig.json'));
  const config = JSON.parse(fs.readFileSync('./site/config.json'));

  config.sites.push(...Object.keys(router).filter(site => !config.sites.some(a => a.subject === site)).map(site => ({ subject: site })));
  fs.writeFileSync('./site/config.json', JSON.stringify(config));

  const app = express();
  app.use(compression()); // Enable compression
  const proxy = require('http-proxy-middleware').createProxyMiddleware({
    router,
    changeOrigin: false,
    secure: false,
    onProxyReq: (proxyReq, req) => {
      proxyReq.setHeader('X-Forwarded-Host', req.hostname);
      proxyReq.setHeader('X-Forwarded-Proto', 'https');
    },
    onProxyRes: (proxyRes) => {
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    },
    ws: true
  });

  app.use('/', proxy);
  console.log({email: process.env.email});
  require("greenlock-express").init({
    packageRoot: __dirname,
    configDir: "./site/",
    maintainerEmail: process.env.email || 'jon@example.com',
    cluster: false
  }).ready(startServers);

  async function startServers(glx) {
    const [port, sslport] = [80, 443];
    let [httpsRunning, httpRunning] = [false, false];

    const startServer = (serverFunc, port) => new Promise(res => serverFunc().listen(port, "0.0.0.0", () => res(port)));

    const https = await startServer(() => glx.httpsServer(null, app), sslport);
    httpsRunning = true;

    const http = await startServer(glx.httpServer, port);
    httpRunning = true;

    if (httpsRunning && httpRunning) {
      console.log("HTTP AND HTTPS STARTED");

      await node.ready();
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
            } else {
              let outgoing = net.connect(data == 'http' ? http : https, '127.0.0.1');
              pump(incoming, outgoing, incoming);
            }
          });
        });
        server.listen(keyPair);
        console.log('listening', b32pub);
      }
    }
  }
}
run()
