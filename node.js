"use strict";

const fs = require('fs');
const b32 = require('hi-base32');
const crypto = require("hypercore-crypto");
const express = require("express");
const net = require("net");
const pump = require("pump");
const DHT = require("@hyperswarm/dht");
const node = new DHT({});
const tcpPortUsed = require("tcp-port-used");
require('dotenv').config()

module.exports = (key, target, preferredport, preferredsslport) => {
  let port = preferredport;
  let sslport = preferredsslport;

  console.log('node config', { key, target, port, sslport });
  const app = express()
  const { createProxyMiddleware } = require('http-proxy-middleware');
  const proxy = createProxyMiddleware({ target, changeOrigin: true, ws: true });
  app.use('/', proxy);
  require("greenlock-express")
    .init({
      packageRoot: __dirname,
      configDir: "./site/",
      maintainerEmail: "jon@example.com",
      cluster: false
    }).ready(httpsWorker);
  async function httpsWorker(glx) {
    let https = 0;
    let http = 0;
    const done = () => {
      if (!key) return;
      const keyPair = crypto.keyPair(crypto.data(Buffer.from(key)));
      const b32pub = b32.encode(keyPair.publicKey).replace('====', '').toLowerCase();
      const server = node.createServer();
      server.on("connection", function (incoming) {
        console.log('connection');
        incoming.once("data", function (data) {
          let outgoing;
          if (data == 'http') {
            outgoing = net.connect(http, '127.0.0.1');
          }
          if (data == 'https') {
            outgoing = net.connect(https, '127.0.0.1');
          }
          pump(incoming, outgoing, incoming);
        });
      });
      server.listen(keyPair);
      console.log('listening', b32pub);
    }
    while (await tcpPortUsed.check(port)) {
      port = 10240 + parseInt(Math.random() * 10240);
    }
    while (await tcpPortUsed.check(sslport)) sslport = 10240 + parseInt(Math.random() * 10240);

    var httpsServer = glx.httpsServer(null, app);
    console.log('starting https', sslport);
    httpsServer.listen(sslport, "0.0.0.0", function () {
      https = sslport;
      if (http && https) done();
    });
    var httpServer = glx.httpServer();
    console.log('starting http', port);
    httpServer.listen(port, "0.0.0.0", function () {
      http = port;
      if (http && https) done();
    });

    await new Promise(res => { setTimeout(res, 1000) });
  }
}
