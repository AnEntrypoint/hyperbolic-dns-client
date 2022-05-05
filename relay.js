const sni = require("sni");
const net = require("net");
const b32 = require("hi-base32");
const DHT = require("@hyperswarm/dht");
const pump = require('pump')
const node = new DHT({});

const http = require('http');
const httpProxy = require('http-proxy');

let mod = 0;
const tunnels = {};
var proxy = httpProxy.createProxyServer({
  timeout: 360000
});
const doServer = async function (req, res) {
  if(!req.headers.host) return;
  const split = req.headers.host.split('.');
  const publicKey = await getKey(split[split.length-3]);
  if (!tunnels[publicKey]) {
    const port = 1337 + ((mod++) % 1000);
    try {
        var server = net.createServer(function (local) {
          const socket = node.connect(publicKey);
          socket.write('http');
          pump(local, socket, local);
        });
        server.listen(port, "127.0.0.1");
        tunnels[publicKey] = port;
        target = 'http://127.0.0.1:' + port;
      } catch(e) {
        console.trace(e);
        console.error(e);
      }
  } else {
    target = 'http://127.0.0.1:' + tunnels[publicKey]
  }
  proxy.web(req, res, {
    target
  }, function (e) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Cannot reach node ' + e.message);
  });

}
var server = http.createServer(doServer);
server.listen(80);
const getKey = (name)=>{
  let publicKey;
  let decoded = '';
  try {decoded = b32.decode.asBytes(name.toUpperCase())} catch (e) {
          console.error(e)
  }
  if (decoded.length == 32) publicKey = Buffer.from(decoded);
  return publicKey;
}

net.createServer(function (local) {
  local.once("data", async function (data) {
    const server = sni(data);
    if (server) {
      const split = server.split('.');
      if (split[split.length - 3]) {
        let domain = await getKey(split[split.length - 3]);
        if (!domain) return;
        const socket = node.connect(domain);
        socket.write('https');
        socket.write(data);
        pump(local, socket, local);
      }
    }
  });
}).listen(443);
