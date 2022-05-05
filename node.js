"use strict";
var b32 = require("hi-base32");
require('dotenv').config()
console.log(process.argv.length)

const serve = (key, port, secureport, addr) => {
      const keyPair = crypto.keyPair(crypto.data(Buffer.from(key)));
      const server = node.createServer();
      server.on("connection", function(servsock) {
        console.log('connection');
        servsock.once("data", function(data) {
          if(data == 'http') {
            socket = net.connect(port, addr);
          }
          if(data == 'https') {
            socket = net.connect(secureport, addr);
          }
          pump(servsock, socket, servsock);
        });

      });
      server.listen(keyPair);
      return keyPair.publicKey;
    }

const out = serve().serve(process.env.KEY, 2080, 2443, "127.0.0.1");
console.log('listening', b32.encode(out).replace('====','').toLowerCase());

var app = require("./app.js");
 
require("greenlock-express")
    .init({
      packageRoot: __dirname,
      configDir: "./greenlock.d",
      cluster: false
  })
    .ready(httpsWorker);

function httpsWorker(glx) {
    var httpsServer = glx.httpsServer(null, app);

    httpsServer.listen(2443, "0.0.0.0", function() {
        console.info("Listening on ", httpsServer.address());
    });

    var httpServer = glx.httpServer();

    httpServer.listen(2080, "0.0.0.0", function() {
        console.info("Listening on ", httpServer.address());
    });
}
