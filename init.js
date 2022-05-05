const fs = require('fs');
const b32 = require('hi-base32');
const crypto = require("hypercore-crypto");

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const run = (password, email, address)=>{
  const keyPair = crypto.keyPair(crypto.data(Buffer.from(password)));
  const bkey = b32.encode(keyPair.publicKey).replace('====','').toLowerCase();
  console.log('Address will be: ', bkey+".matic.ml");
  fs.mkdirSync('sites/'+bkey+'/', { recursive: true }, (err) => {console.log(err)});
  fs.writeFileSync('.env', 'KEY='+password);
  fs.writeFileSync('sites/'+bkey+'/hyperconfig.json', JSON.stringify({key:password, target:address}));
  fs.writeFileSync('sites/'+bkey+'/config.json', JSON.stringify({sites:[{subject:bkey+".matic.ml"}], maintainerEmail:email}));
  fs.writeFileSync('address', bkey+".matic.ml");
}


const args = process.argv.slice(2);
if(args.length && args[0] == '-q') {
  rl.question('Enter a unique private seed: ', function (password) {
    rl.question('Enter your contact email: ', function (email) {
      rl.question('Enter the destination address (e.g. https://example.org: ', function (address) {
        run(password, email, address);
        rl.close();
      })
    })
  });
} else {
  run(process.env.PASSWORD, process.env.EMAIL, process.env.ADDRESS)
}

rl.on('close', function () {
  process.exit(0);
});
