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

module.exports = (key, target)=>{
    console.log({key, target});
    const app = express()
    const { createProxyMiddleware } = require('http-proxy-middleware');
    const proxy = createProxyMiddleware({target, changeOrigin: true, ws: true});
    app.use('/', proxy);
    const keyPair = crypto.keyPair(crypto.data(Buffer.from(key)));
    const b32pub = b32.encode(keyPair.publicKey).replace('====','').toLowerCase();
    require("greenlock-express")
      .init({
        packageRoot: __dirname,
        configDir: "./sites/"+b32pub,
        maintainerEmail: "jon@example.com",
        cluster: false
    }).ready(httpsWorker);
    async function httpsWorker(glx) {
      let https = 0;
      let http = 0;
      const done = ()=>{
            const server = node.createServer();
            server.on("connection", function(incoming) {
              console.log('connection');
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
      }
      var httpsServer = glx.httpsServer(null, app);
      while(!https) {
            try {
                  let port = 10240+parseInt(Math.random()*10240);
                  httpsServer.listen(port, "0.0.0.0", function() {
                      if(http && https) done();
                      https = port;
                      console.log('listening on https '+https);
                  });
            } catch(e) {
                  console.error(e);
            }
            await new Promise(res=>{setTimeout(res, 1000)});
      }
      var httpServer = glx.httpServer();
      while(!http) {
        try {
              let port = 10240+parseInt(Math.random()*10240);
              httpServer.listen(http, "0.0.0.0", function() {
                  if(http && https) done();
                  http = port;
                  console.log('listening on http '+http);
              });
        } catch(e) {
              console.error(e);
        }
        await new Promise(res=>{setTimeout(res, 1000)});
      }
    }
}
