const fs = require('fs');
const b32 = require('hi-base32');
const crypto = require("hypercore-crypto");

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter a unique private seed: ', function (password) {
  rl.question('Enter your contact email: ', function (email) {
    rl.question('Enter the destination address (e.g. https://example.org: ', function (address) {
      const keyPair = crypto.keyPair(crypto.data(Buffer.from(password)));
      const bkey = b32.encode(keyPair.publicKey).replace('====','').toLowerCase();
      console.log('Address will be: ', bkey+".matic.ml");
      fs.mkdirSync('sites/'+bkey+'/', { recursive: true }, (err) => {console.log(err)});
      fs.writeFileSync('.env', 'KEY='+password);
      fs.writeFileSync('sites/'+bkey+'/hyperconfig.json', JSON.stringify({key:password, target:address}]}));
      fs.writeFileSync('greenlock.d/config.json', JSON.stringify({sites:[{subject:bkey+".matic.ml"}]}));
      fs.writeFileSync('address', bkey+".matic.ml");
      rl.close();
    })
  })
});

rl.on('close', function () {
  console.log('\nBYE BYE !!!');
  process.exit(0);
});
