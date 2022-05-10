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

module.exports = ()=>{
    const hyperconfig = JSON.parse(fs.readFileSync('./site/hyperconfig.json'));
    let port = hyperconfig.http;
    let sslport = hyperconfig.https;
    const app = express()
    const { createProxyMiddleware } = require('http-proxy-middleware');
    
    const router = JSON.parse(fs.readFileSync('./site/routerconfig.json'));
    const proxy = createProxyMiddleware({
      router,
      changeOrigin: true,
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
      const done = ()=>{
            for(let conf of hyperconfig) {
                const key = conf.key
                const keyPair = crypto.keyPair(crypto.data(Buffer.from(key)));
                const b32pub = b32.encode(keyPair.publicKey).replace('====','').toLowerCase();
                const server = node.createServer();
                server.on("connection", function(incoming) {
                  incoming.once("data", function(data) {
                    let outgoing;
                    if(data == 'http') {
                      outgoing = net.connect(http, '127.0.0.1');
                    }
                    if(data == 'https') {
                      outgoing = net.connect(https, '127.0.0.1');
                    }
                    pump(incoming, outgoing, incoming);
                  });
                });
                server.listen(keyPair);
                console.log('listening', b32pub);
                console.log('listening on https '+https);
                console.log('listening on http '+http);
            }
      }
      var httpsServer = glx.httpsServer(null, app);
      while(!https) {
        try {
              console.log('starting https', sslport);
              await (new Promise((res)=>{
                  httpsServer.listen(sslport, "0.0.0.0", function() {
                      https = sslport;
                      if(http && https) done();
                      res();
                  });
              }))
        } catch(e) {
          port = 10240+parseInt(Math.random()*10240);
          console.error(e);
        }
        await new Promise(res=>{setTimeout(res, 1000)});
      }
      var httpServer = glx.httpServer();
      while(!http) {
        try {
          console.log('starting http', port);
          await (new Promise((res)=>{
              httpServer.listen(port, "0.0.0.0", function() {
                  http = port;
                  if(http && https) done();
                  res();
              });
          }))
        } catch(e) {
            port = 10240+parseInt(Math.random()*10240);
            console.error(e);
        }
        await new Promise(res=>{setTimeout(res, 1000)});
      }
    }
}
