const fs = require('fs');
const b32 = require('hi-base32');
const crypto = require("hypercore-crypto");


const run = (password, email, address)=>{
  const keyPair = crypto.keyPair(crypto.data(Buffer.from(password)));
  const bkey = b32.encode(keyPair.publicKey).replace('====','').toLowerCase();
  console.log('Address will be: ', bkey+".matic.ml");
  fs.mkdirSync('sites/'+bkey+'/', { recursive: true }, (err) => {console.log(err)});
  fs.writeFileSync('.env', 'KEY='+password);
  fs.writeFileSync('sites/'+bkey+'/hyperconfig.json', JSON.stringify({key:password, target:address}));
  fs.writeFileSync('sites/'+bkey+'/config.json', JSON.stringify({sites:[{subject:bkey+".matic.ml"}], defaults:{subscriberEmail:email}}));
  fs.writeFileSync('address', bkey+".matic.ml");
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
  let password = process.env.password
  if(!password) password = await ask('Enter your private seed for key generation: ');
  let email = process.env.email;
  if(!email) email = await ask('Enter your contact email: ');
  let target = process.env.target;
  if(!target) target = await ask('enter the target address: ');
  
  run(password, email, target);

  rl.close();
}

module.exports = checks;
