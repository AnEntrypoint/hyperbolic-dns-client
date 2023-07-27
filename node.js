"use strict";
const fs = require('fs');
const b32 = require('hi-base32');
const crypto = require("hypercore-crypto");
const express = require("express");
const net = require("net");
const pump = require("pump");
const DHT = require("@hyperswarm/dht");
const node = new DHT({});
const { announce, lookup } = require('../discovery.js');

require('dotenv').config()

module.exports = () => {
  const announces = [];
  const hyperconfig = JSON.parse(fs.readFileSync('../hyperconfig.json'));
  //console.log(hyperconfig);
  const keyPair = crypto.keyPair();


  const app = express()
  const { createProxyMiddleware } = require('http-proxy-middleware');

  const router = JSON.parse(fs.readFileSync('../routerconfig.json'));
  const config = JSON.parse(fs.readFileSync('./site/config.json'));
  let changed;
  for (let site of Object.keys(router)) {
    //console.log(site, config.sites, config.sites.filter(a => a.subject === site).length);
    if (!config.sites.filter(a => a.subject === site).length) {
      config.sites.push({ subject: site });
      changed = true;
    }
  }
  if (changed) fs.writeFileSync('./site/config.json', JSON.stringify(config));
  const proxy = createProxyMiddleware({
    router,
    changeOrigin: false,
    secure: false,
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('X-Forwarded-Host', req.hostname);
      proxyReq.setHeader('X-Forwarded-Proto', 'https'); 
    },
    onProxyRes: (proxyRes, req, res) => {

      proxyRes.headers['Cross-Origin-Resource-Policy'] = 'cross-site';
      //proxyRes.headers['Cross-Origin-Opener-Policy'] = 'same-origin';
      //proxyRes.headers['Cross-Origin-Embedder-Policy'] = 'require-corp';
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
    let port = 80;
    let sslport = 443;
    const done = async () => {
      await node.ready();
      for (let conf of hyperconfig) {
<<<<<<< HEAD
        announce('hyperbolic' + conf, keyPair);
=======
        console.log(conf);
        if (conf) {
          const base = 1000 * 60 * 15;
          const random = parseInt(base * Math.random())
          const run = async () => {
            try {
              const hash = DHT.hash(Buffer.from('hyperbolic'+conf))
              console.log("Announcing:", 'hyperbolic'+conf, new Date(), hash);
              await node.announce(hash, keyPair).finished();
              for(ann in announces) {
                if(new Date().getTime() - ann.time > 1800000) delete announces[ann];
              }
              announces.push({hash, keyPair, time:new Date().getTime()})
              console.log("Announced:", 'hyperbolic'+conf, new Date(), hash);
            } catch (e) { 
              console.log(e);
            }
            setTimeout(run, base + random);
          }
          await run();
        }
>>>>>>> 05a4360ead8e18e00b96d3817db9684eb64b1809
        const b32pub = b32.encode(keyPair.publicKey).replace('====', '').toLowerCase();
        const server = node.createServer();
        server.on("connection", function (incoming) {
          incoming.once("data", function (data) {
            let outgoing;
            if (data == 'dns') {
              incoming.write(JSON.stringify({host:node.host}));
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
            if (http && https) {
              console.log("HTTP AND HTTP STARTED")
              done();
              
            }
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


  const unannounce = async ()=>{
    for(let ann of announces) {
      await node.announce(ann.hash, ann.keyPair).finished();
    }
  }
  
  process.on("beforeExit", async (code) => {
    await unannounce();
    console.log("Process beforeExit event with code: ", code);
  });
  
  process.on("exit", async (code) => {
    await unannounce();
    console.log("Process exit event with code: ", code);
  });
  
  process.on("SIGTERM", async (signal) => {
    await unannounce();
    console.log(`Process ${process.pid} received a SIGTERM signal`);
    process.exit(0);
  });
  
  process.on("SIGINT", async (signal) => {
    await unannounce();
    console.log(`Process ${process.pid} has been interrupted`);
    process.exit(0);
  });
  
  process.on("uncaughtException", async (err) => {
    await unannounce();
    console.error(`Uncaught Exception: ${err.message}`);
    process.exit(1);
  });
 
}

