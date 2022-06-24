"use strict";
const fs = require('fs');
const b32 = require('hi-base32');
const crypto = require("hypercore-crypto");
const express = require("express");
const net = require("net");
const pump = require("pump");
const DHT = require("@hyperswarm/dht");
const node = new DHT({});

require('dotenv').config()

module.exports = () => {
  const hyperconfig = JSON.parse(fs.readFileSync('./site/hyperconfig.json'));
  console.log(hyperconfig);


  const app = express()
  const { createProxyMiddleware } = require('http-proxy-middleware');

  const router = JSON.parse(fs.readFileSync('./site/routerconfig.json'));
  const proxy = createProxyMiddleware({
    router,
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res)=>{
      proxyReq.setHeader('X-Forwarded-Host', req.hostname);
      proxyReq.setHeader('X-Forwarded-Proto', 'https');
    },
    ws: true
  });
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
    let port = hyperconfig[0].http|80;
    let sslport = hyperconfig[0].https|443;
    const done = async () => {
      for (let conf of hyperconfig) {
        const key = conf.key||crypto.randomBytes(size);
        const keyPair = crypto.keyPair(crypto.data(Buffer.from(key)));
        console.log(conf);
        if (conf.announce) {
          console.log("Announced:", conf.announce)
          const base = 1000 * 60 * 10;
          const random = parseInt(base * Math.random())
          const run = async () => {
            try {
              const hash = DHT.hash(Buffer.from(conf.announce))
              const keyPair = crypto.keyPair(crypto.data(Buffer.from(key)));
              await node.announce('hyperbolic'+hash, keyPair).finished();
              console.log("Announced:", conf.announce, new Date(), hash);
            } catch (e) { }
            setTimeout(run, base + random);
          }
          await run();
        }
        const b32pub = b32.encode(keyPair.publicKey).replace('====', '').toLowerCase();
        const server = node.createServer();
        server.on("connection", function (incoming) {
          incoming.once("data", function (data) {
            let outgoing;
            if (data == 'dns') {
              incoming.write(JSON.stringify(node.remoteAddress()));
              incoming.end();
            } else {
              if (data == 'http') {
                outgoing = net.connect(http, '127.0.0.1');
              }
              if (data == 'https') {
                outgoing = net.connect(https, '127.0.0.1');
              }
              pump(incoming, outgoing, incoming);
            }
          });
        });
        server.listen(keyPair);
        console.log('listening', b32pub);
        console.log('listening on https ' + https);
        console.log('listening on http ' + http);
      }
    }
    while (!https) {
      try {
        console.log('starting https', sslport);
        await (new Promise((res) => {
          glx.httpsServer(null, app).listen(sslport, "0.0.0.0", function () {
            https = sslport;
            if (http && https) done();
            res();
          });
        }))
      } catch (e) {
        sslport = 10240 + parseInt(Math.random() * 10240);
        console.error(e);
      }
      await new Promise(res => { setTimeout(res, 1000) });
    }
    while (!http) {
      try {
        console.log('starting http', port);
        await (new Promise((res) => {
          glx.httpServer().listen(port, "0.0.0.0", function () {
            http = port;
            if (http && https) done();
            res();
          });
        }))
      } catch (e) {
        port = 10240 + parseInt(Math.random() * 10240);
        console.error(e);
      }
      await new Promise(res => { setTimeout(res, 1000) });
    }
  }
}

