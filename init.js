const fs = require('fs');
const b32 = require('hi-base32');
const crypto = require("hypercore-crypto");


const run = (email, address)=>{
  const keyPair = crypto.keyPair();
  const bkey = b32.encode(keyPair.publicKey).replace('====','').toLowerCase();
  console.log('Address will be: ', bkey+".sites.247420.xyz");
  fs.mkdirSync('site/', { recursive: true }, (err) => {console.log(err)});
  fs.writeFileSync('site/hyperconfig.json', JSON.stringify([process.env.domainname]));
  fs.writeFileSync('site/config.json', JSON.stringify({sites:[{subject:bkey+".sites.247420.xyz"},{subject:process.env.domainname+".sites.247420.xyz"}], defaults:{subscriberEmail:email}}));
  const router = {};
  router[bkey+".sites.247420.xyz"] = "http://localhost:8080";
  router[process.env.domainname+".sites.247420.xyz"] = "http://localhost:8080";
  fs.writeFileSync('site/routerconfig.json', JSON.stringify(router));
  fs.writeFileSync('address', bkey+".sites.247420.xyz");
}


const checks = async ()=>{
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  const ask = (q)=>{
    return new Promise(res=>{rl.question(q, result=>res(result))});
  }
  let email = process.env.email || process.argv.slice(2)[1];
  if(!email) email = await ask('Enter your contact email: ');
  let target = process.env.target;
  if(!target) target = await ask('enter the target address: ');
  
  run(email, target);

  rl.close();
}

module.exports = checks;
