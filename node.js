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

module.exports = (key, target)=>{
    const app = express()
    const { createProxyMiddleware } = require('http-proxy-middleware');
    const proxy = createProxyMiddleware({target, changeOrigin: true, ws: true});
    app.use('/', proxy);

    require("greenlock-express")
      .init({
        packageRoot: __dirname,
        configDir: "./greenlock.d",
        cluster: false
    }).ready(httpsWorker);

    async function httpsWorker(glx) {
      let https = 0;
      let http = 0;
      const done = ()=>{
            const out = serve().serve(process.env.KEY, http, https, "127.0.0.1");
            console.log('listening', b32.encode(out).replace('====','').toLowerCase());
      }
      var httpsServer = glx.httpsServer(null, app);
      while(!http) {
            try {
                  let port = 10240+parseInt(Math.random()*10240);
                  httpsServer.listen(port, "0.0.0.0", function() {
                      console.info("Listening on ", httpsServer.address());
                      done();
                  });
            } catch(e) {
                  console.error(e);
                  await new Promise(res=>{setTimeout(res, 1000)});
            }
      }

      var httpServer = glx.httpServer();
      while(!https) {
        try {
              let port = 10240+parseInt(Math.random()*10240);
              httpServer.listen(http, "0.0.0.0", function() {
                  console.info("Listening on ", httpServer.address());
                  done();
              });
        } catch(e) {
              console.error(e);
              await new Promise(res=>{setTimeout(res, 1000)});
        }

      }

    }
}
